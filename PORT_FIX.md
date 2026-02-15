# Port 5000 Already in Use - Quick Fix

## The Problem:
Backend crashed with error: `EADDRINUSE` - Port 5000 is already in use.

This happens when:
- The backend is already running from a previous attempt
- Another application is using port 5000

## Solution 1: Kill the Process on Port 5000 (Recommended)

### In PowerShell:
```powershell
# Find the process using port 5000
netstat -ano | findstr :5000

# You'll see output like:
# TCP    0.0.0.0:5000    0.0.0.0:0    LISTENING    12345
# The last number (12345) is the PID

# Kill that process (replace 12345 with your actual PID)
taskkill /PID 12345 /F
```

### Then restart backend:
```bash
cd backend
npm run dev
```

---

## Solution 2: Change the Backend Port

If you want both to run, edit `.env`:

```env
PORT=5001
```

Then restart backend and update frontend `.env`:
```env
REACT_APP_API_URL=http://localhost:5001/api
```

---

## Quick Commands:

**Kill port 5000 process:**
```powershell
netstat -ano | findstr :5000
taskkill /PID <YOUR_PID> /F
```

**Restart backend:**
```bash
cd C:\Users\USER\MyEscrow\backend
npm run dev
```

---

## Check if it's running:
```powershell
curl http://localhost:5000/api/health
```

Should return: `{"status":"ok","message":"Escrow API is running"}`
