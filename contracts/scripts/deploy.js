const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying EscrowContract...");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    const EscrowContract = await ethers.getContractFactory("EscrowContract");
    const escrow = await EscrowContract.deploy();

    await escrow.waitForDeployment();

    const address = await escrow.getAddress();
    console.log("EscrowContract deployed to:", address);

    console.log("\n🎉 Deployment successful!");
    console.log("\nNext steps:");
    console.log("1. Update .env file with CONTRACT_ADDRESS:", address);
    console.log("2. Verify contract on Etherscan (if desired):");
    console.log(`   npx hardhat verify --network sepolia ${address}`);
    console.log("3. Update backend and frontend configuration with the contract address");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
