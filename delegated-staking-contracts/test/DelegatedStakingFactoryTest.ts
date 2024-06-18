import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { DelegatedStaking, DelegatedStakingFactory } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Contract, ContractTransactionReceipt } from "ethers";

describe("DelegatedStakingFactory", function () {
  
  const SIGN_KEY = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  const VRF1 = "0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";
  const VRF2 = "0x0f";

  let accounts: SignerWithAddress[];
  let delegatedStakingFactory: DelegatedStakingFactory;

  describe("DelegatedStakingFactory Test", function () {

    beforeEach(async () => {
      accounts = await hre.ethers.getSigners();
      let DelegatedStakingFactory = await hre.ethers.getContractFactory("DelegatedStakingFactory");
      
      delegatedStakingFactory = await DelegatedStakingFactory.deploy();
      await delegatedStakingFactory.waitForDeployment();
    });

    function getAddressFromReceipt(receipt: ContractTransactionReceipt): string {
      let events = receipt.logs.map(e => delegatedStakingFactory.interface.parseLog(e)) || []
      for(let i=0; i<events.length; i++) {
        if(events[i]?.name == "ContractDeployed") {
          return events[i]?.args[0];
        }
      }
      return "";
    }

    it("Test deploy and event correctly triggered", async function () {
      let tx = await delegatedStakingFactory.deployDelegatedStakingReferenceImplementation(SIGN_KEY, VRF1, VRF2);
      let receipt: ContractTransactionReceipt = await tx.wait() as ContractTransactionReceipt;
      let deployedAddress = getAddressFromReceipt(receipt);

      expect(await delegatedStakingFactory.deployedContractsFromParams(SIGN_KEY, VRF1, VRF2)).to.equal(deployedAddress);
      let keys = await delegatedStakingFactory.forgerKeyFromContractAddress(deployedAddress);
      expect(keys[0]).to.equal(SIGN_KEY);
      expect(keys[1]).to.equal(VRF1);
      expect(keys[2]).to.equal(VRF2)

      let delegatedStaking: DelegatedStaking = await ethers.getContractAt("DelegatedStaking", deployedAddress);
      expect(await delegatedStaking.signPublicKey()).to.equal(SIGN_KEY);
      expect(await delegatedStaking.forgerVrf1()).to.equal(VRF1);
      expect(await delegatedStaking.forgerVrf2()).to.equal(VRF2);
      
    });

    it("Test duplicate deploy failing", async function () {
      let tx = await delegatedStakingFactory.deployDelegatedStakingReferenceImplementation(SIGN_KEY, VRF1, VRF2);
      await tx.wait();

      await expect(delegatedStakingFactory.deployDelegatedStakingReferenceImplementation(SIGN_KEY, VRF1, VRF2)).to.be.revertedWithCustomError(delegatedStakingFactory, "AlreadyDeployedWithTheSameKeys");
    });
  });
});