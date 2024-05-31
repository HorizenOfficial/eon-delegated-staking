import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import { TestDelegatedStaking__factory } from "../typechain-types";

dotenv.config();

async function main() {
  //deploy
  const TestDelegatedStaking: TestDelegatedStaking__factory = await ethers.getContractFactory("TestDelegatedStaking");
  const contract = await TestDelegatedStaking.deploy(process.env.SIGN_PUBLIC_KEY || '',
    process.env.VRF1 || '',
    process.env.VRF2 || '',
    "0x0000000000000000000022222222222222222333"
  );

  await contract.waitForDeployment();

  console.log(`Contract deployed at address: ${await contract.getAddress()}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
