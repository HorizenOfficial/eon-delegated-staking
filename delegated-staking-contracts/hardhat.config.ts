import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const account = [process.env.PRIVATE_KEY!]

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      gasPrice: 0,
      initialBaseFeePerGas: 0,
      mining: {
        auto: true
      }
    },
    pregobi: {
      url: "http://evm-tn-pre-gobi-test-1.de.horizenlabs.io/ethv1",
      accounts: account
    },
    gobi: {
      url: "https://rpc.ankr.com/horizen_gobi_testnet",
      accounts: account
    }
  }
};

export default config;
