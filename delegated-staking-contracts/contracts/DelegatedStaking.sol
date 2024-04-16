// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./interfaces/ForgerStakesV2.sol";

contract DelegatedStaking {

    address public signer;
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
    constructor(address _signer, bytes32 vrf1, bytes1 vrf2, ForgerStakesV2 _forger) {
        signer = _signer;
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

    function claimReward(address owner, bytes32 signPubKey) external {
        _checkPublicKey(owner, signPubKey); //check if public key is valid

        uint32 startEpoch = lastClaimedEpochForAddress[owner] + 1;

        //get sum fees
        uint256[] memory sumFeeAccruedInEpoch = forger.rewardsReceived(signPubKey, forgerVrf1, forgerVrf2, startEpoch, MAX_NUMBER_OF_EPOCH);
        uint256 delegatorStakesAtEpochMinus2 = forger.stakeTotal();

        uint32 length = uint32(sumFeeAccruedInEpoch.length);
        ClaimData[] memory epochNumbersAndClaimedRewards = new ClaimData[](length);

        uint32 i; //loop
        while(i != length) {
            uint32 epoch = startEpoch + i;
            uint256 claimedReward = _claimEpoch(owner, signPubKey, sumFeeAccruedInEpoch[i], startEpoch + i);
            epochNumbersAndClaimedRewards[i] = ClaimData(epoch, claimedReward);
            unchecked { ++i; }
        }

        lastClaimedEpochForAddress[owner] = startEpoch + length;
    }

    function _claimEpoch(address owner, bytes32 signPubKey, uint256 feeForEpoch, uint256 epoch) internal returns(uint256) {
        
        uint256 totalStakesAtEpochMinus2 = 0; //forger.stakeTotal();
        
        uint256 reward = feeForEpoch * delegatorStakesAtEpochMinus2 / totalStakesAtEpochMinus2;
        payable(owner).transfer(reward);
        return reward;        
    }

    function _checkPublicKey(address owner, bytes32 pubkey) internal pure {
        if (address(bytes20(keccak256(abi.encodePacked(pubkey)))) != owner) {
            revert PublicKeyNotCorrectForOwner();
        }
    }
}