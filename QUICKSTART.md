# 🚀 Quick Start Guide

Get your Blockchain Land Registry up and running in 5 minutes!

## Prerequisites Checklist
- [ ] Node.js v18+ installed
- [ ] MetaMask browser extension installed
- [ ] Terminal/Command Prompt access

## Step-by-Step Setup

### 1️⃣ Install Dependencies (2 minutes)

```bash
npm install
```

### 2️⃣ Start Local Blockchain (1 minute)

**Option A: Ganache CLI** (Recommended)
```bash
# Install Ganache globally
npm install -g ganache

# Start Ganache
ganache --port 8545 --chain.networkId 1337 --chain.chainId 1337
```

**Option B: Hardhat Network**
```bash
npm run node
```

Keep this terminal window open!

### 3️⃣ Deploy Smart Contract (1 minute)

Open a **NEW terminal** window and run:

```bash
# Copy environment variables
cp .env.example .env

# Compile contracts
npm run compile

# Deploy to Ganache
npm run deploy
```

The contract address will be automatically saved to your `.env` file!

### 4️⃣ Configure MetaMask (1 minute)

1. **Open MetaMask** and click the network dropdown
2. **Add Network** with these settings:
   - Network Name: `Ganache Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `1337`
   - Currency Symbol: `ETH`

3. **Import Account**:
   - Copy any private key from your Ganache terminal
   - In MetaMask: Account Icon → Import Account
   - Paste the private key
   - Switch to the "Ganache Local" network

### 5️⃣ Start the Frontend (30 seconds)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 🎯 First Actions

1. **Connect MetaMask** - Click "Connect MetaMask" button
2. **Register as Owner** - Go to "Register as Owner" page
3. **Register a Property** - Add your first property
4. **Explore** - View properties, search, and transfer!

## 🐛 Troubleshooting

### "Contract not deployed" error
```bash
# Make sure Ganache is running, then:
npm run deploy
```

### "Wrong network" in MetaMask
- Switch to "Ganache Local" network (Chain ID: 1337)

### "Insufficient funds" error
- Import a Ganache account with balance into MetaMask

### Port 8545 already in use
```bash
# Kill the process on port 8545
# Windows PowerShell:
netstat -ano | findstr :8545
taskkill /PID <PID> /F

# Then restart Ganache
```

## 📚 Next Steps

- Read the full [README.md](./README.md)
- Check out the [Smart Contract](./contracts/LandRegistry.sol)
- Run tests: `npm test`
- Explore the [Frontend Pages](./pages/)

## 🆘 Need Help?

- Check the [README.md](./README.md) for detailed documentation
- Review error messages in browser console
- Check MetaMask connection and network settings

---

**Happy Building! 🏗️🚀**
