# Decentralized Freelance Work Escrow System

A blockchain-enabled platform that protects both student freelancers and clients during freelance transactions using smart contract escrow and milestone-based payments.

## 🎯 Features

- **Smart Contract Escrow**: Secure fund locking and automated milestone payments
- **Milestone-Based Payments**: Release funds only when work is approved
- **Dispute Resolution**: Decentralized arbitration system
- **User Profiles**: Client, Freelancer, and Arbitrator roles
- **Messaging System**: Built-in communication between parties
- **Ratings & Reviews**: Transparent feedback system

## 🏗️ Architecture

### Technology Stack
- **Smart Contracts**: Solidity (Ethereum Sepolia Testnet)
- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: React.js with Web3 integration
- **Blockchain Interaction**: ethers.js
- **Authentication**: JWT

### Project Structure
```
MyEscrow/
├── contracts/          # Solidity smart contracts
├── backend/           # Express.js API server
├── frontend/          # React application
└── package.json       # Monorepo configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- MetaMask browser extension
- Sepolia testnet ETH ([Get from faucet](https://sepoliafaucet.com/))

### Installation

1. **Clone the repository**
   ```bash
   cd MyEscrow
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   mongod
   ```

### Development

1. **Compile and deploy smart contracts**
   ```bash
   cd contracts
   npx hardhat compile
   npx hardhat run scripts/deploy.js --network sepolia
   ```

2. **Start backend server**
   ```bash
   npm run dev:backend
   ```

3. **Start frontend application**
   ```bash
   npm run dev:frontend
   ```

### Testing

```bash
# Test smart contracts
npm run test:contracts

# Test backend API
npm run test:backend

# Test frontend
npm run test:frontend
```

## 📋 Usage Workflow

1. **Registration**: Users sign up and link MetaMask wallet
2. **Project Creation**: Client creates project with milestones
3. **Bidding**: Freelancers submit proposals
4. **Escrow Funding**: Client funds smart contract
5. **Work Submission**: Freelancer submits deliverables
6. **Approval**: Client approves milestone → automatic payment
7. **Dispute Resolution**: Optional arbitrator intervention
8. **Completion**: All milestones paid → ratings exchanged

## 🔐 Security Features

- ReentrancyGuard protection
- Access control modifiers
- Pull payment pattern
- JWT authentication
- Input validation and sanitization

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.
