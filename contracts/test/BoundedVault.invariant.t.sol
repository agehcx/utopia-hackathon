// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {BoundedVault} from "../src/BoundedVault.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

/// Random owner/agent/time actions; flags record any broken invariant.
contract Handler is Test {
    BoundedVault public vault;
    MockUSDC public usdc;
    address public owner = address(0xA11CE);
    address public agent = address(0xA6E);
    address public stranger = address(0xBAD);
    address[3] public recipients = [address(0x5E1), address(0x5E2), address(0x5E3)];
    uint256 public constant DAILY = 10e6;
    uint256 public policyRound;

    bool public dailyBroken;
    bool public allowlistBroken;
    bool public ownerBlocked;
    bool public frozenMoved;
    bool public decidedBroken;
    uint256 public proposals;
    uint256 public autos;

    constructor(BoundedVault v, MockUSDC t) {
        vault = v;
        usdc = t;
    }

    function propose(uint256 amtSeed, uint256 toSeed) external {
        uint256 amt = bound(amtSeed, 0, 6e6);
        address to = toSeed % 4 == 3 ? stranger : recipients[toSeed % 3];
        bool wasFrozen = vault.frozen();
        uint256 vaultBefore = usdc.balanceOf(address(vault));
        vm.recordLogs();
        vm.prank(agent);
        BoundedVault.Outcome o = vault.propose(address(usdc), to, amt);
        Vm.Log[] memory logs = vm.getRecordedLogs();
        proposals++;

        uint256 decided;
        for (uint256 i; i < logs.length; i++) {
            if (logs[i].topics[0] == BoundedVault.Decided.selector) decided++;
        }
        if (decided != 1) decidedBroken = true;

        if (wasFrozen && (o != BoundedVault.Outcome.Blocked || usdc.balanceOf(address(vault)) != vaultBefore)) {
            frozenMoved = true;
        }
        if (o == BoundedVault.Outcome.Auto) {
            autos++;
            if (!vault.isAllowed(to)) allowlistBroken = true;
            if (vault.spent(address(usdc), block.timestamp / 1 days) > DAILY) dailyBroken = true;
        }
    }

    function advance(uint256 secs) external {
        vm.warp(block.timestamp + bound(secs, 0, 2 days));
    }

    function ownerFreeze() external {
        vm.prank(owner);
        try vault.freeze() {} catch { ownerBlocked = true; }
    }

    function ownerUnfreeze() external {
        vm.prank(owner);
        vault.unfreeze();
    }

    function ownerWithdraw(uint256 amt) external {
        amt = bound(amt, 0, usdc.balanceOf(address(vault)));
        vm.prank(owner);
        try vault.withdraw(address(usdc), amt) {} catch { ownerBlocked = true; }
    }

    function ownerRotatePolicy() external {
        policyRound++;
        address[] memory l = new address[](1);
        l[0] = recipients[policyRound % 3];
        vm.prank(owner);
        vault.setPolicy(BoundedVault.Policy(uint64(block.timestamp + 30 days), 3, 1 hours, 0), l);
    }

    function ownerApproveOrReject(uint256 id, bool approve) external {
        uint256 n = vault.requestCount();
        if (n == 0) return;
        id = id % n;
        (,,, uint8 st) = vault.requests(id);
        if (st != 0) return;
        vm.prank(owner);
        if (approve) {
            if (usdc.balanceOf(address(vault)) < 6e6) return;
            vault.approve(id);
        } else {
            vault.reject(id);
        }
    }
}

contract BoundedVaultInvariantTest is Test {
    BoundedVault vault;
    MockUSDC usdc;
    Handler h;

    function setUp() public {
        vm.warp(1_700_000_000);
        usdc = new MockUSDC();
        address owner = address(0xA11CE);
        vault = new BoundedVault(owner);
        usdc.mint(owner, 1_000e6);
        vm.startPrank(owner);
        usdc.approve(address(vault), type(uint256).max);
        vault.deposit(address(usdc), 1_000e6);
        vault.setLimits(address(usdc), 2e6, 10e6);
        vault.setAgent(address(0xA6E));
        vm.stopPrank();
        h = new Handler(vault, usdc);
        h.ownerRotatePolicy(); // initial policy
        targetContract(address(h));
    }

    function invariant_autoSpendNeverExceedsDailyLimit() public view {
        assertFalse(h.dailyBroken());
    }

    function invariant_noAutoPaymentToNonAllowlisted() public view {
        assertFalse(h.allowlistBroken());
        assertEq(usdc.balanceOf(h.stranger()), 0);
    }

    function invariant_ownerWithdrawAndFreezeAlwaysSucceed() public view {
        assertFalse(h.ownerBlocked());
    }

    function invariant_frozenAgentMovesNothing() public view {
        assertFalse(h.frozenMoved());
    }

    function invariant_oneDecidedPerProposal() public view {
        assertFalse(h.decidedBroken());
        assertEq(vault.nextId(), h.proposals());
    }
}
