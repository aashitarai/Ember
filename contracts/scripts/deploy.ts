import { network } from 'hardhat'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

type Addresses = {
  chainId: number
  EmberVault: string
  TamashiiNFT: string
  KizunaPool: string
}

function writeJson(filePath: string, data: unknown) {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

async function main() {
  const { ethers } = await network.connect()
  const net = await ethers.provider.getNetwork()
  const chainId = Number(net.chainId)

  const vault = await ethers.deployContract('EmberVault')
  await vault.waitForDeployment()

  const nft = await ethers.deployContract('TamashiiNFT')
  await nft.waitForDeployment()

  const pool = await ethers.deployContract('KizunaPool')
  await pool.waitForDeployment()

  const addresses: Addresses = {
    chainId,
    EmberVault: await vault.getAddress(),
    TamashiiNFT: await nft.getAddress(),
    KizunaPool: await pool.getAddress(),
  }

  console.log('=== Deployed contracts ===')
  console.log(`ChainId:      ${addresses.chainId}`)
  console.log(`EmberVault:   ${addresses.EmberVault}`)
  console.log(`TamashiiNFT:  ${addresses.TamashiiNFT}`)
  console.log(`KizunaPool:   ${addresses.KizunaPool}`)

  // Save addresses into frontend
  const here = path.dirname(fileURLToPath(import.meta.url))
  const repoRoot = path.resolve(here, '..', '..')

  // Primary (current repo) frontend path:
  const primary = path.join(repoRoot, 'src', 'contracts', 'addresses.json')
  writeJson(primary, addresses)
  console.log(`Saved: ${primary}`)

  // Optional requested path (if you later add a /frontend folder)
  const alt = path.join(repoRoot, 'frontend', 'src', 'contracts', 'addresses.json')
  try {
    writeJson(alt, addresses)
    console.log(`Saved: ${alt}`)
  } catch {
    // ignore
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

