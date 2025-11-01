# Project Setup and Management Scripts

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
