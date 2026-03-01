'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { flare, flareTestnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

type RpcMode = 'public' | 'private'

type RpcModeContextValue = {
  rpcMode: RpcMode
  setRpcMode: (mode: RpcMode) => void
  flareRpcUrl: string
  flareTestnetRpcUrl: string
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

  const wagmiConfig = useMemo(() => {
    return createConfig({
      chains: [flare, flareTestnet],
      connectors: [injected({ shimDisconnect: true })],
      transports: {
        [flare.id]: http(flareRpcUrl),
        [flareTestnet.id]: http(flareTestnetRpcUrl),
      },
      ssr: true,
    })
  }, [flareRpcUrl, flareTestnetRpcUrl])

  return (
    <RpcModeContext.Provider value={{ rpcMode, setRpcMode, flareRpcUrl, flareTestnetRpcUrl }}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    </RpcModeContext.Provider>
  )
}
