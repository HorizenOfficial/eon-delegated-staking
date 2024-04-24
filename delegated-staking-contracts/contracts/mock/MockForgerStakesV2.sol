// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "../interfaces/ForgerStakesV2.sol";

contract MockForgerStakesV2 is ForgerStakesV2 {

    uint32 currentEpoch;
    mapping(uint32 => uint256) rewardsForEpoch;
    mapping(address => mapping(uint32 => uint256)) stakeForAddressAndEpoch;
    mapping(uint32 => uint256) totalStakeForEpoch;
    mapping(address => bool) addressAlreadyStaked;
    mapping(address => uint32) startEpochForAddress;


    //Methods not useful for this test
   
    function registerForger(bytes32 signPubKey, bytes32 vrf1, bytes1 vrf2, uint32 rewardShare, address reward_address) external payable {}
    function updateForger(bytes32 signPubKey, bytes32 vrf1, bytes1 vrf2, uint32 rewardShare, address reward_address, bytes32 signature1, bytes32 signature2) external {}
    function delegate(bytes32 signPubKey, bytes32 vrf1, bytes1 vrf2) external payable {}
    function withdraw(bytes32 signPubKey, bytes32 vrf1, bytes1 vrf2, uint256 amount) external {}
    function getForger(bytes32, bytes32, bytes1) external pure returns (ForgerInfo memory forgerInfo) {
        forgerInfo = ForgerInfo("", "", "", 0, address(0));
    }
    function getPagedForgers(int32, int32) external pure returns (int32 nextIndex, ForgerInfo[] memory listOfForgerInfo) {
        nextIndex = -1;
        listOfForgerInfo = new ForgerInfo[](0);
        return (nextIndex, listOfForgerInfo);
    }
    function getPagedForgersStakesByForger(bytes32, bytes32, bytes1, int32, int32) external pure returns (int32 nextIndex, StakeDataDelegator[] memory listOfDelegatorStakes) {
        nextIndex = -1;
        listOfDelegatorStakes = new StakeDataDelegator[](0);
        return (nextIndex, listOfDelegatorStakes);
    }
    function getPagedForgersStakesByDelegator(address, int32, int32) external pure returns (int32 nextIndex, StakeDataForger[] memory listOfForgerStakes)  {
        nextIndex = -1;
        listOfForgerStakes = new StakeDataForger[](0);
        return (nextIndex, listOfForgerStakes);
    }
    function activate() external {}


    //write mock methods
    function mockCurrentEpoch(uint32 _currentEpoch) external {
        currentEpoch = _currentEpoch;
    } 
    function mockRewardForEpoch(uint32 epoch, uint256 reward) external {
        rewardsForEpoch[epoch] = reward;
    }
    function mockStakeForEpoch(uint32 epoch, address delegator, uint256 value) external {
        if(!addressAlreadyStaked[delegator]) {
            addressAlreadyStaked[delegator] = true;
            startEpochForAddress[delegator] = epoch;
        }
        stakeForAddressAndEpoch[delegator][epoch] = value;
        totalStakeForEpoch[epoch] += value;
    }

    //read methods
    function stakeTotal(bytes32, bytes32, bytes1, address delegator, uint32 consensusEpochStart, uint32 maxNumOfEpoch) external view returns (uint256[] memory listOfStakes) {
        
        mapping(uint32 => uint256) storage source = delegator == address(0) ? totalStakeForEpoch : stakeForAddressAndEpoch[delegator];
        uint32 length = currentEpoch > (consensusEpochStart + maxNumOfEpoch)? maxNumOfEpoch : currentEpoch - consensusEpochStart + 1;
        listOfStakes = new uint256[](length);
        
        uint32 i;
        while(i < length) {
            listOfStakes[i] = source[consensusEpochStart+i];
            unchecked { ++i; }
        }
    }

    function rewardsReceived(bytes32, bytes32, bytes1, uint32 consensusEpochStart, uint32 maxNumOfEpoch) external view returns (uint256[] memory listOfRewards) {
        uint32 length = currentEpoch > (consensusEpochStart + maxNumOfEpoch)? maxNumOfEpoch : currentEpoch - consensusEpochStart + 1;
        listOfRewards = new uint256[](length);

        uint32 i;
        while(i < length) {
            listOfRewards[i] = rewardsForEpoch[consensusEpochStart+i];
            unchecked { ++i; }
        }
    }

    function getCurrentConsensusEpoch() external view returns (uint32 epoch) {
        epoch = currentEpoch;
    }

    function stakeStart(bytes32, bytes32, bytes1, address delegator) external view returns (int32 consensusEpochStart){
        if(!addressAlreadyStaked[delegator]) return -1;
        return int32(startEpochForAddress[delegator]);
    }

}