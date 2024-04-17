// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./interfaces/ForgerStakesV2.sol";

contract DelegatedStaking {

    bytes32 public signPublicKey;
    bytes32 public forgerVrf1;
    bytes1 public forgerVrf2;
    ForgerStakesV2 public forger;
    mapping(address => uint32) public lastClaimedEpochForAddress;
    uint32 public constant  MAX_NUMBER_OF_EPOCH = 100;

    struct ClaimData {
        uint32 epochNumber;
        uint256 claimedReward;
    }
    //events
    event Claim(address indexed signer, bytes32 indexed forgerVrf1, bytes1 indexed forgerVrf2, ClaimData[] claimData);
    event ReceivedFunds(address indexed sender, uint256 amount);
    //error
    error TooManyEpochs(uint256 lastClaimedEpoch, uint256 currentEpoch);
    error EpochAlreadyClaimed();
    error EpochStillNotReached();
    error PublicKeyNotCorrectForOwner(); 

    //constructor
    constructor(bytes32 _signPublicKey, bytes32 vrf1, bytes1 vrf2, ForgerStakesV2 _forger) {
        signPublicKey = _signPublicKey;
        forger = _forger;
        forgerVrf1 = vrf1;
        forgerVrf2 = vrf2;
    }

    //fallbacks so it can receive ethers
    fallback() external payable {
        emit ReceivedFunds(msg.sender, msg.value);
    }

    receive() external payable {
        emit ReceivedFunds(msg.sender, msg.value);
    }

    function claimReward(address payable owner) external {
        uint32 startEpoch = lastClaimedEpochForAddress[owner] + 1; //TODO first time it will start from 0. Is this correct?

        //uint32 lastEpoch = forger.getCurrentConsensusEpoch(); //TODO is this useful since we use max number of epoch?

        //get sum fees
        uint256[] memory sumFeeAccruedInEpoch = forger.rewardsReceived(signPublicKey, forgerVrf1, forgerVrf2, startEpoch, MAX_NUMBER_OF_EPOCH);
        uint256[] memory delegatorStakes = forger.stakeTotal(signPublicKey, forgerVrf1, forgerVrf2, owner, startEpoch, MAX_NUMBER_OF_EPOCH); 
        //TODO stakeDetail method does not exist, using stakeTotal with delegator
        uint256[] memory totalStakes = forger.stakeTotal(signPublicKey, forgerVrf1, forgerVrf2, address(0), startEpoch, MAX_NUMBER_OF_EPOCH); 
        //TODO using address(0) instead of null since null does not exist, is this correct?

        uint32 length = uint32(sumFeeAccruedInEpoch.length);
        ClaimData[] memory epochNumbersAndClaimedRewards = new ClaimData[](length);

        uint32 i; //loop
        uint32 epoch = startEpoch;
        while(i != length) {
            uint256 claimedReward = sumFeeAccruedInEpoch[i] * delegatorStakes[i] / totalStakes[i];
            owner.transfer(claimedReward);

            epochNumbersAndClaimedRewards[i] = ClaimData(epoch, claimedReward);
            unchecked { ++i; ++epoch; }
        }

        lastClaimedEpochForAddress[owner] = epoch;
    }
}