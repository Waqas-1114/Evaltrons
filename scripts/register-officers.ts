import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("Starting registration of government officers...");

    // Read deployment info to get contract address
    const deploymentPath = path.join(__dirname, "..", "deployment.json");
    if (!fs.existsSync(deploymentPath)) {
        throw new Error("Deployment file not found. Please deploy the contract first.");
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const contractAddress = deploymentInfo.contractAddress;

    console.log(`Contract address: ${contractAddress}`);

    // Get the contract
    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    const landRegistry = LandRegistry.attach(contractAddress);

    // Get the deployer (contract owner)
    const [deployer] = await ethers.getSigners();
    console.log(`Registering officers with account: ${deployer.address}`);

    // Government officers data (matching frontend)
    const officers = [
        {
            employeeId: 'GVT001',
            name: 'Rajesh Kumar',
            department: 'Land Revenue',
            state: 'Maharashtra',
            district: 'Mumbai'
        },
        {
            employeeId: 'GVT002',
            name: 'Priya Sharma',
            department: 'Registration',
            state: 'Delhi',
            district: 'Central Delhi'
        },
        {
            employeeId: 'GVT003',
            name: 'Amit Singh',
            department: 'Revenue',
            state: 'Uttar Pradesh',
            district: 'Lucknow'
        },
        {
            employeeId: 'GVT004',
            name: 'Sanjay Mukherjee',
            department: 'Land Records',
            state: 'West Bengal',
            district: 'Kolkata'
        }
    ];

    console.log(`\nRegistering ${officers.length} government officers...\n`);

    for (const officer of officers) {
        try {
            console.log(`Registering ${officer.employeeId} - ${officer.name}...`);

            const tx = await landRegistry.registerGovernmentOfficer(
                officer.employeeId,
                officer.name,
                officer.department,
                officer.state,
                officer.district
            );

            await tx.wait();
            console.log(`✅ ${officer.employeeId} registered successfully!`);
            console.log(`   Transaction hash: ${tx.hash}\n`);
        } catch (error: any) {
            if (error.message.includes("Officer already registered")) {
                console.log(`ℹ️  ${officer.employeeId} is already registered (skipping)\n`);
            } else {
                console.error(`❌ Error registering ${officer.employeeId}:`, error.message, "\n");
            }
        }
    }

    console.log("\n✅ Government officers registration completed!");
    console.log("\nRegistered Officers:");

    for (const officer of officers) {
        try {
            const details = await landRegistry.getGovernmentOfficerDetails(officer.employeeId);
            console.log(`\n${officer.employeeId}:`);
            console.log(`  Name: ${details.name}`);
            console.log(`  Department: ${details.department}`);
            console.log(`  Location: ${details.district}, ${details.state}`);
            console.log(`  Status: ${details.isActive ? '✅ Active' : '❌ Inactive'}`);
        } catch (error) {
            console.log(`\n${officer.employeeId}: Not found or error retrieving details`);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
