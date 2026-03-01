'use client'

import { useMemo, useState } from 'react'
import type { Address } from 'viem'
import { useSendErc20 } from '../hooks/useSendErc20'

const TEST_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000' as Address

export default function Page() {
  const [to, setTo] = useState('0x000000000000000000000000000000000000dEaD')
  const [amount, setAmount] = useState('1')
  const [sendError, setSendError] = useState<string | null>(null)
  const [gasError, setGasError] = useState<string | null>(null)

  const hook = useSendErc20({
    tokenAddress: TEST_TOKEN_ADDRESS,
    tokenBalance: { value: 125_500_000_000_000_000_000n, decimals: 18 },
    chainId: 14,
    allowedChainIds: [14],
    requireMinGasNative: false,
  })

  const validation = useMemo(() => hook.validate(to, amount), [hook, to, amount])

  async function onSend() {
    setSendError(null)
    try {
      await hook.send(to as Address, amount)
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  async function onEstimateGas() {
    setGasError(null)
    try {
      await hook.estimateGas(to as Address, amount)
    } catch (error) {
      setGasError(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>useSendErc20 Test Output</h1>
      <p style={{ opacity: 0.8 }}>
        This page is for local hook testing only.
      </p>

      <section style={{ display: 'grid', gap: 12, marginTop: 24 }}>
        <label>
          Recipient Address
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={{ width: '100%', marginTop: 4, padding: 8 }}
          />
        </label>

        <label>
          Amount
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: '100%', marginTop: 4, padding: 8 }}
          />
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setAmount(hook.pctToAmount(25))}>25%</button>
          <button type="button" onClick={() => setAmount(hook.pctToAmount(50))}>50%</button>
          <button type="button" onClick={() => setAmount(hook.pctToAmount(100))}>100%</button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={onEstimateGas}
            disabled={!validation.canSubmit}
            style={{ width: 220, padding: '10px 14px' }}
          >
            Estimate Gas
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={!validation.canSubmit}
            style={{ width: 220, padding: '10px 14px' }}
          >
            Test Transfer
          </button>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Hook State</h2>
        <pre style={{ background: '#131a2e', padding: 12, borderRadius: 8, overflowX: 'auto' }}>
{JSON.stringify(
  {
    derived: {
      decimals: hook.decimals,
      total: hook.total,
      max: hook.max,
      nativeOk: hook.nativeOk,
      percentFromAmount: hook.amountToPct(amount),
    },
    validation,
    gas: {
      lastEstimatedGas: hook.lastEstimatedGas?.toString() ?? null,
      lastGasLimit: hook.lastGasLimit?.toString() ?? null,
      gasError,
    },
    tx: {
      txHash: hook.txHash ?? null,
      isPending: hook.isPending,
      isConfirming: hook.isConfirming,
      isSuccess: hook.isSuccess,
      error: hook.error?.message ?? null,
      sendError,
    },
  },
  null,
  2,
)}
        </pre>
      </section>
    </main>
  )
}
