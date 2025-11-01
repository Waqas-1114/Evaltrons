import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    // Ganache CLI configuration
    ganache: {
      url: process.env.NEXT_PUBLIC_GANACHE_URL || "http://127.0.0.1:8545",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1337
    },
    // Local Hardhat network
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    // Hardhat default network
    hardhat: {
      chainId: 31337
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6"
  },
  gasReporter: {
    enabled: true,
    currency: "USD"
  }
};

export default config;
