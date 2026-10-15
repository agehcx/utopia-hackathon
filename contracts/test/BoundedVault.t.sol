// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {BoundedVault} from "../src/BoundedVault.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract BoundedVaultTest is Test {
    uint256 constant U = 1e6;
    uint32 constant WINDOW = 1 hours;
    MockUSDC usdc;
    BoundedVault vault;
    address owner = address(0xA11CE);
    address agent = address(0xA6E);
    address svc = address(0x5E1);
    address svc2 = address(0x5E2);
    address stranger = address(0xBAD);

    event Proposed(uint256 indexed id, address token, address to, uint256 amount, uint32 policyVersion);
    event Decided(uint256 indexed id, BoundedVault.Outcome outcome, BoundedVault.Reason reason);
    event AgentFrozen(uint32 blockCount, uint32 window);
    event PolicyUpdated(uint32 version, bytes32 policyHash);
    event AgentRevoked(address indexed agent);

    function setUp() public {
        vm.warp(1_700_000_000);
        usdc = new MockUSDC();
        vault = new BoundedVault(owner);
        usdc.mint(owner, 100 * U);
        vm.deal(address(vault), 5 ether);
        vm.startPrank(owner);
        usdc.approve(address(vault), type(uint256).max);
        vault.deposit(address(usdc), 50 * U);
        _policy(3);
        vault.setLimits(address(usdc), 2 * U, 10 * U);
        vault.setLimits(address(0), 1 ether, 3 ether);
        vault.setAgent(agent);
        vm.stopPrank();
    }

    function _list(address a, address b) internal pure returns (address[] memory l) {
        l = new address[](b == address(0) ? 1 : 2);
        l[0] = a;
        if (b != address(0)) l[1] = b;
    }

    // caller must already be pranked as owner; allowlists svc
    function _policy(uint8 breakerN) internal {
        vault.setPolicy(
            BoundedVault.Policy(uint64(block.timestamp + 7 days), breakerN, WINDOW, 0), _list(svc, address(0))
        );
    }

    function _propose(address token, address to, uint256 amt, BoundedVault.Outcome o, BoundedVault.Reason r) internal {
        vm.expectEmit(true, false, false, true);
        emit Decided(vault.nextId(), o, r);
        vm.prank(agent);
        assertEq(uint8(vault.propose(token, to, amt)), uint8(o));
    }

    function _pay(uint256 amt) internal {
        _propose(address(usdc), svc, amt, BoundedVault.Outcome.Auto, BoundedVault.Reason.None);
    }

    function _blockOnce() internal {
        _propose(address(usdc), stranger, U, BoundedVault.Outcome.Blocked, BoundedVault.Reason.NotAllowlisted);
    }

    function _alignWindow() internal {
        vm.warp((block.timestamp / WINDOW + 1) * WINDOW);
    }

    // ---------- basic tiers ----------

    function test_freshVaultBlocksEverythingAsExpired() public {
        BoundedVault v = new BoundedVault(owner);
        vm.prank(owner);
        v.setAgent(agent);
        vm.expectEmit(true, false, false, true);
        emit Decided(0, BoundedVault.Outcome.Blocked, BoundedVault.Reason.Expired);
        vm.prank(agent);
        v.propose(address(usdc), svc, 1);
    }

    function test_inLimitAutoPays() public {
        vm.expectEmit(true, false, false, true);
        emit Proposed(0, address(usdc), svc, 2 * U, 1);
        _pay(2 * U);
        assertEq(usdc.balanceOf(svc), 2 * U);
        assertEq(vault.spent(address(usdc), block.timestamp / 1 days), 2 * U);
    }

    function test_overPerTxIsPendingThenApprovedExactlyOnce() public {
        _propose(address(usdc), svc, 3 * U, BoundedVault.Outcome.Pending, BoundedVault.Reason.OverLimit);
        assertEq(usdc.balanceOf(svc), 0);
        vm.startPrank(owner);
        vault.approve(0);
        assertEq(usdc.balanceOf(svc), 3 * U);
        vm.expectRevert(BoundedVault.NotPending.selector);
        vault.approve(0);
        vm.stopPrank();
        assertEq(usdc.balanceOf(svc), 3 * U);
    }

    function test_overDailyIsPending() public {
        for (uint256 i; i < 5; i++) _pay(2 * U);
        _propose(address(usdc), svc, 1, BoundedVault.Outcome.Pending, BoundedVault.Reason.OverLimit);
    }

    function test_rejectedCannotBeApproved() public {
        _propose(address(usdc), svc, 3 * U, BoundedVault.Outcome.Pending, BoundedVault.Reason.OverLimit);
        vm.startPrank(owner);
        vault.reject(0);
        vm.expectRevert(BoundedVault.NotPending.selector);
        vault.approve(0);
        vm.expectRevert(BoundedVault.BadId.selector);
        vault.approve(99);
        vm.stopPrank();
    }

    function test_notAllowlistedBlocked() public {
        _blockOnce();
    }

    function test_expiredBlocked() public {
        vm.warp(block.timestamp + 7 days + 1);
        _propose(address(usdc), svc, U, BoundedVault.Outcome.Blocked, BoundedVault.Reason.Expired);
    }

    function test_insufficientBalanceIsBlockNotRevert() public {
        vm.prank(owner);
        vault.setLimits(address(usdc), 1000 * U, 1000 * U);
        _propose(address(usdc), svc, 60 * U, BoundedVault.Outcome.Blocked, BoundedVault.Reason.InsufficientBalance);
    }

    function test_nonAgentReverts() public {
        vm.prank(stranger);
        vm.expectRevert(BoundedVault.NotAgent.selector);
        vault.propose(address(usdc), svc, 1);
        vm.prank(owner);
        vm.expectRevert(BoundedVault.NotAgent.selector);
        vault.propose(address(usdc), svc, 1);
    }

    function test_revokeAgentStopsProposals() public {
        vm.expectEmit(true, false, false, false);
        emit AgentRevoked(agent);
        vm.prank(owner);
        vault.revokeAgent();
        vm.prank(agent);
        vm.expectRevert(BoundedVault.NotAgent.selector);
        vault.propose(address(usdc), svc, 1);
    }

    // ---------- circuit breaker ----------

    function test_breakerFreezesAtNBlocksInWindow() public {
        _alignWindow();
        _blockOnce();
        _blockOnce();
        assertFalse(vault.frozen());
        vm.expectEmit(true, false, false, true);
        emit Decided(vault.nextId(), BoundedVault.Outcome.Blocked, BoundedVault.Reason.NotAllowlisted);
        vm.expectEmit(false, false, false, true);
        emit AgentFrozen(3, WINDOW);
        vm.prank(agent);
        vault.propose(address(usdc), stranger, U);
        assertTrue(vault.frozen());
        // frozen: even a valid payment is logged Blocked/Frozen and moves nothing
        _propose(address(usdc), svc, U, BoundedVault.Outcome.Blocked, BoundedVault.Reason.Frozen);
        assertEq(usdc.balanceOf(svc), 0);
    }

    function test_breakerCounterResetsInNewWindow() public {
        _alignWindow();
        _blockOnce();
        _blockOnce();
        vm.warp(block.timestamp + WINDOW);
        _blockOnce();
        _blockOnce();
        assertFalse(vault.frozen());
    }

    function test_unfreezeResetsCounter() public {
        _alignWindow();
        for (uint256 i; i < 3; i++) _blockOnce();
        assertTrue(vault.frozen());
        vm.prank(owner);
        vault.unfreeze();
        _blockOnce();
        assertFalse(vault.frozen(), "one block after unfreeze must not re-freeze");
        _pay(U);
    }

    function test_breakerDisabledWhenThresholdZero() public {
        vm.startPrank(owner);
        _policy(0);
        vm.stopPrank();
        for (uint256 i; i < 10; i++) _blockOnce();
        assertFalse(vault.frozen());
    }

    function test_ownerApproveWorksWhileFrozen() public {
        _propose(address(usdc), svc, 3 * U, BoundedVault.Outcome.Pending, BoundedVault.Reason.OverLimit);
        vm.startPrank(owner);
        vault.freeze();
        vault.approve(0);
        vm.stopPrank();
        assertEq(usdc.balanceOf(svc), 3 * U);
    }

    // ---------- policy ----------

    function test_policyReplacementDropsOldAllowlist() public {
        assertTrue(vault.isAllowed(svc));
        vm.prank(owner);
        vault.setPolicy(
            BoundedVault.Policy(uint64(block.timestamp + 1 days), 3, WINDOW, 777), _list(svc2, address(0))
        );
        assertFalse(vault.isAllowed(svc));
        assertTrue(vault.isAllowed(svc2));
        _propose(address(usdc), svc, U, BoundedVault.Outcome.Blocked, BoundedVault.Reason.NotAllowlisted);
    }

    function test_versionIncrementsAndCallerValueIgnored() public {
        (,,, uint32 v1) = vault.policy();
        assertEq(v1, 1);
        BoundedVault.Policy memory p = BoundedVault.Policy(uint64(block.timestamp + 1 days), 3, WINDOW, 999);
        address[] memory l = _list(svc, svc2);
        BoundedVault.Policy memory stored = BoundedVault.Policy(p.expiry, 3, WINDOW, 2);
        vm.expectEmit(false, false, false, true);
        emit PolicyUpdated(2, keccak256(abi.encode(stored, l)));
        vm.prank(owner);
        vault.setPolicy(p, l);
        (,,, uint32 v2) = vault.policy();
        assertEq(v2, 2);
    }

    // ---------- time buckets ----------

    function test_dailyBucketResetsNextDay() public {
        for (uint256 i; i < 5; i++) _pay(2 * U);
        vm.warp(block.timestamp + 1 days);
        _pay(2 * U);
        assertEq(vault.spent(address(usdc), block.timestamp / 1 days), 2 * U);
    }

    function test_utcBoundaryAllowsUpTo2xAcrossMidnight() public {
        vm.warp((block.timestamp / 1 days + 1) * 1 days - 1);
        for (uint256 i; i < 5; i++) _pay(2 * U);
        vm.warp(block.timestamp + 1);
        for (uint256 i; i < 5; i++) _pay(2 * U);
        assertEq(usdc.balanceOf(svc), 20 * U); // documented 2x edge
    }

    // ---------- AVAX ----------

    function test_avaxAutoAndPending() public {
        _propose(address(0), svc, 1 ether, BoundedVault.Outcome.Auto, BoundedVault.Reason.None);
        assertEq(svc.balance, 1 ether);
        _propose(address(0), svc, 2 ether, BoundedVault.Outcome.Pending, BoundedVault.Reason.OverLimit);
        vm.prank(owner);
        vault.approve(0);
        assertEq(svc.balance, 3 ether);
    }

    function test_avaxReceiveAndOwnerWithdraw() public {
        vm.deal(owner, 1 ether);
        vm.prank(owner);
        (bool ok,) = address(vault).call{value: 1 ether}("");
        assertTrue(ok);
        vm.prank(owner);
        vault.withdraw(address(0), 6 ether);
        assertEq(owner.balance, 6 ether);
    }

    // ---------- owner paths ----------

    function test_withdrawOwnerOnlyAndAlwaysWorks() public {
        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, agent));
        vault.withdraw(address(usdc), 1);
        vm.startPrank(owner);
        vault.freeze();
        vault.revokeAgent();
        vault.withdraw(address(usdc), 50 * U);
        vm.stopPrank();
        assertEq(usdc.balanceOf(owner), 100 * U);
    }

    function test_policyLimitsUnfreezeAreOwnerOnly() public {
        vm.startPrank(agent);
        bytes memory err = abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, agent);
        vm.expectRevert(err);
        vault.setPolicy(BoundedVault.Policy(type(uint64).max, 0, 0, 0), _list(agent, address(0)));
        vm.expectRevert(err);
        vault.setLimits(address(usdc), 1e30, 1e30);
        vm.expectRevert(err);
        vault.unfreeze();
        vm.stopPrank();
    }
}
