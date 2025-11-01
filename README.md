# 🏠 Blockchain-Based Land and Property Record Management System

A comprehensive blockchain-driven property registration system to digitize land records, ensure tamper-proof ownership history, transparent property transfer, and public access to verified documents. This solution aims to reduce corruption and disputes in land management.

## 📋 Project Description

This system leverages blockchain technology to create an immutable, transparent, and secure platform for managing land and property records. Built on Ethereum, it provides:

- **Tamper-Proof Records**: All property records are stored on the blockchain, making them immutable and secure
- **Transparent Ownership History**: Complete transfer history is publicly accessible and verifiable
- **Verified Documents**: Government officials can verify property documents before transfers
- **Reduced Corruption**: Eliminates intermediaries and reduces opportunities for fraud
- **Public Access**: Anyone can verify property ownership instantly
- **Smart Contracts**: Automated processes ensure reliability and transparency

## 🛠️ Technology Stack

### Blockchain & Smart Contracts
- **Solidity ^0.8.20** - Smart contract development
- **Hardhat** - Ethereum development environment
- **OpenZeppelin Contracts** - Secure smart contract library
- **Ethers.js v6** - Ethereum wallet implementation and contract interaction
- **Ganache CLI** - Local blockchain for development and testing

### Frontend
- **Next.js 14** - React framework for production
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React 18** - UI library

### Testing & Development
- **Chai** - Assertion library for testing
- **Hardhat Network Helpers** - Testing utilities
- **TypeChain** - TypeScript bindings for smart contracts

## 📁 Project Structure

```
blockchain-land-registry/
├── contracts/              # Solidity smart contracts
│   └── LandRegistry.sol   # Main land registry contract
├── scripts/               # Deployment scripts
│   └── deploy.ts         # Contract deployment script
├── test/                 # Contract tests
│   └── LandRegistry.test.ts
├── pages/                # Next.js pages
│   ├── index.tsx        # Homepage
│   ├── register-owner.tsx
│   ├── _app.tsx
│   └── _document.tsx
├── utils/                # Utility functions
│   └── contract.ts      # Contract interaction helpers
├── styles/               # CSS styles
│   └── globals.css
├── hardhat.config.ts    # Hardhat configuration
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── next.config.js       # Next.js configuration
├── package.json         # Dependencies
└── .env.example         # Environment variables template
```

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MetaMask** browser extension
- **Ganache CLI** (optional, for local blockchain)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd evaltrons
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   ```env
   NEXT_PUBLIC_GANACHE_URL=http://127.0.0.1:8545
   NEXT_PUBLIC_CHAIN_ID=1337
   PRIVATE_KEY=your_private_key_for_deployment
   ```

### 🔧 Development Setup

#### Option 1: Using Ganache CLI (Recommended for Development)

1. **Install Ganache CLI globally**
   ```bash
   npm install -g ganache
   ```

2. **Start Ganache**
   ```bash
   ganache --port 8545 --chain.networkId 1337 --chain.chainId 1337
   ```
   
   Or with specific accounts:
   ```bash
   ganache --port 8545 --chain.networkId 1337 --chain.chainId 1337 --wallet.accounts 10 --wallet.defaultBalance 100
   ```

3. **Copy a private key from Ganache output** and add it to your `.env` file

#### Option 2: Using Hardhat Network

1. **Start Hardhat local node**
   ```bash
   npm run node
   ```

2. **Use the displayed accounts** for testing

### 📦 Compile Smart Contracts

```bash
npm run compile
```

This will:
- Compile Solidity contracts
- Generate TypeChain types
- Create artifacts in `artifacts/` directory

### 🧪 Run Tests

```bash
npm test
```

Run tests with coverage:
```bash
npx hardhat coverage
```

### 🚀 Deploy Smart Contracts

#### Deploy to Ganache

```bash
npm run deploy
```

#### Deploy to Hardhat Network

```bash
npm run deploy:localhost
```

After deployment:
- Contract address will be saved to `.env` automatically
- Deployment info will be saved in `deployment.json`

### 🌐 Start Frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 🦊 Configure MetaMask

1. **Add Local Network to MetaMask**
   - Network Name: `Ganache Local` or `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `1337` (Ganache) or `31337` (Hardhat)
   - Currency Symbol: `ETH`

2. **Import Account**
   - Copy a private key from Ganache or Hardhat
   - Import it into MetaMask
   - Switch to the local network

## 📖 Smart Contract Features

### LandRegistry Contract

#### Owner Management
- `registerOwner()` - Register as a property owner
- `verifyOwner()` - Verify owner identity (verifiers only)
- `getOwnerDetails()` - View owner information

#### Property Management
- `registerProperty()` - Register a new property
- `verifyProperty()` - Verify property documents (verifiers only)
- `getPropertyDetails()` - View property information
- `getOwnerProperties()` - List all properties owned by an address
- `updatePropertyDocument()` - Update property document hash

#### Transfer Management
- `createTransferRequest()` - Initiate property transfer
- `approveTransferRequest()` - Approve transfer (verifiers only)
- `completeTransfer()` - Complete approved transfer
- `getTransferRequestDetails()` - View transfer request details
- `getPropertyTransferHistory()` - View complete transfer history

#### Verifier Management (Owner Only)
- `addVerifier()` - Add government verifier
- `removeVerifier()` - Remove verifier
- `verifiers()` - Check if address is a verifier

## 🎯 Usage Workflow

### For Property Owners

1. **Register as Owner**
   - Connect MetaMask
   - Navigate to "Register as Owner"
   - Fill in personal details
   - Submit transaction

2. **Register Property**
   - Go to "Register Property"
   - Enter property details
   - Upload document hash (IPFS recommended)
   - Submit transaction

3. **Transfer Property**
   - Select your property
   - Enter recipient address
   - Upload transfer documents
   - Create transfer request
   - Wait for verifier approval
   - Complete transfer

### For Government Verifiers

1. **Verify Owners**
   - Review owner documents
   - Call `verifyOwner()` with owner address

2. **Verify Properties**
   - Review property documents
   - Call `verifyProperty()` with property ID

3. **Approve Transfers**
   - Review transfer requests
   - Call `approveTransferRequest()` with request ID

### For Public Users

1. **Search Properties**
   - Enter property ID
   - View complete details
   - Check ownership history
   - Verify authenticity

## 🔐 Security Features

- **Access Control**: Role-based permissions (Owner, Verifier, User)
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Ownable**: Secure ownership management
- **Input Validation**: Comprehensive checks on all inputs
- **Event Logging**: All actions emit events for transparency
- **Immutable Records**: Blockchain-stored data cannot be altered

## 📜 Available Scripts

```bash
# Development
npm run dev          # Start Next.js development server
npm run build        # Build Next.js for production
npm run start        # Start production server

# Smart Contracts
npm run compile      # Compile Solidity contracts
npm run test         # Run contract tests
npm run deploy       # Deploy to Ganache
npm run deploy:localhost  # Deploy to Hardhat network
npm run node         # Start Hardhat local node
npm run clean        # Clean artifacts and cache

# Linting
npm run lint         # Run Next.js linter
```

## 🧪 Testing

The project includes comprehensive tests covering:

- Owner registration and verification
- Property registration and verification
- Transfer request creation and approval
- Property ownership transfers
- Verifier management
- Access control
- Edge cases and error handling

Run specific test file:
```bash
npx hardhat test test/LandRegistry.test.ts
```

## 🌍 Deployment to Testnets

### Sepolia Testnet

1. **Get Sepolia ETH**
   - Use a faucet like [Sepolia Faucet](https://sepoliafaucet.com/)

2. **Configure .env**
   ```env
   SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

3. **Deploy**
   ```bash
   npx hardhat run scripts/deploy.ts --network sepolia
   ```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **OpenZeppelin** - Secure smart contract libraries
- **Hardhat** - Ethereum development environment
- **Next.js** - React framework
- **Tailwind CSS** - CSS framework
- **Ethers.js** - Ethereum library

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Contact the development team

## 🔮 Future Enhancements

- [ ] IPFS integration for document storage
- [ ] Multi-signature approvals for high-value properties
- [ ] Property valuation tracking
- [ ] Integration with government databases
- [ ] Mobile application
- [ ] NFT representation of property ownership
- [ ] Rental management features
- [ ] Property dispute resolution system
- [ ] Analytics dashboard for government officials
- [ ] Multi-language support

---

**Built with ❤️ using Blockchain Technology to fight corruption and ensure transparent land management**
