# 🔥 Ember — AI + Web3 Financial Discipline Platform

**Build discipline that sticks. Backed by real stake. Verified on-chain.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-blue.svg)](https://soliditylang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![Hardhat](https://img.shields.io/badge/Hardhat-3.0-yellow.svg)](https://hardhat.org)

---

## 🎯 The Problem

Financial discipline fails for one reason. **There is no consequence for quitting.**

Goals are free to set. Promises cost nothing to break. So we break them. Quietly. Repeatedly. Until we stop trying. What's missing is a system where commitment carries weight, inconsistency has a cost you can feel, and showing up every day actually matters.

---
<img width="1600" height="835" alt="image" src="https://github.com/user-attachments/assets/bfdc6c3e-e819-4a1b-978f-c25eb81563d6" />


## 💡 Our Solution

Ember combines **conversational AI** with **Web3 incentives** to make financial discipline feel like something worth protecting.

- **AI that understands you.** Voice conversations build your Psychological Financial Profile.
- **Real stake. Real consequences.** Deposit funds. Missed days deduct. Perfect consistency returns everything plus bonus.
- **Streak protection.** Slip up? Your streak survives. Your wallet absorbs the fall.
- **Proof of Discipline.** Earn soulbound tiers from Bronze to Diamond. Verifiable on-chain.
- **Social accountability.** Private pools where friends stake together and share consequences.

---
## Talk Page
<img width="1600" height="843" alt="image" src="https://github.com/user-attachments/assets/e3a61d78-c1eb-4d7f-ad41-98ca8343cc3f" />
## Talk Page Report
<img width="1600" height="893" alt="image" src="https://github.com/user-attachments/assets/e26044de-aac8-48e1-9625-3f78fe8443bd" />


## Vault Page
<img width="1600" height="884" alt="image" src="https://github.com/user-attachments/assets/c82bfa5e-c7ac-423d-84ec-979e9d081e1d" />

## Dashboard Page
<img width="1600" height="828" alt="image" src="https://github.com/user-attachments/assets/9233490b-d4e8-4c55-bf77-46cd7a48a1fd" />

## Commitment Page
<img width="1600" height="892" alt="image" src="https://github.com/user-attachments/assets/c0faafa4-0ade-4afa-ab72-e9ccee7c83e9" />

## Commitment Strategy AI
<img width="1600" height="893" alt="image" src="https://github.com/user-attachments/assets/33132590-4471-4e2a-9db8-fea9a827313c" />



## Pool Page
<img width="1600" height="821" alt="image" src="https://github.com/user-attachments/assets/0cafb803-26dd-458a-a1ea-5a16e2b6aadc" />

## Drops Page
<img width="1600" height="851" alt="image" src="https://github.com/user-attachments/assets/0f1b0e44-86ad-4081-a996-74ba4c67f5a2" />


## 🏗️ System Architecture
User Entry → AI Profile → Commitment → Blockchain → Verification → Reward → Return Deposit + Yield 


| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| Frontend | React 19 + TypeScript + Vite | Component architecture |
| Styling | Tailwind CSS + shadcn/ui | Design system |
| Motion | GSAP + Lenis + Framer Motion | Smooth scroll and animations |
| 3D | React Three Fiber + Drei | Companion rendering |
| Web3 | MetaMask + ethers.js v6 | Wallet and transactions |
| Blockchain | Solidity + Hardhat + OpenZeppelin | Smart contracts |
| AI | OpenRouter + GPT-4o + Web Speech API | Conversational intelligence |
| Storage | IPFS + LocalStorage | Metadata and preferences |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask browser extension
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ember.git
cd ember

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your OpenRouter API key to .env.local

Run Locally (Free Mode)
bash
npm run dev
Visit http://localhost:5173

Run with Blockchain (Full Experience)
Terminal 1 — Start local Hardhat node

bash
npm run node
Terminal 2 — Deploy contracts

bash
npm run deploy:local
Terminal 3 — Start frontend

bash
npm run dev
```
## Project Structure
```bash
ember/
├── contracts/               # Solidity smart contracts
│   ├── contracts/
│   │   ├── EmberVault.sol   # Staking and tier logic
│   │   ├── TamashiiNFT.sol  # Soulbound discipline badge
│   │   └── KizunaPool.sol   # Group accountability pools
│   ├── scripts/
│   │   └── deploy.ts        # Deployment script
│   └── hardhat.config.ts    # Hardhat configuration
├── src/
│   ├── components/          # React components
│   ├── pages/               # Page routes
│   ├── web3/                # Web3 integration
│   ├── contracts/           # Deployed addresses
│   └── styles/              # Global styles
├── public/                  # Static assets
└── package.json             # Dependencies
```
