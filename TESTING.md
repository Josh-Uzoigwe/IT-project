# Quick Testing Guide

## 🚀 How to Test the Escrow Platform

### Step 1: Install Dependencies (✓ Done!)

All dependencies are being installed. Wait for the npm install commands to complete.

### Step 2: Start MongoDB

**Option A: Install MongoDB locally**
1. Download: https://www.mongodb.com/try/download/community
2. Install and start the MongoDB service
3. MongoDB will run on default port 27017

**Option B: Use MongoDB Atlas (Cloud - Easier)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a free cluster (M0)
4. Get connection string
5. Update `.env` file: `MONGODB_URI=your_connection_string`

**Option C: Skip MongoDB for now (Limited testing)**
- Backend won't start without MongoDB
- You can test smart contracts and frontend UI only

### Step 3: Test Smart Contracts (Optional)

```bash
cd contracts
npx hardhat compile
npx hardhat test
```

This tests the blockchain escrow logic without needing MongoDB.

### Step 4: Start Backend API

**In a new terminal:**
```bash
cd backend
npm run dev
```

**Expected output:**
```
✅ Connected to MongoDB
🚀 Server running on port 5000
📡 API available at http://localhost:5000/api
```

**If it fails:**
- Make sure MongoDB is running
- Check `.env` file exists in root directory
- Try: `node server.js` instead of `npm run dev`

### Step 5: Start Frontend

**In another new terminal:**
```bash
cd frontend
npm start
```

**Browser will open at:** http://localhost:3000

### Step 6: Test the Application

#### Test 1: Frontend UI (No MongoDB needed)
1. Open http://localhost:3000
2. You should see the landing page with:
   - Hero section
   - Features
   - "How It Works" section
3. Click "Get Started" or "Register"
4. See the registration form

#### Test 2: Full Registration & Login (Requires MongoDB)
1. Click "Register"
2. Fill in:
   - Name: Test Client
   - Email: client@test.com
   - Password: password123
   - Role: Client
3. Click "Create Account"
4. You should be redirected to Dashboard
5. Logout and try logging in again

#### Test 3: Wallet Connection (Requires MetaMask)
1. Install MetaMask browser extension
2. Create/import a wallet
3. On Dashboard, click "Connect Wallet"
4. Approve in MetaMask
5. Wallet address should display

#### Test 4: API Endpoints (Requires MongoDB)

**Test Health Check:**
```bash
curl http://localhost:5000/api/health
```

**Test Registration via API:**
```bash
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"password123\",\"role\":\"Freelancer\"}"
```

### Step 7: Test Smart Contracts

```bash
cd contracts
npx hardhat test
```

You should see all tests passing:
- ✓ Project creation tests
- ✓ Funding tests
- ✓ Milestone submission/approval tests
- ✓ Dispute resolution tests

---

## 🐛 Common Issues & Solutions

### "nodemon not found"
✅ FIXED - Dependencies are being installed

### "Cannot connect to MongoDB"
**Solution 1:** Install MongoDB locally
**Solution 2:** Use MongoDB Atlas (cloud)
**Solution 3:** Skip backend testing for now

### "Port 5000 already in use"
```bash
# Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <process_id> /F
```

### "Module not found" errors
```bash
# Reinstall dependencies
cd backend
npm install
cd ../frontend
npm install
```

### Frontend won't start
```bash
cd frontend
npm install
npm start
```

---

## ✅ What You Can Test Without Blockchain Deployment

**Without Smart Contract Deployed:**
- ✓ Landing page UI
- ✓ Registration & Login
- ✓ Dashboard UI
- ✓ Project creation (database only)
- ✓ Messaging system
- ✓ All backend API endpoints

**Requires Smart Contract (Advanced):**
- Funding projects with ETH
- Milestone payments
- Dispute resolution on-chain
- View on Etherscan

---

## 📝 Quick Commands Reference

```bash
# Backend
cd backend
npm run dev              # Start with nodemon (auto-restart)
node server.js           # Start normally

# Frontend  
cd frontend
npm start                # Start development server
npm run build            # Build for production

# Smart Contracts
cd contracts
npx hardhat compile      # Compile contracts
npx hardhat test         # Run tests
npx hardhat node         # Start local blockchain

# Check if services are running
curl http://localhost:5000/api/health    # Backend
# Frontend: Open http://localhost:3000 in browser
```

---

## 🎯 Minimal Testing Path (No External Dependencies)

1. **Test Smart Contracts**
   ```bash
   cd contracts
   npx hardhat test
   ```

2. **Test Frontend UI**
   ```bash
   cd frontend
   npm start
   # Open http://localhost:3000
   ```

3. **View Components:**
   - Landing page ✓
   - Registration form ✓  
   - Login form ✓
   - Dashboard layout ✓

This tests the core code without needing MongoDB or blockchain deployment!

---

## 📊 Testing Checklist

- [ ] Dependencies installed
- [ ] Smart contract tests pass
- [ ] Frontend starts and displays landing page
- [ ] Registration page displays
- [ ] Dashboard page displays (after login)
- [ ] MongoDB connected (optional)
- [ ] Backend API running (optional)
- [ ] MetaMask connected (optional)
- [ ] Full user flow test (optional)

---

*For full deployment to blockchain, see [`DEPLOYMENT.md`](file:///c:/Users/USER/MyEscrow/DEPLOYMENT.md)*
