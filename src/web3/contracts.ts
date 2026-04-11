import { BrowserProvider, Contract, JsonRpcSigner, formatEther, parseEther } from 'ethers'
import addresses from '../contracts/addresses.json'

const HARDHAT_CHAIN_ID = 31337

export type VaultRead = {
  balanceWei: bigint
  streakDays: bigint
  tier: number
  apyBps: bigint
}

export const EmberVaultAbi = [
  'function stake() payable',
  'function withdraw(uint256 amountWei)',
  'function checkpoint()',
  'function getBalance(address user) view returns (uint256)',
  'function getStreakDays(address user) view returns (uint256)',
  'function getTier(address user) view returns (uint8)',
  'function getAPY(address user) view returns (uint256)',
  'event Staked(address indexed user, uint256 amount)',
  'event Withdrawn(address indexed user, uint256 amount, uint256 yieldPaid, bool streakBroken)',
  'event Checkpoint(address indexed user, uint256 streakDays, uint8 tier)',
] as const

/** Tamashii tier NFT (soulbound) — matches `contracts/contracts/TamashiiNFT.sol`. */
export const TamashiiNFTAbi = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOf(address owner) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
] as const

export const KizunaPoolAbi = [
  'function createPool(string name, uint256 stakeAmount, address[] initialMembers) returns (uint256)',
  'function joinPool(uint256 poolId) payable',
  'function checkIn(uint256 poolId)',
  'function pools(uint256 poolId) view returns (string name, uint256 stakeAmount, address creator, uint256 startTs, uint256 periodDays, bool active)',
  'function getMembers(uint256 poolId) view returns (address[])',
  'function nextPoolId() view returns (uint256)',
  'event PoolCreated(uint256 indexed poolId, string name, uint256 stakeAmount, address indexed creator)',
  'event Joined(uint256 indexed poolId, address indexed member)',
  'event CheckedIn(uint256 indexed poolId, address indexed member, uint256 dayIndex)',
] as const

export function assertHardhat(chainId: number | null) {
  if (!chainId) throw new Error('Wallet not connected.')
  if (chainId !== HARDHAT_CHAIN_ID) throw new Error('Wrong network. Switch MetaMask to Hardhat Local (31337).')
}

export function getBrowserProvider() {
  const eth = (window as any).ethereum
  if (!eth) throw new Error('MetaMask not found.')
  return new BrowserProvider(eth)
}

export async function getSigner(): Promise<JsonRpcSigner> {
  const provider = getBrowserProvider()
  return await provider.getSigner()
}

export function getVaultContract(signerOrProvider: any) {
  return new Contract((addresses as any).EmberVault, EmberVaultAbi, signerOrProvider)
}

export function getPoolContract(signerOrProvider: any) {
  return new Contract((addresses as any).KizunaPool, KizunaPoolAbi, signerOrProvider)
}

export function getTamashiiContract(signerOrProvider: any) {
  return new Contract((addresses as any).TamashiiNFT, TamashiiNFTAbi, signerOrProvider)
}

/** Prompt / docs alias */
export { EmberVaultAbi as EmberVaultABI, KizunaPoolAbi as KizunaPoolABI, TamashiiNFTAbi as TamashiiNFTABI }

export async function readVault(address: string): Promise<VaultRead> {
  const provider = getBrowserProvider()
  const vault = getVaultContract(provider)
  const [balanceWei, streakDays, tier, apyBps] = await Promise.all([
    vault.getBalance(address) as Promise<bigint>,
    vault.getStreakDays(address) as Promise<bigint>,
    vault.getTier(address) as Promise<number>,
    vault.getAPY(address) as Promise<bigint>,
  ])
  return { balanceWei, streakDays, tier, apyBps }
}

export function toEth(amount: string) {
  return parseEther((amount || '0').trim() || '0')
}

export function fmtEth(wei: bigint) {
  return formatEther(wei)
}

