# Project Setup and Management Scripts

## macOS/Linux Commands

### Initial Setup
```bash
# Install all dependencies
npm install

# Install Ganache CLI globally
npm install -g ganache
```

### Blockchain Setup

#### Start Ganache (Local Blockchain)
```bash
# Basic setup with deterministic accounts
ganache -d -a 10 -e 1000 -p 8545 -i 1337

# Alternative: More verbose setup
ganache --deterministic --accounts 10 --defaultBalanceEther 1000 --port 8545 --networkId 1337
```

#### Alternative: Hardhat Network
```bash
# Start Hardhat local blockchain
npm run node
```

### Smart Contract Operations

```bash
# Compile contracts
npm run compile

# Run all tests
npm test

# Run tests with gas reporting
npx hardhat test

# Run tests with coverage
npx hardhat coverage

# Deploy to Ganache
npm run deploy

# Deploy to localhost
npm run deploy:localhost

# Clean artifacts and cache
npm run clean
```

### Frontend Operations

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env file (use your preferred editor)
nano .env
# or
code .env
```

### Troubleshooting

#### Kill Process on Port 8545
```bash
# Find and kill process using port 8545
lsof -ti:8545 | xargs kill -9

# Alternative method
pkill -f ganache
```

#### Kill Process on Port 3000 (Next.js)
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

#### Reset Everything
```bash
# Clean all build artifacts
npm run clean

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Recompile contracts
npm run compile
```

### Testing Specific Scenarios

```bash
# Test only deployment
npx hardhat test --grep "Deployment"

# Test only owner registration
npx hardhat test --grep "Owner Registration"

# Test only property transfer
npx hardhat test --grep "Property Transfer"
```

### View Contract Information

```bash
# Get contract size
npx hardhat size-contracts

# View compiled contract details (macOS)
cat artifacts/contracts/LandRegistry.sol/LandRegistry.json | jq .
```

### Quick Development Workflow

```bash
# Terminal 1: Start blockchain
ganache -d -a 10 -e 1000 -p 8545 -i 1337

# Terminal 2: Compile and deploy
npm run compile && npm run deploy

# Terminal 3: Start frontend
npm run dev
```

---

## Complete Development Setup Script

Save this as `setup.sh` and run with bash:

```bash
#!/bin/bash
# Blockchain Land Registry Setup Script

echo "🏠 Setting up Blockchain Land Registry..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
echo "📝 Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "⚠️  .env file already exists"
fi

# Compile contracts
echo "🔨 Compiling smart contracts..."
npm run compile

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start Ganache:     ganache -d -a 10 -e 1000 -p 8545 -i 1337"
echo "2. Deploy contracts:  npm run deploy"
echo "3. Start frontend:    npm run dev"
echo "4. Configure MetaMask (see QUICKSTART.md)"
```

Run it with:
```bash
chmod +x setup.sh
./setup.sh
```

---

## Windows PowerShell Commands

### Initial Setup
```powershell
# Install all dependencies
npm install

# Install Ganache CLI globally
npm install -g ganache
```

### Blockchain Setup

#### Start Ganache (Local Blockchain)
```powershell
# Basic setup
ganache --port 8545 --chain.networkId 1337 --chain.chainId 1337

# With more accounts and balance
ganache --port 8545 --chain.networkId 1337 --chain.chainId 1337 --wallet.accounts 10 --wallet.defaultBalance 1000

# With deterministic accounts (same addresses each time)
ganache --port 8545 --chain.networkId 1337 --chain.chainId 1337 --wallet.deterministic
```

#### Alternative: Hardhat Network
```powershell
# Start Hardhat local blockchain
npm run node
```

### Smart Contract Operations

```powershell
# Compile contracts
npm run compile

# Run all tests
npm test

# Run tests with gas reporting
npx hardhat test

# Run tests with coverage
npx hardhat coverage

# Deploy to Ganache
npm run deploy

# Deploy to localhost
npm run deploy:localhost

# Clean artifacts and cache
npm run clean
```

### Frontend Operations

```powershell
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

### Environment Setup

```powershell
# Copy environment template
cp .env.example .env

# Edit .env file (use your preferred editor)
notepad .env
```

### Troubleshooting

#### Kill Process on Port 8545
```powershell
# Find process using port 8545
netstat -ano | findstr :8545

# Kill the process (replace <PID> with actual process ID)
taskkill /PID <PID> /F
```

#### Kill Process on Port 3000 (Next.js)
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

#### Reset Everything
```powershell
# Clean all build artifacts
npm run clean

# Remove node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install

# Recompile contracts
npm run compile
```

### Testing Specific Scenarios

```powershell
# Test only deployment
npx hardhat test --grep "Deployment"

# Test only owner registration
npx hardhat test --grep "Owner Registration"

# Test only property transfer
npx hardhat test --grep "Property Transfer"
```

### View Contract Information

```powershell
# Get contract size
npx hardhat size-contracts

# View compiled contract details
Get-Content artifacts/contracts/LandRegistry.sol/LandRegistry.json | ConvertFrom-Json
```

### Quick Development Workflow

```powershell
# Terminal 1: Start blockchain
ganache --port 8545 --chain.networkId 1337 --chain.chainId 1337

# Terminal 2: Compile and deploy
npm run compile; npm run deploy

# Terminal 3: Start frontend
npm run dev
```

---

## Complete Development Setup Script

Save this as `setup.ps1` and run with PowerShell:

```powershell
# Blockchain Land Registry Setup Script

Write-Host "🏠 Setting up Blockchain Land Registry..." -ForegroundColor Green

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Copy environment file
Write-Host "📝 Setting up environment..." -ForegroundColor Yellow
if (!(Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "✅ .env file created" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env file already exists" -ForegroundColor Yellow
}

# Compile contracts
Write-Host "🔨 Compiling smart contracts..." -ForegroundColor Yellow
npm run compile

Write-Host @"

✅ Setup complete!

Next steps:
1. Start Ganache:     ganache --port 8545 --networkId 1337 --chainId 1337
2. Deploy contracts:  npm run deploy
3. Start frontend:    npm run dev
4. Configure MetaMask (see QUICKSTART.md)

"@ -ForegroundColor Green
```

Run it with:
```powershell
powershell -ExecutionPolicy Bypass -File setup.ps1
```
