# Troubleshooting Guide - Property Registration Issues

## Common Issues and Solutions

### Issue 1: "Transaction failed" when verifying properties
**Symptoms:** Error message says "The verification request may have already been processed"

**Causes:**
1. The verification request was already approved/rejected
2. The property was already verified
3. Blockchain state was reset (Ganache restarted)

**Solutions:**
1. **Refresh the page** - The pending requests list might be stale
2. **Check if Ganache was restarted** - If yes, you need to:
   - Redeploy the contract: `npx hardhat run scripts/deploy.ts --network localhost`
   - Update the contract address in `.env.local`
   - Clear browser localStorage (F12 > Application > Local Storage > Clear)
   - Re-register owners and properties

### Issue 2: Property registration fails
**Symptoms:** Cannot register new properties, transaction reverts

**Causes:**
1. Contract not deployed or wrong address
2. Owner not registered first
3. Insufficient funds in MetaMask account
4. Ganache not running

**Solutions:**

#### Step 1: Check Ganache is Running
```bash
# Make sure Ganache is running on port 8545
# You should see it in Ganache GUI or terminal
```

#### Step 2: Verify Contract is Deployed
```bash
# In terminal:
npx hardhat run scripts/deploy.ts --network localhost

# Note the contract address that gets printed
```

#### Step 3: Update Environment Variables
Create/update `.env.local` file:
```
NEXT_PUBLIC_LAND_REGISTRY_ADDRESS=<your_contract_address_from_step_2>
NEXT_PUBLIC_GANACHE_URL=http://127.0.0.1:8545
```

#### Step 4: Restart Next.js Development Server
```bash
# Stop the server (Ctrl+C) and restart:
npm run dev
```

#### Step 5: Configure MetaMask
1. Open MetaMask
2. Add Localhost network if not present:
   - Network Name: Localhost 8545
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 1337
   - Currency Symbol: ETH
3. Import Ganache accounts:
   - Copy private key from Ganache
   - MetaMask > Import Account > Paste Private Key

#### Step 6: Clear Browser Storage
1. Open Browser DevTools (F12)
2. Go to Application tab
3. Clear all:
   - Local Storage
   - Session Storage
   - Cookies
4. Refresh the page

#### Step 7: Register as Owner First
1. Go to "Register as Owner" page
2. Fill all details
3. Submit registration
4. Wait for transaction confirmation

#### Step 8: Try Registering Property Again
1. Go to "Register Property" page
2. Fill all required fields
3. **Upload a property document** (Required!)
4. Submit registration

### Issue 3: "Property has been deleted" errors
**Symptoms:** Cannot verify or view properties, gets deleted message

**Causes:**
1. Browser localStorage has stale deletion records
2. Blockchain state doesn't match localStorage

**Solution:**
Clear localStorage for deleted properties:
```javascript
// Open browser console (F12) and run:
localStorage.removeItem('deleted_properties');
// Then refresh the page
```

### Issue 4: Files/Documents not showing in Government Portal
**Symptoms:** Government officers can't see uploaded documents/photos

**Causes:**
1. Files not properly stored in localStorage
2. DocumentHash mismatch

**Solutions:**
1. Make sure to upload documents when registering property
2. Check browser localStorage size (shouldn't exceed 5-10MB)
3. If localStorage is full, clear it:
```javascript
// In browser console:
localStorage.clear();
// Then re-register everything
```

### Issue 5: Wrong property count or missing properties
**Symptoms:** Property count doesn't match or properties not showing

**Causes:**
1. Contract was redeployed (new address)
2. Blockchain was reset
3. Filter issues (state/district mismatch)

**Solutions:**
1. Verify you're on the correct network (Localhost 8545)
2. Check contract address matches in `.env.local`
3. Try different state/district filters
4. Check browser console for errors (F12)

---

## Complete Fresh Start Procedure

If nothing works, follow these steps for a complete reset:

### 1. Stop Everything
```bash
# Stop Next.js dev server (Ctrl+C)
# Close Ganache (if running)
```

### 2. Clean Project
```bash
# Delete compiled artifacts
rm -rf artifacts
rm -rf cache
rm -rf typechain-types

# Reinstall if needed
npm install
```

### 3. Restart Ganache
- Open Ganache
- Create new workspace or use existing
- Make sure it's running on port 8545
- Note down account addresses and private keys

### 4. Compile and Deploy Contract
```bash
# Compile
npx hardhat compile

# Deploy to localhost
npx hardhat run scripts/deploy.ts --network localhost

# Copy the contract address printed in console
```

### 5. Update Environment
```bash
# Edit .env.local
NEXT_PUBLIC_LAND_REGISTRY_ADDRESS=<paste_address_here>
NEXT_PUBLIC_GANACHE_URL=http://127.0.0.1:8545
```

### 6. Clear Browser Data
- Open DevTools (F12)
- Application > Storage > Clear All
- Close and reopen browser

### 7. Configure MetaMask
- Add Localhost 8545 network
- Import at least 2-3 Ganache accounts
- Switch to Localhost network

### 8. Start Development Server
```bash
npm run dev
```

### 9. Test the Flow
1. Register as Owner (use one MetaMask account)
2. Register a Property (same account)
3. Request Verification (same account, pay 0.001 ETH fee)
4. Login to Government Portal (use different browser/incognito)
   - Use credentials: GVT004 / admin123
   - Select: West Bengal / Kolkata
5. Verify the property (approve/reject)

---

## Debug Commands

### Check Contract on Blockchain
```bash
# In Hardhat console:
npx hardhat console --network localhost

# Then run:
const Contract = await ethers.getContractFactory("LandRegistry");
const contract = await Contract.attach("YOUR_CONTRACT_ADDRESS");
await contract.getTotalProperties();
await contract.getTotalVerificationRequests();
```

### Check Browser Console Logs
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Common errors:
   - "Contract not deployed" → Redeploy contract
   - "Invalid address" → Check .env.local
   - "User rejected" → Approve in MetaMask
   - "Insufficient funds" → Get more ETH from Ganache

### Network Issues
```bash
# Test if Ganache is accessible:
curl http://127.0.0.1:8545

# Should return JSON response
```

---

## Prevention Tips

1. **Don't restart Ganache** while testing - all data will be lost
2. **Keep contract address** safe after deployment
3. **Use git** to track .env.local file (add to .gitignore though)
4. **Backup** working contract address and deployment receipt
5. **Test with small amounts** first (0.001 ETH for verification)
6. **Use different accounts** for owner and government officer testing

---

## Still Having Issues?

1. Check all error messages in browser console (F12)
2. Check MetaMask for rejected/pending transactions
3. Verify Ganache shows recent transactions
4. Make sure you have sufficient ETH in account
5. Try with a fresh Ganache account
6. Check that all environment variables are set correctly

## Quick Health Check Script

Open browser console and run:
```javascript
// Check localStorage
console.log('Deleted Properties:', localStorage.getItem('deleted_properties'));
console.log('LocalStorage Size:', new Blob(Object.values(localStorage)).size);

// Check MetaMask
console.log('Connected:', window.ethereum?.isConnected());
console.log('Chain ID:', window.ethereum?.chainId);

// Check environment
console.log('Contract Address:', process.env.NEXT_PUBLIC_LAND_REGISTRY_ADDRESS);
```

Expected outputs:
- Deleted Properties: Should be empty array `[]` or null
- LocalStorage Size: Should be reasonable (< 5MB)
- Connected: Should be `true`
- Chain ID: Should be `0x539` (1337 in hex)
- Contract Address: Should show actual address, not empty

---

## Contact/Help
If issues persist after trying all solutions:
1. Check Ganache logs for transaction errors
2. Look at Hardhat/contract errors during deployment
3. Verify all dependencies are installed (`npm install`)
4. Try with a different browser to rule out cache issues
