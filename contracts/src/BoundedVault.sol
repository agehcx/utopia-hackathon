// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// The vault is the sole authority over fund movement. The agent can only `propose`.
/// Unaudited. Token address(0) means native AVAX.
/// Blocks RETURN and emit events instead of reverting: a revert would roll back the
/// event and the breaker counter, erasing the block from the audit trail.
/// Known edges: UTC day buckets allow up to 2x the daily limit across midnight; an AVAX
/// payment to an allowlisted contract that reverts on receive reverts the whole propose.
contract BoundedVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Outcome { Auto, Pending, Blocked }
    enum Reason { None, Frozen, Expired, NotAllowlisted, OverLimit, InsufficientBalance }

    struct Policy {
        uint64 expiry;
        uint8 breakerThreshold; // N blocks in a window freeze the agent; 0 disables
        uint32 breakerWindow; // W seconds (fixed buckets)
        uint32 version; // assigned by the contract; caller value ignored
    }

    struct Limits { uint256 perTx; uint256 daily; }

    struct Request { address token; address to; uint256 amount; uint8 status; } // 0 pending, 1 approved, 2 rejected

    address public agent;
    bool public frozen;
    Policy public policy; // fresh vault: expiry 0, so everything is Blocked/Expired until first setPolicy
    uint256 public nextId;
    Request[] public requests;
    mapping(address => Limits) public limits; // per token, in that token's raw units
    mapping(uint32 => mapping(address => bool)) private _allowed; // keyed by policy version
    mapping(address => mapping(uint256 => uint256)) public spent; // token => UTC day => auto-spent
    uint256 public breakerBucket;
    uint256 public blockCount;

    error NotAgent();
    error NotPending();
    error BadId();
    error SendFailed();

    event Proposed(uint256 indexed id, address token, address to, uint256 amount, uint32 policyVersion);
    event Decided(uint256 indexed id, Outcome outcome, Reason reason);
    event Approved(uint256 indexed id);
    event Rejected(uint256 indexed id);
    event AgentFrozen(uint32 blockCount, uint32 window);
    event AgentUnfrozen();
    event PolicyUpdated(uint32 version, bytes32 policyHash);
    event LimitsUpdated(address indexed token, uint256 perTx, uint256 daily);
    event AgentSet(address indexed agent);
    event AgentRevoked(address indexed agent);
    event Deposited(address indexed token, uint256 amount);
    event Withdrawn(address indexed token, uint256 amount);

    modifier onlyAgent() {
        if (msg.sender != agent) revert NotAgent();
        _;
    }

    constructor(address owner_) Ownable(owner_) {}

    receive() external payable {
        emit Deposited(address(0), msg.value);
    }

    // ---------- agent ----------

    function propose(address token, address to, uint256 amount) external onlyAgent nonReentrant returns (Outcome) {
        uint256 id = nextId++;
        emit Proposed(id, token, to, amount, policy.version);
        (Outcome o, Reason r) = _evaluate(token, to, amount);
        if (o == Outcome.Auto) {
            spent[token][block.timestamp / 1 days] += amount;
            _send(token, to, amount);
        } else if (o == Outcome.Pending) {
            requests.push(Request(token, to, amount, 0));
        }
        emit Decided(id, o, r);
        if (o == Outcome.Blocked && r != Reason.Frozen) _recordBlock();
        return o;
    }

    // ---------- owner (withdraw, freeze, reject never depend on agent or policy state) ----------

    function setPolicy(Policy calldata p, address[] calldata list) external onlyOwner {
        uint32 v = policy.version + 1;
        policy = Policy(p.expiry, p.breakerThreshold, p.breakerWindow, v);
        for (uint256 i; i < list.length; i++) _allowed[v][list[i]] = true; // old version's entries die
        emit PolicyUpdated(v, keccak256(abi.encode(policy, list)));
    }

    function setLimits(address token, uint256 perTx, uint256 daily) external onlyOwner {
        limits[token] = Limits(perTx, daily);
        emit LimitsUpdated(token, perTx, daily);
    }

    function setAgent(address a) external onlyOwner {
        agent = a;
        emit AgentSet(a);
    }

    function revokeAgent() external onlyOwner {
        emit AgentRevoked(agent);
        agent = address(0);
    }

    function freeze() external onlyOwner {
        frozen = true;
        emit AgentFrozen(uint32(blockCount), policy.breakerWindow);
    }

    function unfreeze() external onlyOwner {
        frozen = false;
        blockCount = 0;
        emit AgentUnfrozen();
    }

    function approve(uint256 id) external onlyOwner nonReentrant {
        Request storage r = _pending(id);
        r.status = 1; // before the transfer: no replay
        _send(r.token, r.to, r.amount);
        emit Approved(id);
    }

    function reject(uint256 id) external onlyOwner {
        _pending(id).status = 2;
        emit Rejected(id);
    }

    function deposit(address token, uint256 amount) external onlyOwner nonReentrant {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(token, amount);
    }

    function withdraw(address token, uint256 amount) external onlyOwner nonReentrant {
        _send(token, msg.sender, amount);
        emit Withdrawn(token, amount);
    }

    // ---------- views ----------

    function isAllowed(address who) external view returns (bool) {
        return _allowed[policy.version][who];
    }

    function requestCount() external view returns (uint256) {
        return requests.length;
    }

    // ---------- internal ----------

    function _evaluate(address token, address to, uint256 amount) internal view returns (Outcome, Reason) {
        if (frozen) return (Outcome.Blocked, Reason.Frozen);
        if (block.timestamp > policy.expiry) return (Outcome.Blocked, Reason.Expired);
        if (!_allowed[policy.version][to]) return (Outcome.Blocked, Reason.NotAllowlisted);
        Limits memory l = limits[token];
        if (amount > l.perTx || spent[token][block.timestamp / 1 days] + amount > l.daily) {
            return (Outcome.Pending, Reason.OverLimit);
        }
        uint256 bal = token == address(0) ? address(this).balance : IERC20(token).balanceOf(address(this));
        if (bal < amount) return (Outcome.Blocked, Reason.InsufficientBalance);
        return (Outcome.Auto, Reason.None);
    }

    function _recordBlock() internal {
        Policy memory p = policy;
        if (p.breakerThreshold == 0 || p.breakerWindow == 0) return;
        uint256 bucket = block.timestamp / p.breakerWindow;
        if (bucket != breakerBucket) {
            breakerBucket = bucket;
            blockCount = 0;
        }
        if (++blockCount >= p.breakerThreshold) {
            frozen = true;
            emit AgentFrozen(uint32(blockCount), p.breakerWindow);
        }
    }

    function _pending(uint256 id) internal view returns (Request storage r) {
        if (id >= requests.length) revert BadId();
        r = requests[id];
        if (r.status != 0) revert NotPending();
    }

    function _send(address token, address to, uint256 amount) internal {
        if (token == address(0)) {
            (bool ok,) = to.call{value: amount}("");
            if (!ok) revert SendFailed();
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }
}
