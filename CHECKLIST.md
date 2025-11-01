# 📋 Setup Checklist

Use this checklist to ensure everything is properly configured.

## ✅ Pre-Installation Checklist

- [ ] Node.js v18 or higher installed
- [ ] npm or yarn package manager available
- [ ] MetaMask browser extension installed
- [ ] Code editor installed (VS Code recommended)
- [ ] Git installed (optional, for version control)

## ✅ Installation Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Environment file created (`.env` from `.env.example`)
- [ ] Ganache CLI installed globally (`npm install -g ganache`)
- [ ] Contracts compiled successfully (`npm run compile`)
- [ ] Tests pass (`npm test`)

## ✅ Blockchain Setup Checklist

- [ ] Ganache running on port 8545
- [ ] Chain ID set to 1337
- [ ] At least one account with balance visible
- [ ] Private key copied for MetaMask import

## ✅ Smart Contract Checklist

- [ ] LandRegistry.sol compiled without errors
- [ ] Contract deployed successfully
- [ ] Contract address saved in `.env`
- [ ] Deployment info in `deployment.json`
- [ ] All test cases passing

## ✅ MetaMask Configuration Checklist

- [ ] MetaMask extension installed and unlocked
- [ ] Local network added with correct settings:
  - [ ] Network Name: `Ganache Local` or similar
  - [ ] RPC URL: `http://127.0.0.1:8545`
  - [ ] Chain ID: `1337`
  - [ ] Currency Symbol: `ETH`
- [ ] Account imported from Ganache
- [ ] Account has ETH balance visible
- [ ] Connected to local network

## ✅ Frontend Setup Checklist

- [ ] Next.js dependencies installed
- [ ] Tailwind CSS configured
- [ ] TypeScript compiling without errors
- [ ] Development server starts (`npm run dev`)
- [ ] Homepage loads at http://localhost:3000
- [ ] No console errors in browser

## ✅ Contract Integration Checklist

- [ ] Contract address in `.env` matches deployed address
- [ ] Contract ABI accessible in utils
- [ ] MetaMask connects to application
- [ ] Account address displays correctly
- [ ] Network information shows correctly

## ✅ Functionality Testing Checklist

### Owner Registration
- [ ] Can access register-owner page
- [ ] Form accepts input
- [ ] MetaMask prompts for transaction
- [ ] Transaction confirms successfully
- [ ] Success message displays

### Property Registration
- [ ] Can access property registration
- [ ] All fields accept input
- [ ] Transaction processes
- [ ] Property ID returned

### Verification (if testing as verifier)
- [ ] Can verify owners
- [ ] Can verify properties
- [ ] Events emit correctly

### Transfer Workflow
- [ ] Can create transfer request
- [ ] Verifier can approve
- [ ] Transfer completes successfully
- [ ] Ownership updates correctly

## ✅ Documentation Review Checklist

- [ ] Read README.md
- [ ] Reviewed QUICKSTART.md
- [ ] Checked SCRIPTS.md for commands
- [ ] Understood PROJECT_STRUCTURE.md

## ✅ Development Environment Checklist

- [ ] VS Code (or preferred IDE) configured
- [ ] Solidity extension installed (if using VS Code)
- [ ] ESLint working
- [ ] TypeScript IntelliSense working
- [ ] Terminal accessible

## ✅ Production Readiness Checklist

If deploying to testnet/mainnet:
- [ ] `.env` has testnet RPC URL
- [ ] Private key secured (never commit!)
- [ ] Sufficient test ETH in wallet
- [ ] Contract verified on Etherscan
- [ ] Frontend deployed (Vercel/Netlify)
- [ ] Domain configured
- [ ] SSL certificate active

## ✅ Security Checklist

- [ ] `.env` file in `.gitignore`
- [ ] Private keys never exposed
- [ ] Contract audited (for production)
- [ ] Access controls tested
- [ ] Reentrancy protection verified
- [ ] Input validation working

## 🎯 Ready to Use!

If all items are checked, your system is ready! 🚀

## 🐛 Troubleshooting

If any item is unchecked:

1. **Dependencies issues**: Delete `node_modules`, run `npm install`
2. **Compilation errors**: Run `npm run clean` then `npm run compile`
3. **Network issues**: Restart Ganache with correct parameters
4. **MetaMask issues**: Reset account or reimport
5. **Frontend issues**: Clear Next.js cache: `rm -rf .next`

## 📞 Getting Help

If stuck on any item:
- Check the error message carefully
- Review relevant documentation section
- Verify all previous steps completed
- Check browser console for errors
- Ensure correct network in MetaMask

---

**Complete this checklist to ensure a smooth setup! ✨**
