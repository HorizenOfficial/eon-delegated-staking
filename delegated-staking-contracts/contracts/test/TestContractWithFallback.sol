// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

//implementation used in tests to be able to send ETH to contract
//and to be able to set a custom address as forger instead of the cabled one
contract TestContractWithFallback {

    uint256 var1;    

    //fallback that do operations that spend gas
    receive() external payable {

        var1 = msg.value;
        for(uint256 i; i != 10; ++i) {
            var1 = var1 + msg.value*i;
        }
    }
}