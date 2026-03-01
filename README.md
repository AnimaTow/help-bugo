# help-bugo

Next.js test tool for safely validating ERC-20 transfers on Flare/Songbird networks using `wagmi` and `RainbowKit`.

## Features

- Wallet connect via RainbowKit (Injected + optional WalletConnect)
- Network is derived from the connected wallet chain
- RPC profile switch: `public` / `private`
- Supported chains:
  - Flare Mainnet
  - Songbird
  - Flare Testnet (Coston2)
  - Songbird Testnet (Coston)
- Token selection per chain:
  - Default: wrapped token
  - Additional on Flare Mainnet: BUGO
- Gas testing:
  - Buffer on gas limit (`gas`)
  - Optional buffer on fee prices (`maxFeePerGas`, `maxPriorityFeePerGas`, `gasPrice`)
- Safety logic:
  - Recipient defaults to your connected wallet address
  - Warning for external recipient addresses
  - Self-transfer guard (e.g. WNat `Cannot transfer to self`)

## Requirements

- Node.js 20 or 22 (LTS recommended)
- Yarn 1.x

## Install

```bash
yarn install
```

## Configuration

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Important variables:

- `NEXT_PUBLIC_RPC_MODE=public|private`
- `NEXT_PUBLIC_GAS_BUFFER_PERCENT=30`
- `NEXT_PUBLIC_DEFAULT_TEST_AMOUNT=0.000001`
- `NEXT_PUBLIC_FEE_PRICE_BUFFER_ENABLED=false`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...` (optional)

RPC and token variables:

- Flare:
  - `NEXT_PUBLIC_FLARE_RPC_PUBLIC_URL`
  - `NEXT_PUBLIC_FLARE_RPC_PRIVATE_URL`
  - `NEXT_PUBLIC_FLARE_WRAPPED_TOKEN_ADDRESS`
  - `NEXT_PUBLIC_BUGO_FLARE_TOKEN_ADDRESS`
- Flare Testnet:
  - `NEXT_PUBLIC_FLARE_TESTNET_RPC_PUBLIC_URL`
  - `NEXT_PUBLIC_FLARE_TESTNET_RPC_PRIVATE_URL`
  - `NEXT_PUBLIC_FLARE_TESTNET_WRAPPED_TOKEN_ADDRESS`
- Songbird:
  - `NEXT_PUBLIC_SONGBIRD_RPC_PUBLIC_URL`
  - `NEXT_PUBLIC_SONGBIRD_RPC_PRIVATE_URL`
  - `NEXT_PUBLIC_SONGBIRD_WRAPPED_TOKEN_ADDRESS`
- Songbird Testnet:
  - `NEXT_PUBLIC_SONGBIRD_TESTNET_RPC_PUBLIC_URL`
  - `NEXT_PUBLIC_SONGBIRD_TESTNET_RPC_PRIVATE_URL`
  - `NEXT_PUBLIC_SONGBIRD_TESTNET_WRAPPED_TOKEN_ADDRESS`

## Run

```bash
yarn dev
```

Open:

- http://localhost:3000

## Usage

1. Connect wallet
2. Select token (wrapped token is default; BUGO is available on Flare Mainnet)
3. Verify recipient
4. Set amount and gas buffer
5. Optionally enable `Also buffer fee prices`
6. Click `Estimate Gas`, then `Test Transfer`

In `Hook State` you can inspect:

- Active chain and RPC URL
- Gas-limit estimate and overhead
- Optional buffered fee-price values
- Tx hash and tx status

## Scripts

```bash
yarn dev
yarn build
yarn start
yarn lint
```

## Known Issues / Notes

- Restart the dev server after any env changes.
- If your wallet warns about high network fees:
  - Disable `Also buffer fee prices`.
- If you get `Cannot transfer to self`:
  - Use a different recipient address.
- If you get `localStorage.getItem is not a function`:
  - Use Node LTS (20/22) and check runtime flags.
