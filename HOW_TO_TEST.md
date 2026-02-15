# HOW TO TEST - Simple Guide

## 🎯 Current Situation

- ✅ All code has been created (Smart contracts, Backend, Frontend)
- ⚠️ npm installations having network issues  
- ✅ Environment files created

## 📝 What You Need to Test

### For Basic Testing (Frontend UI only):
1. Working internet connection
2. Node.js installed

### For Full Testing (With backend):
1. MongoDB running (local or Atlas)
2. All npm packages installed

### For Blockchain Testing:
1. MetaMask installed
2. Sepolia testnet ETH
3. Infura/Alchemy RPC URL

---

## 🚀 Quick Start (Choose One Option)

### OPTION 1: Test Smart Contracts Only (Easiest)

```bash
# Navigate to contracts folder
cd C:\Users\USER\MyEscrow\contracts

# Install dependencies
npm install

# Test
npx hardhat test
```

**What this tests:** The core blockchain escrow logic

---

### OPTION 2: Test Frontend UI (No Backend Needed)

```bash  
# Navigate to frontend
cd C:\Users\USER\MyEscrow\frontend

# Install dependencies (may take a few minutes)
npm install

# Start development server
npm start
```

**Browser opens at:** http://localhost:3000

**What you'll see:**
- Beautiful landing page
- Registration/Login forms
- Dashboard interface  
- Project details pages

**Note:** Some features won't work without backend (like actually registering), but you can see the complete UI.

---

### OPTION 3: Full Stack Testing (Backend + Frontend)

**Step 1: Start MongoDB**

Choose one:
- Install locally: https://www.mongodb.com/try/download/community
- Use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

**Step 2: Install Backend Dependencies**

```bash
cd C:\Users\USER\MyEscrow\backend

# Try this first
npm install

# If it fails, try:
npm cache clean --force
npm install --legacy-peer-deps

# Or install packages one by one
npm install express mongoose bcryptjs jsonwebtoken dotenv cors express-validator ethers nodemon --save
```

**Step 3: Start Backend**

```bash
# Make sure you're in backend folder
cd C:\Users\USER\MyEscrow\backend

# Start server  
npm run dev

# Or if nodemon doesn't work:
node server.js
```

**Expected output:**
```
✅ Connected to MongoDB
🚀 Server running on port 5000
```

**Step 4: Install Frontend Dependencies**

```bash
# Open NEW terminal
cd C:\Users\USER\MyEscrow\frontend

npm install
```

**Step 5: Start Frontend**

```bash
# In frontend folder
npm start
```

**Browser opens at:** http://localhost:3000

**Now you can test:**
- ✅ Create account  
- ✅ Login
- ✅ Create projects
- ✅ Connect MetaMask
- ✅ Full user workflow

---

## 🐛 If npm install Keeps Failing

### Try Yarn Instead

```bash
# Install Yarn globally
npm install -g yarn

# Then in each folder:
cd backend
yarn install

cd ../frontend  
yarn install

cd ../contracts
yarn install
```

### Or Wait and Retry

Sometimes npm registry has temporary issues. Try again in 10-15 minutes.

---

## ✅ What to Test Once Running

### 1. Landing Page (http://localhost:3000)
- [ ] Page loads with hero section
- [ ] "How It Works" section visible
- [ ] Navigation works

### 2. Registration
- [ ] Click "Get Started"
- [ ] Fill registration form
- [ ] Select role (Client/Freelancer)
- [ ] Submit and redirect to dashboard

### 3. Dashboard  
- [ ] Shows user name
- [ ] "Connect Wallet" button works
- [ ] MetaMask connection works
- [ ] Projects section displays

### 4. Backend API (if running)
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Should return: {"status":"ok","message":"Escrow API is running"}
```

### 5. Smart Contracts (if hardhat installed)
```bash
cd contracts
npx hardhat test
# Should see 15+ tests passing
```

---

## 📁 Files Created for You

**Core Application:**
- `contracts/` - Smart contracts + tests
- `backend/` - Complete REST API
- `frontend/` - React application

**Documentation:**
- `TESTING.md` - Detailed testing guide
- `TESTING_ALTERNATIVE.md` - Alternative methods  
- `DEPLOYMENT.md` - Production deployment
- `README.md` - Project overview

**Configuration:**
- `.env` - Backend environment variables
- `frontend/.env` - Frontend configuration

---

## 🎉 Expected Results

**Smart Contract Tests:**
```
✓ Should create a project with valid parameters
✓ Should fund project with correct amount  
✓ Should allow freelancer to submit milestone
✓ Should allow client to approve milestone and release payment
... (15+ passing tests)
```

**Frontend:**
- Modern, professional UI
- Smooth navigation
- Responsive design
- MetaMask integration ready

**Backend:**
- RESTful API with 25+ endpoints
- JWT authentication
- MongoDB integration
- Web3 service layer

---

## ❓ Quick Troubleshooting

**Problem:** npm install fails
**Solution:** Try `npm install --legacy-peer-deps` or use `yarn`

**Problem:** "MongoDB connection failed"
**Solution:** Make sure MongoDB is running or update connection string in `.env`

**Problem:** "Port 5000 already in use"
**Solution:** Kill the process: `netstat -ano | findstr :5000` then `taskkill /PID <id> /F`

**Problem:** Frontend won't connect to backend  
**Solution:** Check `frontend/.env` has `REACT_APP_API_URL=http://localhost:5000/api`

---

## 🔗 Next Steps After Testing

1. Review the code structure
2. Deploy smart contract to Sepolia testnet (see `DEPLOYMENT.md`)
3. Test full workflow with real blockchain
4. Deploy to production

---

**Need help?** Check the detailed guides:
- [`TESTING.md`](file:///c:/Users/USER/MyEscrow/TESTING.md) - Complete testing procedures
- [`DEPLOYMENT.md`](file:///c:/Users/USER/MyEscrow/DEPLOYMENT.md) - Blockchain deployment
- [`README.md`](file:///c:/Users/USER/MyEscrow/README.md) - Project overview
