import 'dotenv/config'
import { defineConfig } from 'hardhat/config'
import hardhatEthers from '@nomicfoundation/hardhat-ethers'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PRIVATE_KEY = process.env.PRIVATE_KEY || ''
const AMOY_RPC_URL = process.env.AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology/'

const here = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [hardhatEthers],
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  paths: {
    sources: path.join(here, 'contracts'),
    tests: path.join(here, 'test'),
    cache: path.join(here, '.cache'),
    artifacts: path.join(here, '.artifacts'),
  },
  networks: {
    localhost: {
      type: 'http',
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
    },
    amoy: {
      type: 'http',
      url: AMOY_RPC_URL,
      chainId: 80002,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
})

