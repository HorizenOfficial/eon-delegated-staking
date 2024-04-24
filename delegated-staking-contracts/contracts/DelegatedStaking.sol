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
        uint32 startEpoch = _getStartEpochForAddress(owner);
        //uint32 lastEpoch = forger.getCurrentConsensusEpoch(); //TODO is this useful since we use max number of epoch?

        //get sum fees
        uint256[] memory sumFeeAccruedInEpoch = forger.rewardsReceived(signPublicKey, forgerVrf1, forgerVrf2, startEpoch, MAX_NUMBER_OF_EPOCH);
        uint32 length = uint32(sumFeeAccruedInEpoch.length);
    
        uint256[] memory delegatorStakes = forger.stakeTotal(signPublicKey, forgerVrf1, forgerVrf2, owner, startEpoch - 2, MAX_NUMBER_OF_EPOCH); 
        uint256[] memory totalStakes = forger.stakeTotal(signPublicKey, forgerVrf1, forgerVrf2, address(0), startEpoch - 2, MAX_NUMBER_OF_EPOCH); 

        ClaimData[] memory epochNumbersAndClaimedRewards = new ClaimData[](length);

        uint32 i; //loop
        uint32 epoch = startEpoch;
        while(i != length) {
            uint256 claimedReward;

            if(totalStakes[i] == 0) {
                claimedReward = 0; //avoid divison by 0
            }
            else {
                claimedReward = sumFeeAccruedInEpoch[i] * delegatorStakes[i] / totalStakes[i];
            }

            if(claimedReward > 0) {
                owner.transfer(claimedReward);
            }

            epochNumbersAndClaimedRewards[i] = ClaimData(epoch, claimedReward);
            unchecked { ++i; ++epoch; }
        }

        lastClaimedEpochForAddress[owner] = epoch - 1;
    }

    function _getStartEpochForAddress(address owner) internal view returns(uint32) {
        uint32 lastClaimedEpoch = lastClaimedEpochForAddress[owner];
        uint32 startEpoch;
        if(lastClaimedEpoch == 0) {
            int32 stakeStartForUser = forger.stakeStart(signPublicKey, forgerVrf1, forgerVrf2, owner); 
            //start from the first epoch user has staked
            if(stakeStartForUser != -1) {
                startEpoch = uint32(stakeStartForUser);
            }

        } 
        else { 
            startEpoch = lastClaimedEpoch + 1; //start from the next to claim
        }

        return startEpoch < 2 ? 2 : startEpoch; //nothing to claim in first two epochs due to n-2
    }
}