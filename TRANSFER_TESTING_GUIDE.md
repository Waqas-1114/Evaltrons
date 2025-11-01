# Transfer Workflow Testing Guide

This guide will walk you through testing the complete property transfer workflow using Ganache accounts.

## Prerequisites

1. **Ganache is running:**
   ```bash
   ganache -d -a 10 -e 1000 -p 8545 -i 1337
   ```

2. **Contracts deployed:**
   ```bash
   npm run compile
   npm run deploy
   npm run register-officers
   ```

3. **Frontend running:**
   ```bash
   npm run dev
   ```
   Open: http://localhost:3000

## Test Scenario: Alice transfers property to Bob

We'll use:
- **Alice (Account 1):** Property Owner who wants to transfer
- **Bob (Account 2):** New Owner who will receive the property
- **Officer (Account 5):** Government officer who will approve

### Account Details from Ganache

```
Account 1 (Alice - Sender):
Address: 0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0
Private Key: 0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1

Account 2 (Bob - Receiver):
Address: 0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b
Private Key: 0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c

Account 5 (Deployer - already used for officers):
Address: 0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC
Private Key: 0x395df67f0c2d2d9fe1ad08d1bc8b6627011959b79c53d7dd6a3536a33ab8a4fd
```

---

## Step 1: Import Accounts to MetaMask

### Import Alice's Account (Account 1):
1. Open MetaMask
2. Click account icon → "Add account or hardware wallet" → "Import account"
3. Paste Private Key: `0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1`
4. Click "Import"
5. Rename account to "Alice (Ganache 1)"

### Import Bob's Account (Account 2):
1. Click account icon → "Add account or hardware wallet" → "Import account"
2. Paste Private Key: `0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c`
3. Click "Import"
4. Rename account to "Bob (Ganache 2)"

### Verify Network:
- Ensure MetaMask is connected to **"Ganache Local"** (Chain ID: 1337)
- Both accounts should show ~1000 ETH

---

## Step 2: Register Alice as Owner

1. **Switch to Alice's account** in MetaMask
2. Go to: http://localhost:3000
3. Click **"Connect MetaMask"**
4. Click **"Register as Owner"** card
5. Fill in the form:
   ```
   Full Name: Alice Johnson
   ID Document Type: Aadhaar
   ID Document Number: 123456789012
   Contact: alice@example.com
   Home State: Maharashtra
   Home District: Mumbai
   ```
6. Click **"Register as Owner"**
7. Approve MetaMask transaction
8. Wait for confirmation: ✅ Owner registered successfully

---

## Step 3: Register Property for Alice

1. **Still as Alice**, click **"Register Property"**
2. Fill in the property details:
   ```
   Property Address: 123 Marine Drive, Mumbai
   State: Maharashtra
   District: Mumbai
   City: Mumbai
   Area (sq. meters): 1500
   Property Type: Residential
   Survey Number: SRV-123-456
   Sub-Division: Block A
   ```
3. Upload a dummy property document (any image/PDF)
4. Click **"Register Property"**
5. Approve MetaMask transaction
6. Wait for confirmation: ✅ Property registered successfully
7. **Note the Property ID** (e.g., Property #1)

---

## Step 4: Verify Property (Government Officer)

### Login to Government Portal:
1. Go to: http://localhost:3000/government-portal
2. Login with credentials:
   ```
   Employee ID: GVT001
   Password: officer123
   State: Maharashtra
   District: Mumbai
   ```
3. Click **"Login"**

### Verify Alice's Property:
1. You should see Alice's property in **"Pending Verifications"** tab
2. Click **"View Details"** on the property
3. Review property information
4. Click **"Verify Property"**
5. Approve MetaMask transaction (0.001 ETH verification fee)
6. Wait for confirmation: ✅ Property verified
7. **Check:** Officer receives 0.001 ETH fee
8. **Note:** Both property AND Alice (owner) are now verified

### Logout:
- Click **"Logout"** from government portal

---

## Step 5: Register Bob as Owner

1. **Switch to Bob's account** in MetaMask
2. Refresh the page: http://localhost:3000
3. Click **"Connect MetaMask"**
4. Click **"Register as Owner"**
5. Fill in Bob's information:
   ```
   Full Name: Bob Smith
   ID Document Type: PAN
   ID Document Number: ABCDE1234F
   Contact: bob@example.com
   Home State: Maharashtra
   Home District: Pune
   ```
6. Click **"Register as Owner"**
7. Approve MetaMask transaction
8. Wait for confirmation: ✅ Owner registered successfully

### Important Note:
**Bob must be registered as an owner BEFORE Alice can transfer property to him!**

---

## Step 6: Create Transfer Request (Alice → Bob)

1. **Switch back to Alice's account** in MetaMask
2. Refresh the page
3. Click **"Request Transfer"** button (on dashboard or my-properties page)
4. Select the property:
   ```
   Property #1 - 123 Marine Drive, Mumbai (Mumbai, Maharashtra)
   ```
5. Enter Bob's wallet address:
   ```
   0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b
   ```
6. Upload transfer document (sale deed, any PDF/image)
7. Review the fee: **0.002 ETH will be charged**
8. Click **"Submit Transfer Request"**
9. Approve MetaMask transaction (pay 0.002 ETH)
10. Wait for confirmation: ✅ Transfer request submitted

### What Happened:
- Transfer fee (0.002 ETH) is locked in the contract
- Transfer request created on blockchain
- Request is pending government approval
- Alice's balance: ~999.998 ETH (minus gas fees)

---

## Step 7: Approve Transfer (Government Officer)

### Login to Government Portal Again:
1. Go to: http://localhost:3000/government-portal
2. Login with:
   ```
   Employee ID: GVT001
   Password: officer123
   State: Maharashtra
   District: Mumbai
   ```

### Approve Transfer:
1. Click **"Transfer Requests"** tab
2. You should see Alice → Bob transfer request
3. Click **"View Details"**
4. Review:
   - Property: #1 - 123 Marine Drive
   - From: Alice (0xFFcf...)
   - To: Bob (0x22d4...)
   - Transfer document hash
5. Click **"Approve Transfer"**
6. Approve MetaMask transaction
7. Wait for confirmation: ✅ Transfer approved
8. **Check message:** "Transfer fee of 0.0020 ETH has been transferred to your wallet"

### What Happened:
- Transfer request approved
- 0.002 ETH sent to government officer's wallet
- Transfer is now ready to be completed
- Officer's balance increased by 0.002 ETH

---

## Step 8: Complete Transfer (Either Alice or Bob)

**Option A: Complete as Alice (Sender)**
1. Switch to Alice's account in MetaMask
2. You need to call `completeTransfer` function directly

**Option B: Complete as Bob (Receiver)** - More common
1. Switch to Bob's account in MetaMask
2. Call `completeTransfer` function

### Using Browser Console to Complete Transfer:

Since we don't have a UI for completing transfers yet, use the browser console:

1. **Open browser console** (F12 → Console tab)
2. **Paste and run this code:**

```javascript
// Complete the transfer
(async () => {
  const { ethers } = require('ethers');
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  // Contract ABI (only the functions we need)
  const abi = [
    "function completeTransfer(uint256 _requestId) external"
  ];
  
  // Get contract address from .env
  const contractAddress = process.env.NEXT_PUBLIC_LAND_REGISTRY_ADDRESS;
  const contract = new ethers.Contract(contractAddress, abi, signer);
  
  // Complete transfer for request ID 1
  const requestId = 1; // Use the actual request ID
  const tx = await contract.completeTransfer(requestId);
  console.log('Transaction submitted:', tx.hash);
  
  const receipt = await tx.wait();
  console.log('Transfer completed!', receipt);
})();
```

**Or create a quick page for this (recommended):**

---

## Alternative: Create Complete Transfer Page

Let me create a simple page for completing transfers:

1. Create `pages/complete-transfer.tsx` with a form to enter request ID
2. Call `contract.completeTransfer(requestId)`
3. This makes testing easier

Would you like me to create this page?

---

## Verification Steps

### After Transfer Completes:

1. **Check Alice's Properties:**
   - Switch to Alice's account
   - Go to "My Properties"
   - Property #1 should be GONE (transferred out)

2. **Check Bob's Properties:**
   - Switch to Bob's account
   - Go to "My Properties"
   - Property #1 should now appear in Bob's list
   - Current Owner: Bob's address

3. **Check Blockchain:**
   - Property #1 ownership transferred
   - lastTransferDate updated
   - Transfer request marked as completed

---

## Quick Test Summary

```bash
# 1. Setup (one time)
ganache -d -a 10 -e 1000 -p 8545 -i 1337
npm run compile && npm run deploy && npm run register-officers
npm run dev

# 2. In MetaMask:
- Import Account 1 (Alice): 0x6cbed15c...
- Import Account 2 (Bob): 0x6370fd03...

# 3. As Alice:
- Register as Owner
- Register Property
- Wait for verification (do step 4)
- Create Transfer Request to Bob's address

# 4. As Government Officer:
- Login to government portal
- Verify Alice's property (get 0.001 ETH)
- Approve transfer (get 0.002 ETH)

# 5. As Bob (or Alice):
- Complete the transfer
- Check property now belongs to Bob
```

---

## Troubleshooting

### "Receiver must be registered"
- Bob needs to register as owner FIRST
- Check Bob registered: Go to search page, search by Bob's address

### "Property must be verified first"
- Government officer must verify property
- Check property status in "My Properties"

### "Insufficient transfer fee"
- Ensure you're sending 0.002 ETH
- Check Alice has enough ETH

### "Request already completed"
- Transfer already done
- Check in Bob's "My Properties"

### Transaction failed
- Check Ganache is still running
- Check MetaMask is on Ganache Local network
- Check gas limit is sufficient

---

## Expected Balances After Full Test

```
Alice (Account 1):
- Started: 1000 ETH
- After owner registration: ~999.999 ETH (gas)
- After property registration: ~999.998 ETH (gas)
- After transfer request: ~999.996 ETH (0.002 ETH fee + gas)
- Final: ~999.996 ETH

Bob (Account 2):
- Started: 1000 ETH
- After owner registration: ~999.999 ETH (gas)
- After transfer completion: ~999.998 ETH (gas)
- Final: ~999.998 ETH + Property #1

Government Officer (Account 5):
- Started: ~999.97 ETH (after deployment)
- After property verification: ~999.971 ETH (+0.001 ETH)
- After transfer approval: ~999.973 ETH (+0.002 ETH)
- Final: ~999.973 ETH
```

---

## Next Steps

After successful test, you can:
1. Create multiple properties and transfer them
2. Test with different government officers (GVT002, GVT003, GVT004)
3. Test properties in different states/districts
4. Add a UI page for completing transfers
5. Add transfer history view

---

## Need Help?

If something doesn't work:
1. Check browser console for errors
2. Check Ganache terminal for transaction logs
3. Verify MetaMask is on correct network (Chain ID: 1337)
4. Ensure all accounts have sufficient ETH
5. Check contract is deployed correctly
