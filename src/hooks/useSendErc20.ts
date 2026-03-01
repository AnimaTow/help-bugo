'use client'

import { useWriteContract, useWaitForTransactionReceipt, usePublicClient, useConnection, useChainId } from 'wagmi'
import type { Address } from 'viem'
import { isAddress, parseUnits, formatUnits } from 'viem'
import { useMemo, useState } from 'react'
import type { Abi } from 'viem'

const ERC20_TRANSFER_ABI = [
    {
        type: 'function',
        stateMutability: 'nonpayable',
        name: 'transfer',
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ type: 'bool' }],
    },
] as const satisfies Abi

export type BalanceLike = { value: bigint; decimals: number }

/**
 * Hook zum Senden eines ERC-20 Tokens (z. B. WFLR/ WNAT).
 * Nutzt `transfer(to, amount)`, berechnet Max auf Basis des Token-Balances
 * und kann optional eine Mindestmenge Native (FLR) für Gas erfordern.
 */
export function useSendErc20(opts: {
    tokenAddress: Address
    tokenBalance?: BalanceLike
    chainId?: number
    allowedChainIds?: number[]
    requireMinGasNative?: boolean
    nativeBalance?: BalanceLike // für Gas-Check
    minGasNative?: number       // ~0.0003 FLR als Faustregel
    gasBufferPercent?: number
}) {
    const {
        tokenAddress,
        tokenBalance,
        chainId,
        allowedChainIds = [14],
        requireMinGasNative = false,
        nativeBalance,
        minGasNative = 0.0003,
        gasBufferPercent = 30,
    } = opts

    const dec = tokenBalance?.decimals ?? 18
    const total = useMemo(
        () => (tokenBalance ? Number(formatUnits(tokenBalance.value, dec)) : 0),
        [tokenBalance, dec]
    )
    const max = Math.max(0, total)
    const normalizedGasBufferPercent = Math.max(0, Math.round(gasBufferPercent))

    const nativeOk = useMemo(() => {
        if (!requireMinGasNative) return true
        if (!nativeBalance) return false
        const n = Number(formatUnits(nativeBalance.value, nativeBalance.decimals))
        return n > minGasNative
    }, [requireMinGasNative, nativeBalance, minGasNative])

    const { writeContractAsync, data: hash, isPending, error } = useWriteContract()
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
    const { address } = useConnection()
    const connectedChainId = useChainId()
    const effectiveChainId = chainId ?? connectedChainId
    const publicClient = usePublicClient({ chainId: effectiveChainId })
    const [lastEstimatedGas, setLastEstimatedGas] = useState<bigint | null>(null)
    const [lastGasLimit, setLastGasLimit] = useState<bigint | null>(null)

    function validate(to: string, amount: string) {
        const toValid = !!to && isAddress(to as Address)
        const n = Number(amount)
        const amtValid = Number.isFinite(n) && n > 0 && n <= max
        const networkOk = !!effectiveChainId && allowedChainIds.includes(effectiveChainId)
        const canSubmit = toValid && amtValid && networkOk && nativeOk && !isPending && !isConfirming
        return { toValid, amtValid, networkOk, nativeOk, canSubmit }
    }

    async function estimateGas(to: Address, amount: string) {
        if (!address || !publicClient || !isAddress(to)) return null
        if (!validate(to, amount).canSubmit) return null

        const parsedAmount = parseUnits(amount, dec)
        const estimatedGas = await publicClient.estimateContractGas({
            address: tokenAddress,
            abi: ERC20_TRANSFER_ABI,
            functionName: 'transfer',
            args: [to, parsedAmount],
            account: address,
        })

        const gasLimit = estimatedGas * BigInt(100 + normalizedGasBufferPercent) / BigInt(100)
        setLastEstimatedGas(estimatedGas)
        setLastGasLimit(gasLimit)

        return { estimatedGas, gasLimit }
    }

    async function send(to: Address, amount: string) {
        if (!address || !publicClient || !isAddress(to)) return
        if (!validate(to, amount).canSubmit) return

        const parsedAmount = parseUnits(amount, dec)
        const gasResult = await estimateGas(to, amount)
        const gasWithBuffer = gasResult?.gasLimit
        if (!gasWithBuffer) return

        await writeContractAsync({
            address: tokenAddress,
            abi: ERC20_TRANSFER_ABI,
            functionName: 'transfer',
            args: [to, parsedAmount],
            account: address,
            chain: publicClient.chain,
            gas: gasWithBuffer,
        })
    }

    function pctToAmount(pct: number) {
        return ((max * pct) / 100).toFixed(6)
    }
    function amountToPct(amount: string) {
        const n = Number(amount)
        if (!Number.isFinite(n) || max <= 0) return 0
        return Math.max(0, Math.min(100, (n / max) * 100))
    }

    return {
        // derived
        decimals: dec,
        total,
        max,
        nativeOk,
        gasBufferPercent: normalizedGasBufferPercent,
        // actions
        validate,
        estimateGas,
        send,
        pctToAmount,
        amountToPct,
        // gas state
        lastEstimatedGas,
        lastGasLimit,
        // tx state
        txHash: hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    }
}
