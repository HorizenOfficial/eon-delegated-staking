// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "../DelegatedStaking.sol";

//implementation used in tests to be able to send ETH to contract
//and to be able to set a custom address as forger instead of the cabled one
contract TestDelegatedStaking is DelegatedStaking {

    constructor(bytes32 _signPublicKey, bytes32 vrf1, bytes1 vrf2, ForgerStakesV2 _forger) 
    DelegatedStaking(_signPublicKey, vrf1, vrf2, 2300) {
        forger = _forger;
    }
    
    //fallbacks so it can receive ethers
    fallback() external payable {}
    receive() external payable {}
}