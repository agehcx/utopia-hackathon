// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// Vault that lets an AI agent spend the owner's tokens only inside owner-set rules.
/// The contract is the sole authority; it reads no off-chain data.
contract AgentVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Reason { PAUSED, EXPIRED, NOT_ALLOWLISTED, OVER_PER_TX, OVER_DAILY }

    struct Request {
        address to;
        uint256 amount;
        string reason;
        uint8 status; // 0=Pending, 1=Approved, 2=Rejected
    }

    IERC20 public immutable token;
    address public agent;
    uint256 public perTxLimit;
    uint256 public dailyLimit;
    uint256 public spentToday;
    uint256 public dayStart;
    uint256 public expiry;
    bool public paused;
    mapping(address => bool) public allowlist;
    Request[] public requests;

    error NotAgent();
    error NotPending();
    error IsPaused();
    error BadRequest();

    event Deposited(uint256 amount);
    event Withdrawn(uint256 amount);
    event PolicyUpdated(uint256 perTx, uint256 daily, uint256 expiry);
    event AllowlistUpdated(address indexed who, bool allowed);
    event PaymentExecuted(address indexed to, uint256 amount, string reason);
    event ActionBlocked(address indexed to, uint256 amount, Reason reasonCode, string reason);
    event RequestCreated(uint256 indexed id, address indexed to, uint256 amount, string reason);
    event RequestApproved(uint256 indexed id);
    event RequestRejected(uint256 indexed id);
    event AgentRevoked(address indexed agent);
    event AgentSet(address indexed agent);
    event Paused();
    event Unpaused();

    modifier onlyAgent() {
        if (msg.sender != agent) revert NotAgent();
        _;
    }

    constructor(address token_, address owner_) Ownable(owner_) {
        token = IERC20(token_);
        dayStart = block.timestamp;
    }

    // ---------- owner ----------

    function deposit(uint256 amount) external onlyOwner nonReentrant {
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(amount);
    }

    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        token.safeTransfer(msg.sender, amount);
        emit Withdrawn(amount);
    }

    function setPolicy(uint256 perTx, uint256 daily, uint256 expiry_) external onlyOwner {
        perTxLimit = perTx;
        dailyLimit = daily;
        expiry = expiry_;
        emit PolicyUpdated(perTx, daily, expiry_);
    }

    function setAllowed(address who, bool allowed) external onlyOwner {
        allowlist[who] = allowed;
        emit AllowlistUpdated(who, allowed);
    }

    function setAgent(address a) external onlyOwner {
        agent = a;
        emit AgentSet(a);
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused();
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused();
    }

    function revokeAgent() external onlyOwner {
        emit AgentRevoked(agent);
        agent = address(0);
    }

    /// Owner pays a pending request. Status flips before transfer, so it can never replay.
    function approveRequest(uint256 id) external onlyOwner nonReentrant {
        if (paused) revert IsPaused();
        if (id >= requests.length) revert BadRequest();
        Request storage r = requests[id];
        if (r.status != 0) revert NotPending();
        r.status = 1;
        token.safeTransfer(r.to, r.amount);
        emit RequestApproved(id);
        emit PaymentExecuted(r.to, r.amount, r.reason);
    }

    function rejectRequest(uint256 id) external onlyOwner {
        if (id >= requests.length) revert BadRequest();
        Request storage r = requests[id];
        if (r.status != 0) revert NotPending();
        r.status = 2;
        emit RequestRejected(id);
    }

    // ---------- agent ----------
    // Violations emit ActionBlocked and RETURN instead of reverting: a revert would roll
    // back the event and erase the block from the on-chain audit trail.

    function agentPay(address to, uint256 amount, string calldata reason) external onlyAgent nonReentrant {
        _rollDay();
        (bool ok, Reason code) = _check(to, amount, true);
        if (!ok) {
            emit ActionBlocked(to, amount, code, reason);
            return;
        }
        spentToday += amount;
        token.safeTransfer(to, amount);
        emit PaymentExecuted(to, amount, reason);
    }

    function agentRequest(address to, uint256 amount, string calldata reason) external onlyAgent {
        (bool ok, Reason code) = _check(to, amount, false);
        if (!ok) {
            emit ActionBlocked(to, amount, code, reason);
            return;
        }
        requests.push(Request(to, amount, reason, 0));
        emit RequestCreated(requests.length - 1, to, amount, reason);
    }

    function requestCount() external view returns (uint256) {
        return requests.length;
    }

    function _rollDay() internal {
        if (block.timestamp >= dayStart + 1 days) {
            dayStart = block.timestamp;
            spentToday = 0;
        }
    }

    /// Rules in fixed order; `limits` false for requests (over-limit amounts need owner approval instead).
    function _check(address to, uint256 amount, bool limits) internal view returns (bool, Reason) {
        if (paused) return (false, Reason.PAUSED);
        if (block.timestamp > expiry) return (false, Reason.EXPIRED);
        if (!allowlist[to]) return (false, Reason.NOT_ALLOWLISTED);
        if (limits) {
            if (amount > perTxLimit) return (false, Reason.OVER_PER_TX);
            if (spentToday + amount > dailyLimit) return (false, Reason.OVER_DAILY);
        }
        return (true, Reason.PAUSED);
    }
}
