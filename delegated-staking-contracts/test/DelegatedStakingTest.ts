import { expect } from "chai";
import hre from "hardhat";
import { DelegatedStaking, MockForgerStakesV2 } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("DelegatedStaking", function () {
  
  const ZERO_32 = hre.ethers.ZeroHash;
  let accounts: SignerWithAddress[];
  let delegator: SignerWithAddress | hre.ethers.VoidSigner;
  let other: SignerWithAddress;
  let mockedForger: MockForgerStakesV2;
  let delegatedStaking: DelegatedStaking;

  describe("DelegatedStaking Test", function () {

    beforeEach(async () => {
      accounts = await hre.ethers.getSigners();
      delegator = accounts[0];
      other = accounts[1];
      let MockForgerStakesV2 = await hre.ethers.getContractFactory("MockForgerStakesV2");
      let DelegatedStaking = await hre.ethers.getContractFactory("TestDelegatedStaking"); //using payable so we can send ETH
      
      mockedForger = await MockForgerStakesV2.deploy();
      await mockedForger.waitForDeployment();
      delegatedStaking = await DelegatedStaking.deploy(ZERO_32, ZERO_32, "0x00", await mockedForger.getAddress()) as DelegatedStaking;

      //fund contract
      let fundTx = await delegator.sendTransaction({
        to: await delegatedStaking.getAddress(),
        value: hre.ethers.parseUnits("10", "ether")
      })
      await fundTx.wait();
    });

    async function mockEpoch(startEpoch: number, rewardsEpochs: number[], delegatorStakes: number[], otherStakes: number[]) {
      for(let i=0; i < rewardsEpochs.length; i++) {
        //write data on contract
        await (await mockedForger.mockRewardForEpoch(startEpoch+i, rewardsEpochs[i])).wait();
        
        await (await mockedForger.mockStakeForEpoch(startEpoch+i, await delegator.getAddress(), delegatorStakes[i])).wait();
        await (await mockedForger.mockStakeForEpoch(startEpoch+i, await other.getAddress(), otherStakes[i])).wait();
      }

      (await mockedForger.mockCurrentEpoch(startEpoch + rewardsEpochs.length)).wait();
    }

    it("Test simple delegate claim", async function () {
      // GAS PRICE SHOULD BE ZERO IN HARDHAT CONFIG

      let rewardsEpochs = [0, 0, 100, 100, 100]; //1 epoch for each item in the array
      let delegatorStakes = [30, 90, 50, 0, 0]; //rewards are calculated using n-2 stakes
      let otherStakes = [70, 10, 50, 0, 0];

      let correctRewardForDelegator = 30+90+50; //30 on epoch 3, 90 on on epoch 4, 50 on epoch 5

      await mockEpoch(0, rewardsEpochs, delegatorStakes, otherStakes);

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
  
    it("Test revert if nothing to claim (already claimed at current epoch)", async function () {
      let rewardsEpochs = [0, 0, 100, 100, 100]; //1 epoch for each item in the array
      let delegatorStakes = [30, 90, 50, 0, 0]; //rewards are calculated using n-2 stakes
      let otherStakes = [70, 10, 50, 0, 0];
      await mockEpoch(0, rewardsEpochs, delegatorStakes, otherStakes);

      let tx = await delegatedStaking.claimReward(await delegator.getAddress());
      await tx.wait();
      //try to claim again
      expect(delegatedStaking.claimReward(await delegator.getAddress())).to.be.revertedWithCustomError(delegatedStaking, "NothingToClaim")

    });

      
    it("Test revert if nothing to claim (nothing staked)", async function () {
      let rewardsEpochs = [0, 0, 100, 100, 100]; //1 epoch for each item in the array
      let delegatorStakes = [0, 0, 0, 0, 0]; //rewards are calculated using n-2 stakes
      let otherStakes = [70, 10, 50, 0, 0];
      await mockEpoch(0, rewardsEpochs, delegatorStakes, otherStakes);

      expect(delegatedStaking.claimReward(await delegator.getAddress())).to.be.revertedWithCustomError(delegatedStaking, "NothingToClaim")

    });

    it("Test revert if nothing to claim (staked only in last 2 epochs)", async function () {
      let rewardsEpochs = [0, 0, 100, 100, 100]; //1 epoch for each item in the array
      let delegatorStakes = [0, 0, 0, 50, 50]; //rewards are calculated using n-2 stakes
      let otherStakes = [70, 10, 50, 0, 0];
      await mockEpoch(0, rewardsEpochs, delegatorStakes, otherStakes);

      expect(delegatedStaking.claimReward(await delegator.getAddress())).to.be.revertedWithCustomError(delegatedStaking, "NothingToClaim")
    });

    it("Test revert if nothing to claim (after first claim, stake is zero for successive claims)", async function () {
      let rewardsEpochs = [0, 0, 100, 100, 100]; //1 epoch for each item in the array
      let delegatorStakes = [30, 90, 50, 0, 0]; //rewards are calculated using n-2 stakes
      let otherStakes = [70, 10, 50, 0, 0];
      await mockEpoch(0, rewardsEpochs, delegatorStakes, otherStakes);

      let tx = await delegatedStaking.claimReward(await delegator.getAddress());
      await tx.wait();

      //go on in epochs
      rewardsEpochs = [0, 0, 100, 100, 100]; //1 epoch for each item in the array
      delegatorStakes = [0, 0, 0, 0, 0]; //rewards are calculated using n-2 stakes
      otherStakes = [70, 10, 50, 0, 0];
      await mockEpoch(5, rewardsEpochs, delegatorStakes, otherStakes);

      expect(delegatedStaking.claimReward(await delegator.getAddress())).to.be.revertedWithCustomError(delegatedStaking, "NothingToClaim")
    });

    it("Test positive multiple claims", async function () {
      let rewardsEpochs1 = [0, 0, 100, 100, 100]; //1 epoch for each item in the array
      let delegatorStakes1 = [30, 90, 50, 0, 0]; //rewards are calculated using n-2 stakes
      let otherStakes1 = [70, 10, 50, 0, 0];
      await mockEpoch(0, rewardsEpochs1, delegatorStakes1, otherStakes1);

      let tx = await delegatedStaking.claimReward(await delegator.getAddress());
      await tx.wait();

      //go on in epochs
      let rewardsEpochs2 = [100, 100, 100, 100, 100]; //1 epoch for each item in the array
      let delegatorStakes2 = [30, 90, 50, 0, 0]; //rewards are calculated using n-2 stakes
      let otherStakes2 = [70, 10, 50, 0, 0];
      await mockEpoch(rewardsEpochs1.length, rewardsEpochs2, delegatorStakes2, otherStakes2);

      let correctRewardForDelegator = 30+90+50; //0 on epoch 4, 0 on epoch 5, 30 on epoch 6, 90 on on epoch 7, 50 on epoch 8
      //get current delegator balance
      let preSecondClaimBalance = await hre.ethers.provider.getBalance(await delegator.getAddress());
      let preSecondClaimContractBalance = await hre.ethers.provider.getBalance(await delegatedStaking.getAddress());

      await delegatedStaking.claimReward(await delegator.getAddress())
      let lastClaimedEpoch = await delegatedStaking.lastClaimedEpochForAddress(await delegator.getAddress());

      //get balance after claim
      let postSecondClaimBalance = await hre.ethers.provider.getBalance(await delegator.getAddress());
      let postSecondClaimContractBalance = await hre.ethers.provider.getBalance(await delegatedStaking.getAddress());

      expect(lastClaimedEpoch).to.equal(rewardsEpochs1.length + rewardsEpochs2.length);
      expect(postSecondClaimBalance).to.equal(preSecondClaimBalance + BigInt(correctRewardForDelegator));
      expect(postSecondClaimContractBalance).to.equal(preSecondClaimContractBalance - BigInt(correctRewardForDelegator));
    });

    it("Test claim on a contract that uses gas", async function () {
      let TestContractWithFallback = await hre.ethers.getContractFactory("TestContractWithFallback");
      
      let contract = await TestContractWithFallback.deploy();
      await contract.waitForDeployment();
      delegator = new hre.ethers.VoidSigner(await contract.getAddress());
  
      let rewardsEpochs = [0, 0, 100, 100, 100]; //1 epoch for each item in the array
      let delegatorStakes = [30, 90, 50, 0, 0]; //rewards are calculated using n-2 stakes
      let otherStakes = [70, 10, 50, 0, 0];
  
      await mockEpoch(0, rewardsEpochs, delegatorStakes, otherStakes);
      
      await delegatedStaking.claimReward(await delegator.getAddress());
  
    });
  });
});

