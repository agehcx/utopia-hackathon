// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {BoundedVault} from "../src/BoundedVault.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

/// Testnet only. PRIVATE_KEY is the deployer AND vault owner; AGENT_ADDRESS is the agent's own key's address.
/// forge script script/Deploy.s.sol --rpc-url fuji --broadcast
contract Deploy is Script {
    uint256 constant U = 1e6;

    function run() external {
        require(block.chainid == 43113 || block.chainid == 31337, "Fuji (43113) or local only");
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address agent = vm.envAddress("AGENT_ADDRESS");
        address dataService = vm.envOr("DATA_SERVICE_ADDRESS", address(0x5E1));
        address owner = vm.addr(pk);

        vm.startBroadcast(pk);
        MockUSDC usdc = new MockUSDC();
        BoundedVault vault = new BoundedVault(owner);

        usdc.mint(owner, 100 * U);
        usdc.approve(address(vault), 50 * U);
        vault.deposit(address(usdc), 50 * U);

        address[] memory list = new address[](1);
        list[0] = dataService;
        vault.setPolicy(BoundedVault.Policy(uint64(block.timestamp + 24 hours), 3, 1 hours, 0), list);
        vault.setLimits(address(usdc), 2 * U, 10 * U); // perTx 2, daily 10
        vault.setAgent(agent);
        vm.stopBroadcast();

        console.log("tUSDC", address(usdc));
        console.log("BoundedVault", address(vault));
        string memory json = string.concat(
            '{"chainId":', vm.toString(block.chainid),
            ',"usdc":"', vm.toString(address(usdc)),
            '","vault":"', vm.toString(address(vault)),
            '","owner":"', vm.toString(owner),
            '","agent":"', vm.toString(agent),
            '","dataService":"', vm.toString(dataService), '"}'
        );
        vm.writeFile("../src/config/deployments.json", json);
    }
}
