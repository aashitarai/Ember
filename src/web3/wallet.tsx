import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type WalletState = {
  hasProvider: boolean
  address: string | null
  chainId: number | null
  connecting: boolean
  error: string | null
}

type WalletContextValue = WalletState & {
  connect: () => Promise<void>
  ensureHardhat: () => Promise<void>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

function getEthereum(): any | null {
  return (window as any).ethereum ?? null
}

function friendlyError(e: any): string {
  const msg = String(e?.message ?? e ?? '')
  if (e?.code === 4001) return 'You rejected the request in MetaMask.'
  if (msg.toLowerCase().includes('already pending')) return 'MetaMask already has a pending request.'
  return msg || 'Something went wrong.'
}

async function requestChainId(eth: any): Promise<number> {
  const hex = (await eth.request({ method: 'eth_chainId' })) as string
  return Number.parseInt(hex, 16)
}

const HARDHAT_CHAIN_ID = 31337

export function WalletProvider(props: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    hasProvider: Boolean(getEthereum()),
    address: null,
    chainId: null,
    connecting: false,
    error: null,
  })

  useEffect(() => {
    const eth = getEthereum()
    if (!eth) return

    let mounted = true
    ;(async () => {
      try {
        const [chainId, accounts] = await Promise.all([
          requestChainId(eth),
          eth.request({ method: 'eth_accounts' }) as Promise<string[]>,
        ])
        if (!mounted) return
        setState((s) => ({
          ...s,
          hasProvider: true,
          chainId,
          address: accounts?.[0] ?? null,
        }))
      } catch {
        // ignore
      }
    })()

    const onAccountsChanged = (accounts: string[]) => {
      setState((s) => ({ ...s, address: accounts?.[0] ?? null, error: null }))
    }
    const onChainChanged = (chainIdHex: string) => {
      const chainId = Number.parseInt(chainIdHex, 16)
      setState((s) => ({ ...s, chainId, error: null }))
    }

    eth.on?.('accountsChanged', onAccountsChanged)
    eth.on?.('chainChanged', onChainChanged)

    return () => {
      mounted = false
      eth.removeListener?.('accountsChanged', onAccountsChanged)
      eth.removeListener?.('chainChanged', onChainChanged)
    }
  }, [])

  const value = useMemo<WalletContextValue>(() => {
    return {
      ...state,
      connect: async () => {
        const eth = getEthereum()
        if (!eth) {
          setState((s) => ({ ...s, error: 'MetaMask not found. Install the extension first.' }))
          return
        }
        setState((s) => ({ ...s, connecting: true, error: null }))
        try {
          const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[]
          const chainId = await requestChainId(eth)
          setState((s) => ({
            ...s,
            hasProvider: true,
            address: accounts?.[0] ?? null,
            chainId,
            connecting: false,
            error: null,
          }))
        } catch (e) {
          setState((s) => ({ ...s, connecting: false, error: friendlyError(e) }))
        }
      },
      ensureHardhat: async () => {
        const eth = getEthereum()
        if (!eth) {
          setState((s) => ({ ...s, error: 'MetaMask not found. Install the extension first.' }))
          return
        }
        try {
          const chainId = await requestChainId(eth)
          if (chainId === HARDHAT_CHAIN_ID) return

          // Try switch; if unknown, add network.
          try {
            await eth.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x7a69' }], // 31337
            })
          } catch (e: any) {
            if (e?.code !== 4902) throw e
            await eth.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x7a69',
                  chainName: 'Hardhat Local',
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                  rpcUrls: ['http://127.0.0.1:8545'],
                },
              ],
            })
          }

          const nextChainId = await requestChainId(eth)
          setState((s) => ({ ...s, chainId: nextChainId, error: null }))
        } catch (e) {
          setState((s) => ({ ...s, error: friendlyError(e) }))
        }
      },
      disconnect: () => {
        // MetaMask doesn't support programmatic disconnect; we just clear UI state.
        setState((s) => ({ ...s, address: null, error: null }))
      },
    }
  }, [state])

  return <WalletContext.Provider value={value}>{props.children}</WalletContext.Provider>
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}

export function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

