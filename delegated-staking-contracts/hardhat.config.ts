import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

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
    }
  }
};

export default config;
