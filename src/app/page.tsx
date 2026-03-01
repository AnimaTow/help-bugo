'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Address } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useConnection } from 'wagmi'
import { useSendErc20 } from '../hooks/useSendErc20'
import { useRpcMode } from './providers'
import styles from './page.module.css'

const TEST_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000' as Address
const DEFAULT_GAS_BUFFER_PERCENT = Number(process.env.NEXT_PUBLIC_GAS_BUFFER_PERCENT ?? '30')

export default function Page() {
  const { rpcMode, setRpcMode, flareRpcUrl } = useRpcMode()
  const { address } = useConnection()
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('1')
  const [gasBufferPercentInput, setGasBufferPercentInput] = useState(String(DEFAULT_GAS_BUFFER_PERCENT))
  const [sendError, setSendError] = useState<string | null>(null)
  const [gasError, setGasError] = useState<string | null>(null)
  const gasBufferPercent = Math.max(0, Math.round(Number(gasBufferPercentInput) || 0))
  const isOwnAddress = !!address && !!to && address.toLowerCase() === to.toLowerCase()

  const hook = useSendErc20({
    tokenAddress: TEST_TOKEN_ADDRESS,
    tokenBalance: { value: 125_500_000_000_000_000_000n, decimals: 18 },
    chainId: 14,
    allowedChainIds: [14],
    requireMinGasNative: false,
    gasBufferPercent,
  })

  const validation = useMemo(() => hook.validate(to, amount), [hook, to, amount])
  const gasOverhead = hook.lastEstimatedGas && hook.lastGasLimit
    ? hook.lastGasLimit - hook.lastEstimatedGas
    : null

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

  useEffect(() => {
    if (address && !to) {
      setTo(address)
    }
  }, [address, to])

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <h1 className={styles.title}>useSendErc20 Test Console</h1>
            <p className={styles.subtitle}>
              Switch RPC profile, tune gas buffer, estimate limits, and inspect live hook state.
            </p>
          </div>
          <div className={styles.walletBox}>
            <ConnectButton chainStatus="icon" showBalance={false} />
          </div>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.row}>
          <label className={styles.label}>RPC Profile</label>
          <select
            className={styles.select}
            value={rpcMode}
            onChange={(e) => setRpcMode(e.target.value as 'public' | 'private')}
          >
            <option value="public">Public RPC</option>
            <option value="private">Private RPC</option>
          </select>
        </div>

        <div className={styles.row}>
          <label className={styles.label}>Recipient Address</label>
          <input
            className={styles.input}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder={address ?? 'Connect wallet to auto-fill your address'}
          />
          {address ? (
            isOwnAddress ? (
              <p className={styles.safeNote}>Recipient is your own connected wallet address.</p>
            ) : (
              <p className={styles.warningNote}>
                Warning: recipient differs from your wallet. Double-check to avoid sending real tokens.
              </p>
            )
          ) : (
            <p className={styles.warningNote}>
              Connect wallet first. Recipient auto-fills with your own address for safer testing.
            </p>
          )}
        </div>

        <div className={styles.split}>
          <div className={styles.row}>
            <label className={styles.label}>Amount</label>
            <input
              className={styles.input}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className={styles.row}>
            <label className={styles.label}>Gas Buffer Percent</label>
            <input
              className={styles.input}
              type="number"
              min={0}
              step={1}
              value={gasBufferPercentInput}
              onChange={(e) => setGasBufferPercentInput(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.percentRow}>
          <button className={styles.chip} type="button" onClick={() => setAmount(hook.pctToAmount(25))}>25%</button>
          <button className={styles.chip} type="button" onClick={() => setAmount(hook.pctToAmount(50))}>50%</button>
          <button className={styles.chip} type="button" onClick={() => setAmount(hook.pctToAmount(100))}>100%</button>
        </div>

        <div className={styles.actionRow}>
          <button
            className={styles.buttonSecondary}
            type="button"
            onClick={onEstimateGas}
            disabled={!validation.canSubmit}
          >
            Estimate Gas
          </button>
          <button
            className={styles.button}
            type="button"
            onClick={onSend}
            disabled={!validation.canSubmit}
          >
            Test Transfer
          </button>
        </div>
      </section>

      <section className={styles.statePanel}>
        <h2 className={styles.stateTitle}>Hook State</h2>
        <pre className={styles.json}>
{JSON.stringify(
  {
    derived: {
      decimals: hook.decimals,
      total: hook.total,
      max: hook.max,
      nativeOk: hook.nativeOk,
      percentFromAmount: hook.amountToPct(amount),
      rpcProfile: rpcMode,
      activeRpcUrl: flareRpcUrl,
    },
    validation,
    gas: {
      lastEstimatedGas: hook.lastEstimatedGas?.toString() ?? null,
      gasBufferPercent: hook.gasBufferPercent,
      gasOverhead: gasOverhead?.toString() ?? null,
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
