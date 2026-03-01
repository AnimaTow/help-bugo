# help-bugo

Next.js Test-Tool zum sicheren Prüfen von ERC-20 Transfers auf Flare/Songbird-Netzwerken mit `wagmi` + `RainbowKit`.

## Features

- Wallet Connect via RainbowKit (Injected + optional WalletConnect)
- Netzwerk folgt der **verbundenen Wallet-Chain**
- RPC-Profil Umschaltung: `public` / `private`
- Unterstützte Chains:
  - Flare Mainnet
  - Songbird
  - Flare Testnet (Coston2)
  - Songbird Testnet (Coston)
- Token-Auswahl je Chain:
  - Standard: Wrapped Token
  - Zusätzlich auf Flare Mainnet: BUGO
- Gas-Test:
  - Puffer auf Gas-Limit (`gas`)
  - Optionaler Puffer auf Fee-Preise (`maxFeePerGas`, `maxPriorityFeePerGas`, `gasPrice`)
- Sicherheits-Logik:
  - Recipient default auf eigene Wallet-Adresse
  - Warnung bei externer Adresse
  - Self-transfer Block (z. B. WNat `Cannot transfer to self`)

## Voraussetzungen

- Node.js 20 oder 22 empfohlen (LTS)
- Yarn 1.x

## Installation

```bash
yarn install
```

## Konfiguration

` .env.example ` nach ` .env.local ` kopieren:

```bash
cp .env.example .env.local
```

Wichtige Variablen:

- `NEXT_PUBLIC_RPC_MODE=public|private`
- `NEXT_PUBLIC_GAS_BUFFER_PERCENT=30`
- `NEXT_PUBLIC_DEFAULT_TEST_AMOUNT=0.000001`
- `NEXT_PUBLIC_FEE_PRICE_BUFFER_ENABLED=false`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...` (optional)

RPC + Token Variablen:

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

## Starten

```bash
yarn dev
```

Dann öffnen:

- http://localhost:3000

## Nutzung

1. Wallet verbinden
2. Chain im Wallet wählen (UI folgt der verbundenen Chain)
3. Token wählen (Wrapped default, BUGO nur auf Flare Mainnet)
4. Recipient prüfen
5. Betrag und Gas Buffer setzen
6. Optional: `Also buffer fee prices` aktivieren
7. `Estimate Gas` und danach `Test Transfer`

Im `Hook State` siehst du:

- aktive Chain + RPC URL
- Gas-Limit Schätzung + Overhead
- optional gepufferte Fee-Werte
- Tx Hash / Status

## Nützliche Scripts

```bash
yarn dev
yarn build
yarn start
yarn lint
```

## Bekannte Stolperfallen

- Nach ENV-Änderungen immer Dev-Server neu starten.
- Wenn Wallet-Warnung zu hoher Fee erscheint:
  - `Also buffer fee prices` deaktivieren.
- Bei `Cannot transfer to self`:
  - andere Recipient-Adresse verwenden.
- Wenn `localStorage.getItem is not a function` auftritt:
  - Node LTS (20/22) nutzen und Runtime-Flags prüfen.
