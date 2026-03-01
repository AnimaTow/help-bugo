'use client'

import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { WagmiProvider, createConfig, createStorage, http } from 'wagmi'
import { flare, flareTestnet, songbird, songbirdTestnet } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

type RpcMode = 'public' | 'private'

type RpcModeContextValue = {
  rpcMode: RpcMode
  setRpcMode: (mode: RpcMode) => void
  rpcUrlsByChainId: Record<number, string>
}

const RpcModeContext = createContext<RpcModeContextValue | null>(null)

const defaultRpcMode: RpcMode = process.env.NEXT_PUBLIC_RPC_MODE === 'private' ? 'private' : 'public'

function pickRpcUrl(params: {
  mode: RpcMode
  publicUrl?: string
  privateUrl?: string
  legacyUrl?: string
  fallbackUrl: string
}) {
  const { mode, publicUrl, privateUrl, legacyUrl, fallbackUrl } = params

  if (mode === 'private') {
    return privateUrl || legacyUrl || publicUrl || fallbackUrl
  }

  return publicUrl || legacyUrl || privateUrl || fallbackUrl
}

function getSafeStorageBackend() {
  const fallback = {
    getItem: (_key: string) => null,
    setItem: (_key: string, _value: string) => {},
    removeItem: (_key: string) => {},
  }

  const maybeStorage = globalThis?.localStorage as
    | { getItem?: unknown; setItem?: unknown; removeItem?: unknown }
    | undefined

  if (
    maybeStorage &&
    typeof maybeStorage.getItem === 'function' &&
    typeof maybeStorage.setItem === 'function' &&
    typeof maybeStorage.removeItem === 'function'
  ) {
    return {
      getItem: (key: string) => maybeStorage.getItem!(key) as string | null,
      setItem: (key: string, value: string) => {
        maybeStorage.setItem!(key, value)
      },
      removeItem: (key: string) => {
        maybeStorage.removeItem!(key)
      },
    }
  }

  return fallback
}

export function useRpcMode() {
  const ctx = useContext(RpcModeContext)
  if (!ctx) {
    throw new Error('useRpcMode must be used inside Providers')
  }
  return ctx
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [rpcMode, setRpcMode] = useState<RpcMode>(defaultRpcMode)

  const flareRpcUrl = useMemo(() => {
    return pickRpcUrl({
      mode: rpcMode,
      publicUrl: process.env.NEXT_PUBLIC_FLARE_RPC_PUBLIC_URL,
      privateUrl: process.env.NEXT_PUBLIC_FLARE_RPC_PRIVATE_URL,
      legacyUrl: process.env.NEXT_PUBLIC_FLARE_RPC_URL,
      fallbackUrl: flare.rpcUrls.default.http[0],
    })
  }, [rpcMode])

  const flareTestnetRpcUrl = useMemo(() => {
    return pickRpcUrl({
      mode: rpcMode,
      publicUrl: process.env.NEXT_PUBLIC_FLARE_TESTNET_RPC_PUBLIC_URL,
      privateUrl: process.env.NEXT_PUBLIC_FLARE_TESTNET_RPC_PRIVATE_URL,
      legacyUrl: process.env.NEXT_PUBLIC_FLARE_TESTNET_RPC_URL,
      fallbackUrl: flareTestnet.rpcUrls.default.http[0],
    })
  }, [rpcMode])

  const songbirdRpcUrl = useMemo(() => {
    return pickRpcUrl({
      mode: rpcMode,
      publicUrl: process.env.NEXT_PUBLIC_SONGBIRD_RPC_PUBLIC_URL,
      privateUrl: process.env.NEXT_PUBLIC_SONGBIRD_RPC_PRIVATE_URL,
      legacyUrl: process.env.NEXT_PUBLIC_SONGBIRD_RPC_URL,
      fallbackUrl: songbird.rpcUrls.default.http[0],
    })
  }, [rpcMode])

  const songbirdTestnetRpcUrl = useMemo(() => {
    return pickRpcUrl({
      mode: rpcMode,
      publicUrl: process.env.NEXT_PUBLIC_SONGBIRD_TESTNET_RPC_PUBLIC_URL,
      privateUrl: process.env.NEXT_PUBLIC_SONGBIRD_TESTNET_RPC_PRIVATE_URL,
      legacyUrl: process.env.NEXT_PUBLIC_SONGBIRD_TESTNET_RPC_URL,
      fallbackUrl: songbirdTestnet.rpcUrls.default.http[0],
    })
  }, [rpcMode])

  const rpcUrlsByChainId = useMemo(() => {
    return {
      [flare.id]: flareRpcUrl,
      [songbird.id]: songbirdRpcUrl,
      [flareTestnet.id]: flareTestnetRpcUrl,
      [songbirdTestnet.id]: songbirdTestnetRpcUrl,
    }
  }, [flareRpcUrl, songbirdRpcUrl, flareTestnetRpcUrl, songbirdTestnetRpcUrl])

  const wagmiConfig = useMemo(() => {
    const isBrowser = typeof window !== 'undefined'
    const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
    const connectors = [injected({ shimDisconnect: false })]

    if (walletConnectProjectId && isBrowser) {
      connectors.push(
        walletConnect({
          projectId: walletConnectProjectId,
          metadata: {
            name: 'Flare Hook Test',
            description: 'RainbowKit + Flare test console',
            url: 'http://localhost:3000',
            icons: [],
          },
        }),
      )
    }

    return createConfig({
      chains: [flare, songbird, flareTestnet, songbirdTestnet],
      connectors,
      storage: createStorage({ storage: getSafeStorageBackend() }),
      transports: {
        [flare.id]: http(flareRpcUrl),
        [songbird.id]: http(songbirdRpcUrl),
        [flareTestnet.id]: http(flareTestnetRpcUrl),
        [songbirdTestnet.id]: http(songbirdTestnetRpcUrl),
      },
      ssr: false,
    })
  }, [flareRpcUrl, songbirdRpcUrl, flareTestnetRpcUrl, songbirdTestnetRpcUrl])

  return (
    <RpcModeContext.Provider value={{ rpcMode, setRpcMode, rpcUrlsByChainId }}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={lightTheme({
              accentColor: '#0f766e',
              accentColorForeground: '#ffffff',
              borderRadius: 'medium',
              overlayBlur: 'small',
            })}
          >
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </RpcModeContext.Provider>
  )
}
