import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import { DelegatedStaking, MockForgerStakesV2 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("DelegatedStaking", function () {
  
  const ZERO_32 = hre.ethers.ZeroHash;
  let accounts: SignerWithAddress[];
  let delegator: SignerWithAddress;
  let other: SignerWithAddress;
  let mockedForger: MockForgerStakesV2;
  let delegatedStaking: DelegatedStaking;

  describe("DelegatedStaking Test", function () {


    before(async () => {
      accounts = await hre.ethers.getSigners();
      delegator = accounts[0];
      other = accounts[1];
      let MockForgerStakesV2 = await hre.ethers.getContractFactory("MockForgerStakesV2");
      let DelegatedStaking = await hre.ethers.getContractFactory("DelegatedStaking");
  
      mockedForger = await MockForgerStakesV2.deploy();
      await mockedForger.waitForDeployment();
      delegatedStaking = await DelegatedStaking.deploy(ZERO_32, ZERO_32, "0x00", await mockedForger.getAddress());

      //fund contract
      let fundTx = await delegator.sendTransaction({
        to: await delegatedStaking.getAddress(),
        value: hre.ethers.parseUnits("10", "ether")
      })
      await fundTx.wait();
    });

    it("Test simple delegate claim", async function () {
      // GAS PRICE SHOULD BE ZERO IN HARDHAT CONFIG

      let rewardsEpochs = [100, 100]; //1 epoch for each item in the array
      let delegatorStakes = [30, 90];
      let otherStakes = [70, 10];

      let correctRewardForDelegator: number = 0;
      for(let i=0; i < rewardsEpochs.length; i++) {
        //write data on contract
        await (await mockedForger.mockRewardForEpoch(i+1, rewardsEpochs[i])).wait();
        
        await (await mockedForger.mockStakeForEpoch(i+1, await delegator.getAddress(), delegatorStakes[i])).wait();
        await (await mockedForger.mockStakeForEpoch(i+1, await other.getAddress(), otherStakes[i])).wait();

        //add to correct reward calculated
        correctRewardForDelegator += rewardsEpochs[i] * delegatorStakes[i] / (delegatorStakes[i] + otherStakes[i]);
      }
      (await mockedForger.mockCurrentEpoch(rewardsEpochs.length)).wait();

      //get current delegator balance
      let preClaimBalance = await hre.ethers.provider.getBalance(await delegator.getAddress());
      let preClaimContractBalance = await hre.ethers.provider.getBalance(await delegatedStaking.getAddress());

      let tx = await delegatedStaking.claimReward(await delegator.getAddress());
      await tx.wait();
      let lastClaimedEpoch = await delegatedStaking.lastClaimedEpochForAddress(await delegator.getAddress());
      
      //get balance after claim
      let postClaimBalance = await hre.ethers.provider.getBalance(await delegator.getAddress());
      let postClaimContractBalance = await hre.ethers.provider.getBalance(await delegatedStaking.getAddress());

      expect(lastClaimedEpoch).to.equal(rewardsEpochs.length);
      expect(postClaimBalance).to.equal(preClaimBalance + BigInt(correctRewardForDelegator));
      expect(postClaimContractBalance).to.equal(preClaimContractBalance - BigInt(correctRewardForDelegator));
      
    });
  });
});
