'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { flare, flareTestnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

const wagmiConfig = createConfig({
  chains: [flare, flareTestnet],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [flare.id]: http(process.env.NEXT_PUBLIC_FLARE_RPC_URL),
    [flareTestnet.id]: http(process.env.NEXT_PUBLIC_FLARE_TESTNET_RPC_URL),
  },
  ssr: true,
})

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
