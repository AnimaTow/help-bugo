'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import type { Address } from 'viem'
import { isAddress, parseUnits, formatUnits } from 'viem'
import { useMemo } from 'react'
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
}) {
    const {
        tokenAddress,
        tokenBalance,
        chainId,
        allowedChainIds = [14],
        requireMinGasNative = false,
        nativeBalance,
        minGasNative = 0.0003,
    } = opts

    const dec = tokenBalance?.decimals ?? 18
    const total = useMemo(
        () => (tokenBalance ? Number(formatUnits(tokenBalance.value, dec)) : 0),
        [tokenBalance, dec]
    )
    const max = Math.max(0, total)

    const nativeOk = useMemo(() => {
        if (!requireMinGasNative) return true
        if (!nativeBalance) return false
        const n = Number(formatUnits(nativeBalance.value, nativeBalance.decimals))
        return n > minGasNative
    }, [requireMinGasNative, nativeBalance, minGasNative])

    const { writeContract, data: hash, isPending, error } = useWriteContract()
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

    function validate(to: string, amount: string) {
        const toValid = !!to && isAddress(to as Address)
        const n = Number(amount)
        const amtValid = Number.isFinite(n) && n > 0 && n <= max
        const networkOk = !!chainId && allowedChainIds.includes(chainId)
        const canSubmit = toValid && amtValid && networkOk && nativeOk && !isPending && !isConfirming
        return { toValid, amtValid, networkOk, nativeOk, canSubmit }
    }

    async function send(to: Address, amount: string) {
        const n = Number(amount)
        if (!Number.isFinite(n) || n <= 0) return

        const parsedAmount = parseUnits(amount, dec)

        // 1️⃣ Gas schätzen
        const estimatedGas = await publicClient!.estimateContractGas({
            address: tokenAddress,
            abi: ERC20_TRANSFER_ABI,
            functionName: 'transfer',
            args: [to, parsedAmount],
            account: undefined, // optional falls du address reinreichen willst
        })

        // 2️⃣ 30% Buffer
        const gasWithBuffer = estimatedGas * 130n / 100n

        // 3️⃣ TX senden mit manuellem Gas-Limit
        writeContract({
            address: tokenAddress,
            abi: ERC20_TRANSFER_ABI,
            functionName: 'transfer',
            args: [to, parsedAmount],
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
        // actions
        validate,
        send,
        pctToAmount,
        amountToPct,
        // tx state
        txHash: hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    }
}