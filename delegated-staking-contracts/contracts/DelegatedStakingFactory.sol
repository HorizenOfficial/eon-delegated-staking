// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./interfaces/ForgerStakesV2.sol";
import "./DelegatedStaking.sol";

contract DelegatedStakingFactory {

    struct ForgerKey {
        bytes32 signPubKey;
        bytes32 vrf1;
        bytes1 vrf2;
    }

    mapping(bytes32 => mapping(bytes32 => mapping(bytes1 => address[]))) public deployedContractsFromParams;
    mapping(address => ForgerKey) public forgerKeyFromContractAddress;
    //events
    event ContractDeployed(address deployedContract, bytes32 indexed signPubKey, bytes32 indexed vrf1, bytes1 indexed vrf2);

    function deployDelegatedStakingReferenceImplementation(bytes32 signPubKey, bytes32 vrf1, bytes1 vrf2) public returns(DelegatedStaking) {
        DelegatedStaking newInstance = new DelegatedStaking(signPubKey, vrf1, vrf2);
        
        deployedContractsFromParams[signPubKey][vrf1][vrf2].push(address(newInstance));
        forgerKeyFromContractAddress[address(newInstance)] = ForgerKey(signPubKey, vrf1, vrf2);

        emit ContractDeployed(address(newInstance), signPubKey, vrf1, vrf2);
        return newInstance;
    }
}