# Complete Ganache Setup Guide

## 1. Install Ganache CLI

```bash
npm install -g ganache
```

## 2. Start Ganache with Deterministic Accounts

**Command to start Ganache:**
```bash
ganache -d -a 10 -e 1000 -p 8545 -i 1337
```

**Parameters explained:**
- `-d` or `--deterministic`: Always generates the same accounts/private keys
- `-a 10` or `--accounts 10`: Creates 10 accounts
- `-e 1000` or `--defaultBalanceEther 1000`: Each account gets 1000 ETH
- `-p 8545` or `--port 8545`: Runs on port 8545
- `-i 1337` or `--networkId 1337`: Sets network ID to 1337

## 3. Generated Accounts & Private Keys

When you run Ganache with `-d` (deterministic), you'll always get these same accounts:

```
Available Accounts
==================
(0) 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1 (1000 ETH)
(1) 0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0 (1000 ETH)
(2) 0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b (1000 ETH)
(3) 0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d (1000 ETH)
(4) 0xd03ea8624C8C5987235048901fB614fDcA89b117 (1000 ETH)
(5) 0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC (1000 ETH)
(6) 0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9 (1000 ETH)
(7) 0x28a8746e75304c0780E011BEd21C72cD78cd535E (1000 ETH)
(8) 0xACa94ef8bD5ffEE41947b4585a84BdA5a3d3DA6E (1000 ETH)
(9) 0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e (1000 ETH)

Private Keys
==================
(0) 0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
(1) 0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1
(2) 0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c
(3) 0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913
(4) 0xadd53f9a7e588d003326d1cbf9e4a43c061aadd9bc938c843a79e7b4fd2ad743
(5) 0x395df67f0c2d2d9fe1ad08d1bc8b6627011959b79c53d7dd6a3536a33ab8a4fd
(6) 0xe485d098507f54e7733a205420dfddbe58db035fa577fc294ebd14db90767a52
(7) 0xa453611d9419d0e56f499079478fd72c37b251a94bfde4d19872c44cf65386e3
(8) 0x829e924fdf021ba3dbbc4225edfece9aca04b929d6e75613329ca6f1d31c0bb4
(9) 0xb0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773
```

## 4. Configure .env File

Create or update your `.env` file with:

```env
# Blockchain Network Configuration
NEXT_PUBLIC_GANACHE_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=1337

# Contract Addresses (will be filled after deployment)
NEXT_PUBLIC_LAND_REGISTRY_ADDRESS=

# Private Key for Deployment (Account 0 from Ganache)
PRIVATE_KEY=0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
```

## 5. Deploy Contract to Generate Land Registry Address

```bash
# Compile contracts
npm run compile

# Deploy to Ganache
npm run deploy
```

**This will:**
- Deploy the LandRegistry contract
- Generate a contract address (e.g., `0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab`)
- Automatically update your `.env` file with `NEXT_PUBLIC_LAND_REGISTRY_ADDRESS`
- Save deployment info to `deployment.json`

## 6. MetaMask Configuration

### Add Ganache Network to MetaMask:
1. Open MetaMask
2. Click Networks dropdown
3. Click "Add Network"
4. Fill in:
   - **Network Name:** Ganache Local
   - **RPC URL:** http://127.0.0.1:8545
   - **Chain ID:** 1337
   - **Currency Symbol:** ETH
   - **Block Explorer URL:** http://127.0.0.1:8545 (Optional - for local transactions)

### Import Ganache Accounts:
1. Click MetaMask account icon
2. Click "Import Account"
3. Select "Private Key"
4. Paste any private key from Ganache (e.g., account 1: `0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1`)

## 7. Complete Development Workflow

```bash
# Terminal 1: Start Ganache
ganache -d -a 10 -e 1000 -p 8545 -i 1337

# Terminal 2: Deploy contracts
npm run compile && npm run deploy

# Terminal 3: Start frontend
npm run dev
```

## 8. Block Explorer Options

### Option 1: Ganache Built-in Explorer
- Ganache provides basic transaction information via RPC calls
- View transactions: `curl -X POST --data '{"jsonrpc":"2.0","method":"eth_getTransactionByHash","params":["0x..."],"id":1}' http://127.0.0.1:8545`

### Option 2: Local Block Explorer (Blockscout)
For a full block explorer experience, you can run Blockscout locally:

```bash
# Clone Blockscout
git clone https://github.com/blockscout/blockscout
cd blockscout

# Configure for Ganache
export ETHEREUM_JSONRPC_VARIANT=ganache
export ETHEREUM_JSONRPC_HTTP_URL=http://127.0.0.1:8545
export DATABASE_URL=postgresql://postgres:@localhost:5432/blockscout

# Run Blockscout (requires PostgreSQL)
mix deps.get
mix ecto.create && mix ecto.migrate
mix phx.server
```
Then access at: http://localhost:4000

### Option 3: Simple Transaction Viewer
You can also create a simple web interface to view transactions using ethers.js in your frontend.

## 9. Key Files Generated

- **`.env`** - Contains all environment variables
- **`deployment.json`** - Contains deployment details
- **`artifacts/`** - Compiled contract artifacts
- **`typechain-types/`** - TypeScript types for contracts

## 10. Important Notes

⚠️ **Security Warning:** 
- These private keys are well-known test keys
- **NEVER use them on mainnet or with real ETH**
- Only for local development

✅ **Benefits of Deterministic Mode:**
- Same accounts every time you restart Ganache
- Consistent private keys for development
- No need to reconfigure MetaMask accounts
- Easier team development setup

## 11. Troubleshooting

### If deployment fails with "insufficient funds":
```bash
# Check if Ganache is running
curl http://127.0.0.1:8545

# Restart Ganache with more ETH
ganache -d -a 10 -e 5000 -p 8545 -i 1337
```

### If network ID mismatch:
- Ensure Ganache uses `-i 1337`
- Check `.env` has `NEXT_PUBLIC_CHAIN_ID=1337`
- Verify MetaMask network has Chain ID 1337

### Reset everything:
```bash
# Kill Ganache
pkill -f ganache

# Clean project
npm run clean
rm -rf node_modules package-lock.json
npm install

# Restart Ganache and redeploy
ganache -d -a 10 -e 1000 -p 8545 -i 1337
npm run compile && npm run deploy
```
