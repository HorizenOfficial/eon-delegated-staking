import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  //deploy
  const factory = await ethers.getContractFactory("DelegatedStakingFactory");
  const contract = await factory.deploy();

  await contract.waitForDeployment();
  console.log(`Factory contract deployed at address: ${await contract.getAddress()}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
