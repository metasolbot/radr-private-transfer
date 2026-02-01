# 🔒 RADR Private Transfer

Privacy-first Solana transfers using [RADR](https://radr.fun)'s ShadowWire technology.

![License](https://img.shields.io/badge/license-MIT-blue)
![Solana](https://img.shields.io/badge/Solana-mainnet-green)

## Features

- **Private Transfers** - Send SOL without exposing transaction links between wallets
- **ShadowWire Integration** - Uses RADR's privacy layer for shielded transactions
- **External Transfers** - Send to any Solana wallet address
- **P2P Transfers** - Send to other ShadowWire users
- **Batch Mode** - Send to multiple recipients in one go
- **Mobile Friendly** - Clean, responsive UI

## How It Works

1. **Import** your Solana wallet using a private key
2. **Shield** your SOL through ShadowWire
3. **Transfer** privately - no direct on-chain link to recipient
4. Recipient receives SOL from a RADR pool address

## Quick Start

```bash
# Just open in browser
open index.html
```

Or serve locally:
```bash
npx serve .
```

## Usage

1. Click **Import Wallet** and paste your Base58 private key
2. Your ShadowWire balance will display
3. Choose transfer type:
   - **External** - To any Solana address
   - **P2P** - To another ShadowWire user (fastest)
4. Enter recipient and amount
5. Click **Send Privately**

## Tech Stack

- Vanilla JavaScript (no build step)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [RADR ShadowWire API](https://radr.fun)
- [Helius RPC](https://helius.xyz)

## Security Notes

⚠️ **Never share your private key** - This app runs entirely in-browser

- No backend servers store your keys
- Keys are only used locally for signing
- ShadowWire provides transaction privacy, not wallet anonymity

## Files

```
radr-transfer-app/
├── index.html    # UI + styles
├── app.js        # Transfer logic + ShadowWire integration
├── wallet.js     # Wallet utilities
└── README.md
```

## License

MIT

---

Built with 🧡 for the Solana privacy ecosystem
