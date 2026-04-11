# Ember — Hackathon runbook & teammate primer

This document is your single source for **tomorrow’s demo (ngrok + UI only)** and a **full technical story** for judges and teammates: blockchain basics, Hardhat, how the app connects, and what each smart contract does.

---

## Part A — Tomorrow: “Moody” link only (frontend, no chain required)

### What you’re showing

- **Public URL for judges:** `https://moody-supplier-map.ngrok-free.dev` (your ngrok tunnel must forward to port **5173**).
- **Your laptop:** `http://localhost:5173` (same app).
- **No second ngrok** for RPC tomorrow unless you turn blockchain back on (see Part B).

### Vite is locked to your ngrok host

In `vite.config.ts`, `allowedHosts` includes:

- `moody-supplier-map.ngrok-free.dev` — so Vite accepts the `Host` header ngrok sends.
- `localhost` and `127.0.0.1` — so local dev still works on your machine.

If ngrok gives you a **different** subdomain tomorrow, either:

1. Update `NGROK_HOST` in `vite.config.ts` to match, **or**
2. In the ngrok dashboard, attach your **reserved domain** so it stays `moody-supplier-map.ngrok-free.dev`.

### Commands (two terminals)

**Terminal 1 — Ember UI**

```powershell
cd C:\Users\aashi\OneDrive\Desktop\Ember
npm run dev
```

Or:

```powershell
npm run hackathon:ui
```

**Terminal 2 — ngrok (where `ngrok.exe` is)**

```powershell
ngrok http 5173
```

Confirm the forwarding line reads like:

`https://moody-supplier-map.ngrok-free.dev -> http://localhost:5173`

**Authtoken (once per machine)**

```powershell
ngrok config add-authtoken YOUR_TOKEN
```

### What works without Hardhat tomorrow

- **Home, Talk, Commitment, Drops (UI),** login mock, wallet **connect** UI (MetaMask may warn if no local chain — that’s OK for a UI-first pitch).
- **Vault / Pool pages** need a **running chain + deployed contracts** to succeed on-chain; for demo day you can narrate: “We’ll light this up live after deploy” or run Part B below.

### When you say “run everything” (blockchain day)

Use **three** terminals in order:

1. **Hardhat node** — local blockchain JSON-RPC on `http://127.0.0.1:8545`

   ```powershell
   npm run node
   ```

2. **Deploy contracts** — writes addresses to `src/contracts/addresses.json`

   ```powershell
   npm run deploy:local
   ```

3. **Frontend**

   ```powershell
   npm run dev
   ```

4. **MetaMask:** Custom network — RPC `http://127.0.0.1:8545`, Chain ID **31337**, currency **ETH**. Import a test account from the Hardhat terminal output if you need funded ETH.

5. **Optional — friend on another network:** second ngrok tunnel `ngrok http 8545` and use that URL as RPC in their MetaMask (not needed if everyone is on your Wi‑Fi and firewall + `--hostname 0.0.0.0` for Hardhat are set).

---

## Part B — Big picture: how Ember uses “Web3”

### What is a blockchain (in one paragraph)?

A **blockchain** is a shared ledger: many computers agree on an ordered list of **transactions**. Each account has a balance and can **sign** transactions with a private key. **Smart contracts** are programs deployed at an **address**; you call them by sending transactions or read-only **RPC calls**. No central server owns the rules — the **contract code** on-chain does.

### What is Hardhat?

**Hardhat** is a **developer toolchain** for Ethereum-compatible chains:

- Runs a **local node** (`npm run node`) with fake ETH and instant blocks.
- **Compiles** Solidity (`*.sol`) to bytecode.
- **Deploys** contracts via scripts (`contracts/scripts/deploy.ts`).
- Uses **ethers.js** from scripts to talk to the node.

**Chain ID 31337** is Hardhat’s default local network ID. Your frontend checks for it when using the “local dev” path.

### How the React app talks to the chain

1. **MetaMask** injects `window.ethereum` (EIP-1193 provider).
2. The app uses **ethers v6** `BrowserProvider` / `JsonRpcSigner` to:
   - read balances and contract state (`call` / `eth_call`);
   - send transactions (`sendTransaction`, contract methods that change state).
3. **Contract addresses** come from `src/contracts/addresses.json` (filled by `deploy:local`).
4. **ABIs** (function signatures) are inlined in `src/web3/contracts.ts` so TypeScript knows how to encode calls.

### What is an NFT?

An **NFT** (non-fungible token) is usually an **ERC-721** token: unique `tokenId`, **owner** address, **metadata** (often a URI). In Ember, **TamashiiNFT** is a **soulbound** badge concept (transfers disabled in the prototype) — “proof of discipline” as a unique token per user, not a tradeable JPEG market.

### The three contracts (detailed)

All live under `contracts/contracts/` and deploy from one script.

#### 1. `EmberVault.sol` — staking & discipline tiers

- **Purpose:** Users **stake native ETH** (on local Hardhat, that’s fake ETH). The vault tracks balance, **streak**, and derives **tier** and **APY** for the story (Bronze → Diamond).
- **Typical functions:** `stake()` (payable), `withdraw(amount)`, view getters like `getBalance`, `getStreakDays`, `getTier`, `getAPY`.
- **Why it matters for the product:** Ties “financial discipline” to **on-chain, verifiable** staking behavior, not just a database flag.
- **Frontend:** `VaultPage.tsx` — stake/withdraw buttons, reads live values when connected to the right network.

#### 2. `TamashiiNFT.sol` — soulbound discipline NFT

- **Purpose:** Represents **tier / identity** as an NFT minted to the user (prototype: **owner-only mint**, non-transferable hooks).
- **Why “soulbound”:** Prevents selling the badge — it stays tied to the wallet that earned it (aligns with “proof of discipline” narrative).
- **Frontend:** Addresses are deployed; full UI minting flow can be extended; concept is central to the pitch deck.

#### 3. `KizunaPool.sol` — single shared accountability pool (simplified UI)

- **Purpose:** **One pool** model for the hackathon UI: **createPool** once (pool #1), then **joinPool** with **msg.value** equal to stake, then **checkIn** for daily accountability.
- **On-chain state:** Pool metadata, member list, check-in events (exact fields in the Solidity file).
- **Frontend:** `PoolsPage.tsx` — create → join (stake tx) → check-in tx; activity log in `localStorage` for demo narrative.

---

## Part C — Repo map (where to look)

| Area | Path |
|------|------|
| Frontend entry | `src/main.tsx`, `src/ui/App.tsx` |
| Wallet / network | `src/web3/wallet.tsx`, `src/web3/contracts.ts` |
| Contract addresses | `src/contracts/addresses.json` (after deploy) |
| Solidity | `contracts/contracts/*.sol` |
| Hardhat config | `contracts/hardhat.config.ts` |
| Deploy script | `contracts/scripts/deploy.ts` |
| Ngrok / demo scripts | `scripts/run-hackathon-ui.ps1`, `scripts/ngrok-5173.example.ps1` |
| Env example | `.env.example` (`VITE_OPENROUTER_API_KEY`, etc.) |

---

## Part D — One-minute judge script (suggested)

1. **Problem:** Money habits are emotional; people need accountability and proof of consistency.
2. **Ember:** AI **Talk** builds a psychological profile; **Commitment** projects savings; **Vault** stakes with tiered APY story; **Pool** is social accountability on-chain.
3. **Tech:** React + Vite, MetaMask, ethers.js, Solidity on Hardhat; optional OpenRouter for AI.
4. **Live:** Open the **moody** HTTPS link; walk through Talk + Commitment; if chain is up, show one **stake** or **pool join** tx in MetaMask.

---

## Part E — Troubleshooting

| Symptom | Likely cause | Fix |
|--------|----------------|-----|
| `403` / blocked host on ngrok URL | Host not in `allowedHosts` | Match `vite.config.ts` to your ngrok hostname |
| Blank or failed RPC from friend | Hardhat bound to 127.0.0.1 only | Run node with public hostname / tunnel 8545 |
| MetaMask “wrong network” | Chain ID mismatch | Use 31337 for local Hardhat |
| Vault/Pool errors after git pull | No deploy on current node | `npm run deploy:local` again |

---

Good luck — ship the story, show the URL, and use chain only when you’re ready to prove transactions live.
