import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  //deploy
  const factory = await ethers.getContractAt("DelegatedStakingFactory", process.env.FACTORY_ADDRESS || '');
  const tx = await factory.deployDelegatedStakingReferenceImplementation(
    process.env.SIGN_PUBLIC_KEY || '',
    process.env.VRF1 || '',
    process.env.VRF2 || '',
    process.env.FALLBACK_ALLOWED_GAS || 2300
  )

  let receipt = await tx.wait();
  let events = receipt?.logs.map(event => factory.interface.parseLog(event)) || []
  let address;
  for(let i=0; i<events.length; i++) {
    if(events[i]?.name == "ContractDeployed") {
      address = events[i]?.args[0];
      break;
    }
  }

  console.log(`Contract deployed at address: ${address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
