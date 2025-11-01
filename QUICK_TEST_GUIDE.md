# Quick Transfer Test - Cheat Sheet

## 🚀 Quick Start (5 Minutes)

### Setup (Run Once)
```bash
# Terminal 1: Start Ganache
ganache -d -a 10 -e 1000 -p 8545 -i 1337

# Terminal 2: Deploy
cd /Users/screechin_03/Desktop/Evaltrons
npm run compile && npm run deploy && npm run register-officers

# Terminal 3: Start App
npm run dev
# Open: http://localhost:3000
```

---

## 👥 Accounts to Import in MetaMask

### Alice (Sender) - Account 1
```
Address: 0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0
Private Key: 0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1
```

### Bob (Receiver) - Account 2
```
Address: 0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b
Private Key: 0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c
```

---

## ✅ Test Flow (Step by Step)

### 1️⃣ Register Alice
- **Switch to:** Alice's account in MetaMask
- **Go to:** http://localhost:3000
- **Click:** "Register as Owner"
- **Fill:**
  - Name: Alice Johnson
  - ID Type: Aadhaar
  - ID Number: 123456789012
  - Contact: alice@example.com
  - State: Maharashtra
  - District: Mumbai
- **Submit & Approve** MetaMask

### 2️⃣ Register Property (Alice)
- **Click:** "Register Property"
- **Fill:**
  - Address: 123 Marine Drive, Mumbai
  - State: Maharashtra
  - District: Mumbai
  - City: Mumbai
  - Area: 1500
  - Type: Residential
  - Survey #: SRV-123-456
  - Sub-Division: Block A
- **Upload:** Any image/PDF
- **Submit & Approve** MetaMask
- **Note:** Property ID (e.g., #1)

### 3️⃣ Verify Property (Government)
- **Go to:** http://localhost:3000/government-portal
- **Login:**
  - Employee ID: `GVT001`
  - Password: `officer123`
  - State: Maharashtra
  - District: Mumbai
- **Find:** Alice's property in list
- **Click:** "View Details" → "Verify Property"
- **Approve** MetaMask (0.001 ETH fee)
- **Check:** ✅ Property & Owner verified
- **Logout**

### 4️⃣ Register Bob
- **Switch to:** Bob's account in MetaMask
  - Click MetaMask extension
  - Select "Bob (Ganache 2)" account
  - The page will automatically detect the account change
- **Refresh page** (if needed)
- **Click:** "Register as Owner"
- **Fill:**
  - Name: Bob Smith
  - ID Type: PAN
  - ID Number: ABCDE1234F
  - Contact: bob@example.com
  - State: Maharashtra
  - District: Pune
- **Submit & Approve** MetaMask
- ✅ **Bob is now registered!**

### 5️⃣ Create Transfer (Alice → Bob)
- **Switch back to:** Alice's account in MetaMask
  - Click MetaMask extension
  - Select "Alice (Ganache 1)" account
  - The page will detect the account change
- **Refresh page** to reconnect as Alice
- **Click:** "Request Transfer"
- **Select:** Property #1
- **Enter Bob's address:**
  ```
  0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b
  ```
- **Upload:** Transfer document (any PDF/image)
- **Submit & Approve** MetaMask (0.002 ETH fee)
- **Check:** ✅ Transfer request created

### 6️⃣ Approve Transfer (Government)
- **Go to:** http://localhost:3000/government-portal
- **Login:** (same as step 3)
- **Click:** "Transfer Requests" tab
- **Find:** Alice → Bob transfer
- **Click:** "View Details" → "Approve Transfer"
- **Approve** MetaMask
- **Check:** ✅ Fee received (0.002 ETH)

### 7️⃣ Complete Transfer (Bob or Alice)
- **Go to:** http://localhost:3000/complete-transfer
- **You'll see:** Approved transfer request
- **Click:** "Complete Transfer"
- **Approve** MetaMask
- **Check:** ✅ Transfer completed

### 8️⃣ Verify Ownership Changed
- **As Bob:**
  - Go to "My Properties"
  - **See:** Property #1 now in Bob's list
- **As Alice:**
  - Go to "My Properties"
  - **See:** Property #1 is gone

---

## 🎯 Quick Links

| Page | URL |
|------|-----|
| Home | http://localhost:3000 |
| Register Owner | http://localhost:3000/register-owner |
| Register Property | http://localhost:3000/register-property |
| Request Transfer | http://localhost:3000/request-transfer |
| Complete Transfer | http://localhost:3000/complete-transfer |
| My Properties | http://localhost:3000/my-properties |
| Government Portal | http://localhost:3000/government-portal |

---

## 🔑 Government Portal Credentials

| Officer | Employee ID | Password | State | District |
|---------|-------------|----------|-------|----------|
| Officer 1 | GVT001 | officer123 | Maharashtra | Mumbai |
| Officer 2 | GVT002 | officer123 | Karnataka | Bangalore |
| Officer 3 | GVT003 | officer123 | Delhi | New Delhi |
| Officer 4 | GVT004 | officer123 | Tamil Nadu | Chennai |

---

## 💰 Expected Fees

| Action | Fee | Who Receives |
|--------|-----|--------------|
| Owner Registration | Free | - |
| Property Registration | Free | - |
| Property Verification | 0.001 ETH | Government Officer |
| Transfer Request | 0.002 ETH | Government Officer |
| Transfer Completion | Free | - |

---

## ⚠️ Common Issues

### "Receiver must be registered"
→ Bob needs to register first (Step 4)

### "Property must be verified"
→ Complete Step 3 (Government verification)

### Transaction failed
→ Check MetaMask is on "Ganache Local" network

### Can't see transfer request
→ Check government officer is in correct state/district

---

## 📊 Check Balances

### After Full Test:

```javascript
// In browser console (F12)
const { ethers } = require('ethers');
const provider = new ethers.BrowserProvider(window.ethereum);

// Alice's balance
const aliceBalance = await provider.getBalance('0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0');
console.log('Alice:', ethers.formatEther(aliceBalance), 'ETH');
// Expected: ~999.996 ETH (spent 0.002 on transfer + gas)

// Bob's balance
const bobBalance = await provider.getBalance('0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b');
console.log('Bob:', ethers.formatEther(bobBalance), 'ETH');
// Expected: ~999.998 ETH (only gas fees)

// Officer's balance (Account 5)
const officerBalance = await provider.getBalance('0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC');
console.log('Officer:', ethers.formatEther(officerBalance), 'ETH');
// Expected: ~999.973 ETH (received 0.001 + 0.002 ETH fees)
```

---

## 🎉 Success Checklist

- [ ] Alice registered as owner
- [ ] Property registered by Alice
- [ ] Property verified by government
- [ ] Bob registered as owner
- [ ] Transfer request created (0.002 ETH paid)
- [ ] Transfer approved by government (0.002 ETH received)
- [ ] Transfer completed
- [ ] Property now belongs to Bob
- [ ] Alice no longer has the property

---

## 🔄 Reset Test

To start fresh:

```bash
# Stop Ganache (Ctrl+C)
# Restart with same accounts
ganache -d -a 10 -e 1000 -p 8545 -i 1337

# Redeploy
npm run compile && npm run deploy && npm run register-officers

# Clear MetaMask activity (optional):
# Settings → Advanced → Clear activity tab data
```

---

## 📝 Notes

- Use **deterministic Ganache** (`-d` flag) for consistent accounts
- Always verify MetaMask network: **Ganache Local (1337)**
- Government officers automatically registered after deployment
- Either sender OR receiver can complete transfer
- All transactions are on local blockchain (not real ETH)

---

## Need Help?

See full guide: `TRANSFER_TESTING_GUIDE.md`
