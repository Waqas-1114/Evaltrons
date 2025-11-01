import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("Starting deployment of LandRegistry contract...");

  // Get the contract factory
  const LandRegistry = await ethers.getContractFactory("LandRegistry");
  
  // Deploy the contract
  console.log("Deploying LandRegistry...");
  const landRegistry = await LandRegistry.deploy();
  
  await landRegistry.waitForDeployment();
  
  const contractAddress = await landRegistry.getAddress();
  console.log(`LandRegistry deployed to: ${contractAddress}`);
  
  // Get deployer information
  const [deployer] = await ethers.getSigners();
  console.log(`Deployed by: ${deployer.address}`);
  console.log(`Deployer balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  
  // Save contract address to a file for frontend
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployedAt: new Date().toISOString(),
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployer: deployer.address
  };
  
  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment info saved to: ${deploymentPath}`);
  
  // Update .env file with contract address
  const envPath = path.join(__dirname, "..", ".env");
  let envContent = "";
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
    // Update or add the contract address
    if (envContent.includes("NEXT_PUBLIC_LAND_REGISTRY_ADDRESS=")) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_LAND_REGISTRY_ADDRESS=.*/,
        `NEXT_PUBLIC_LAND_REGISTRY_ADDRESS=${contractAddress}`
      );
    } else {
      envContent += `\nNEXT_PUBLIC_LAND_REGISTRY_ADDRESS=${contractAddress}\n`;
    }
  } else {
    // Create new .env from .env.example
    const envExamplePath = path.join(__dirname, "..", ".env.example");
    if (fs.existsSync(envExamplePath)) {
      envContent = fs.readFileSync(envExamplePath, "utf8");
      envContent = envContent.replace(
        /NEXT_PUBLIC_LAND_REGISTRY_ADDRESS=.*/,
        `NEXT_PUBLIC_LAND_REGISTRY_ADDRESS=${contractAddress}`
      );
    }
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log("Contract address saved to .env file");
  
  console.log("\n✅ Deployment completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Update your .env file with the contract address (already done)");
  console.log("2. Run 'npm run dev' to start the Next.js frontend");
  console.log("3. Connect MetaMask to your local network (Ganache)");
  console.log("4. Import an account from Ganache to MetaMask");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
