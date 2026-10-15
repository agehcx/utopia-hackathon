// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AgentVault} from "../src/AgentVault.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract AgentVaultTest is Test {
    uint256 constant U = 1e6;
    MockUSDC usdc;
    AgentVault vault;
    address owner = address(0xA11CE);
    address agent = address(0xA6E);
    address svc = address(0x5E1);
    address stranger = address(0xBAD);

    event PaymentExecuted(address indexed to, uint256 amount, string reason);
    event ActionBlocked(address indexed to, uint256 amount, AgentVault.Reason reasonCode, string reason);
    event RequestCreated(uint256 indexed id, address indexed to, uint256 amount, string reason);
    event AgentRevoked(address indexed agent);

    function setUp() public {
        vm.warp(1_700_000_000);
        usdc = new MockUSDC();
        vault = new AgentVault(address(usdc), owner);
        usdc.mint(owner, 100 * U);
        vm.startPrank(owner);
        usdc.approve(address(vault), type(uint256).max);
        vault.deposit(50 * U);
        vault.setPolicy(2 * U, 10 * U, block.timestamp + 7 days);
        vault.setAllowed(svc, true);
        vault.setAgent(agent);
        vm.stopPrank();
    }

    function _blockedWith(AgentVault.Reason r, address to, uint256 amt) internal {
        uint256 before = usdc.balanceOf(to);
        vm.expectEmit(true, false, false, true);
        emit ActionBlocked(to, amt, r, "x");
        vm.prank(agent);
        vault.agentPay(to, amt, "x");
        assertEq(usdc.balanceOf(to), before, "no funds moved");
    }

    function test_inLimitPaymentSucceeds() public {
        vm.expectEmit(true, false, false, true);
        emit PaymentExecuted(svc, 2 * U, "data");
        vm.prank(agent);
        vault.agentPay(svc, 2 * U, "data");
        assertEq(usdc.balanceOf(svc), 2 * U);
        assertEq(vault.spentToday(), 2 * U);
    }

    function test_overPerTxBlocked() public {
        _blockedWith(AgentVault.Reason.OVER_PER_TX, svc, 3 * U);
    }

    function test_overPerTxCanBeRequestedThenApprovedOnce() public {
        vm.expectEmit(true, true, false, true);
        emit RequestCreated(0, svc, 3 * U, "big");
        vm.prank(agent);
        vault.agentRequest(svc, 3 * U, "big");

        vm.prank(owner);
        vault.approveRequest(0);
        assertEq(usdc.balanceOf(svc), 3 * U);

        vm.prank(owner);
        vm.expectRevert(AgentVault.NotPending.selector);
        vault.approveRequest(0);
        assertEq(usdc.balanceOf(svc), 3 * U, "paid exactly once");
    }

    function test_rejectedRequestCannotBeApproved() public {
        vm.prank(agent);
        vault.agentRequest(svc, 3 * U, "big");
        vm.startPrank(owner);
        vault.rejectRequest(0);
        vm.expectRevert(AgentVault.NotPending.selector);
        vault.approveRequest(0);
        vm.stopPrank();
    }

    function test_approveWhilePausedReverts() public {
        vm.prank(agent);
        vault.agentRequest(svc, 3 * U, "big");
        vm.startPrank(owner);
        vault.pause();
        vm.expectRevert(AgentVault.IsPaused.selector);
        vault.approveRequest(0);
        vm.stopPrank();
    }

    function test_overDailyBlocked() public {
        for (uint256 i; i < 5; i++) {
            vm.prank(agent);
            vault.agentPay(svc, 2 * U, "ok");
        }
        assertEq(vault.spentToday(), 10 * U);
        _blockedWith(AgentVault.Reason.OVER_DAILY, svc, 1);
    }

    function test_notAllowlistedBlocked() public {
        _blockedWith(AgentVault.Reason.NOT_ALLOWLISTED, stranger, 1 * U);
    }

    function test_expiredBlocked() public {
        vm.warp(block.timestamp + 7 days + 1);
        _blockedWith(AgentVault.Reason.EXPIRED, svc, 1 * U);
    }

    function test_pausedBlocked() public {
        vm.prank(owner);
        vault.pause();
        _blockedWith(AgentVault.Reason.PAUSED, svc, 1 * U);
    }

    function test_requestBlockedWhenNotAllowlisted() public {
        vm.expectEmit(true, false, false, true);
        emit ActionBlocked(stranger, 1 * U, AgentVault.Reason.NOT_ALLOWLISTED, "x");
        vm.prank(agent);
        vault.agentRequest(stranger, 1 * U, "x");
        assertEq(vault.requestCount(), 0);
    }

    function test_nonAgentCannotPay() public {
        vm.prank(stranger);
        vm.expectRevert(AgentVault.NotAgent.selector);
        vault.agentPay(svc, 1 * U, "x");
        vm.prank(owner);
        vm.expectRevert(AgentVault.NotAgent.selector);
        vault.agentRequest(svc, 1 * U, "x");
    }

    function test_dailyWindowResetsAfter24h() public {
        for (uint256 i; i < 5; i++) {
            vm.prank(agent);
            vault.agentPay(svc, 2 * U, "ok");
        }
        vm.warp(block.timestamp + 1 days);
        vm.prank(agent);
        vault.agentPay(svc, 2 * U, "next day");
        assertEq(vault.spentToday(), 2 * U);
        assertEq(usdc.balanceOf(svc), 12 * U);
    }

    function test_revokeAgentStopsAllCalls() public {
        vm.expectEmit(true, false, false, false);
        emit AgentRevoked(agent);
        vm.prank(owner);
        vault.revokeAgent();
        assertEq(vault.agent(), address(0));

        vm.startPrank(agent);
        vm.expectRevert(AgentVault.NotAgent.selector);
        vault.agentPay(svc, 1 * U, "x");
        vm.expectRevert(AgentVault.NotAgent.selector);
        vault.agentRequest(svc, 1 * U, "x");
        vm.stopPrank();
    }

    function test_withdrawIsOwnerOnly() public {
        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, agent));
        vault.withdraw(1 * U);

        vm.prank(owner);
        vault.withdraw(10 * U);
        assertEq(usdc.balanceOf(owner), 60 * U);
    }

    function test_policyAndAllowlistAreOwnerOnly() public {
        vm.startPrank(agent);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, agent));
        vault.setPolicy(100 * U, 100 * U, type(uint256).max);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, agent));
        vault.setAllowed(stranger, true);
        vm.stopPrank();
    }
}
