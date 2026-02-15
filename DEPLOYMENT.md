# Deployment Guide - Decentralized Escrow System

## 🎯 Quick Start Deployment

### Prerequisites Checklist
- [ ] Node.js v16+ installed
- [ ] MongoDB running locally or MongoDB Atlas account
- [ ] MetaMask browser extension
- [ ] Sepolia testnet ETH ([Get from faucet](https://sepoliafaucet.com/))
- [ ] Infura or Alchemy account for RPC URL

---

## Step-by-Step Deployment

### 1. Initial Setup

```bash
# Navigate to project
cd C:\Users\USER\MyEscrow

# Install all dependencies
npm install
npm run install:all
```

### 2. Environment Configuration

Create `.env` file in the root directory:

```bash
# Copy from example
cp .env.example .env
```

**Edit `.env` with your values:**
```env
# Backend
PORT=5000
MONGODB_URI=mongodb://localhost:27017/escrow-system
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/escrow

JWT_SECRET=your_secure_random_string_here

# Blockchain
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
CONTRACT_ADDRESS=will_be_filled_after_deployment
PRIVATE_KEY=your_wallet_private_key_for_deployment

# Optional: For contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**Create `frontend/.env`:**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CONTRACT_ADDRESS=will_be_filled_after_deployment
REACT_APP_NETWORK_ID=11155111
REACT_APP_NETWORK_NAME=Sepolia
```

---

### 3. Deploy Smart Contract to Sepolia

```bash
cd contracts

# Compile contracts
npx hardhat compile

# Run tests (optional but recommended)
npx hardhat test

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
```

**Example output:**
```
Deploying EscrowContract...
Deploying with account: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Account balance: 0.5 ETH
EscrowContract deployed to: 0x1234567890abcdef1234567890abcdef12345678

🎉 Deployment successful!
```

**Important:** Copy the deployed contract address!

---

### 4. Update Configuration with Contract Address

Update these files with your deployed contract address:

**Root `.env`:**
```env
CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
```

**`frontend/.env`:**
```env
REACT_APP_CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
```

---

### 5. Copy Contract ABI to Frontend

```bash
# From contracts directory
cp artifacts/contracts/EscrowContract.sol/EscrowContract.json ../frontend/src/contracts/
```

---

### 6. Start MongoDB

**Option A: Local MongoDB**
```bash
# Start MongoDB service
mongod
```

**Option B: MongoDB Atlas**
- Create free cluster at [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas)
- Get connection string
- Update `MONGODB_URI` in `.env`

---

### 7. Start Backend Server

```bash
# In new terminal
cd backend
npm run dev
```

**Expected output:**
```
✅ Connected to MongoDB
🚀 Server running on port 5000
📡 API available at http://localhost:5000/api
```

**Test the API:**
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"ok","message":"Escrow API is running"}
```

---

### 8. Start Frontend Development Server

```bash
# In new terminal
cd frontend
npm run dev
```

**Application opens at:** `http://localhost:3000`

---

## ✅ Verification Steps

### 1. Test Frontend
- [ ] Landing page loads
- [ ] Register a new client account
- [ ] Login works
- [ ] Dashboard displays

### 2. Test MetaMask Connection
- [ ] Click "Connect Wallet" on dashboard
- [ ] MetaMask prompts for connection
- [ ] Wallet address displays correctly
- [ ] Verify network is Sepolia

### 3. Test Smart Contract Interaction
```bash
# Run contract tests
cd contracts
npx hardhat test

# Should show all tests passing
```

### 4. Verify Backend API
```bash
# Test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "Client"
  }'
```

---

## 🚀 Production Deployment

### Backend Deployment (Heroku Example)

```bash
cd backend

# Login to Heroku
heroku login

# Create app
heroku create your-escrow-api

# Set environment variables
heroku config:set MONGODB_URI=your_mongodb_atlas_uri
heroku config:set JWT_SECRET=your_secret
heroku config:set CONTRACT_ADDRESS=your_contract_address

# Deploy
git push heroku main
```

### Frontend Deployment (Vercel)

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set production environment variables in Vercel dashboard:
# - REACT_APP_API_URL=https://your-escrow-api.herokuapp.com/api
# - REACT_APP_CONTRACT_ADDRESS=your_contract_address
# - REACT_APP_NETWORK_ID=11155111
```

---

## 🔧 Troubleshooting

### "Cannot connect to MongoDB"
- Verify MongoDB is running: `mongod`
- Check connection string in `.env`
- For Atlas: Whitelist your IP address

### "Invalid RPC URL"
- Verify Infura/Alchemy project ID
- Check you have Sepolia endpoint enabled
- Test RPC URL in browser

### "MetaMask transaction failed"
- Ensure you're on Sepolia network
- Check you have enough Sepolia ETH
- Verify contract address is correct
- Check gas limit

### "Contract not deployed"
- Run `npx hardhat compile` first
- Ensure funded wallet in `.env`
- Check Sepolia RPC URL is valid

### "401 Unauthorized on API"
- Login again to get fresh JWT token
- Check token in localStorage
- Verify JWT_SECRET matches in backend

---

## 📊 Monitoring & Logs

### Backend Logs
```bash
cd backend
npm run dev
# Watch console for errors
```

### Contract Events
View on [Sepolia Etherscan](https://sepolia.etherscan.io/)
- Search for your contract address
- View transactions and events

### Database
```bash
# Connect to MongoDB
mongo
# Or MongoDB Compass for GUI
```

---

## 🔒 Security Checklist

Before going to production:

- [ ] Change all default secrets
- [ ] Use strong JWT_SECRET (32+ random characters)
- [ ] Never commit `.env` to git
- [ ] Use HTTPS for production API
- [ ] Set up CORS properly
- [ ] Rate limit API endpoints
- [ ] Run smart contract security audit
- [ ] Test all user roles thoroughly
- [ ] Verify contract on Etherscan

---

## 📝 Common Commands

```bash
# Smart Contract
cd contracts
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network sepolia

# Backend
cd backend
npm run dev          # Development
npm start            # Production

# Frontend
cd frontend
npm run dev          # Development
npm run build        # Production build

# Full Reset
# Drop MongoDB database
# Redeploy smart contract
# Update all config files
# Restart all services
```

---

## 🆘 Getting Help

If you encounter issues:

1. Check this deployment guide
2. Review [README.md](file:///c:/Users/USER/MyEscrow/README.md)
3. Check [walkthrough.md](file:///c:/Users/USER/.gemini/antigravity/brain/f85b7943-377d-4d4e-b4cc-8a080d626d41/walkthrough.md) for architecture details
4. Review error logs in backend console
5. Check browser console for frontend errors

---

*Deployment guide complete. Follow these steps carefully to ensure successful deployment of your escrow platform.* 
