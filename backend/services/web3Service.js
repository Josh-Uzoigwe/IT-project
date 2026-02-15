const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

// Contract ABI and address
const contractArtifactPath = path.join(__dirname, '../../contracts/artifacts/contracts/EscrowContract.sol/EscrowContract.json');
let contractABI = [];

// Load ABI if file exists
if (fs.existsSync(contractArtifactPath)) {
    const contractArtifact = JSON.parse(fs.readFileSync(contractArtifactPath, 'utf8'));
    contractABI = contractArtifact.abi;
}

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;

// Initialize provider
const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);

// Get contract instance (read-only)
const getContract = () => {
    if (!CONTRACT_ADDRESS) {
        throw new Error('Contract address not configured');
    }
    return new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
};

// Get contract with signer (for transactions)
const getContractWithSigner = (privateKey) => {
    const wallet = new ethers.Wallet(privateKey, provider);
    return new ethers.Contract(CONTRACT_ADDRESS, contractABI, wallet);
};

/**
 * Create project on blockchain
 */
const createBlockchainProject = async (freelancerAddress, arbitratorAddress, milestoneAmounts, clientPrivateKey) => {
    try {
        const contract = getContractWithSigner(clientPrivateKey);

        // Convert amounts to Wei
        const amounts = milestoneAmounts.map(amount => ethers.parseEther(amount.toString()));

        const tx = await contract.createProject(freelancerAddress, arbitratorAddress, amounts);
        const receipt = await tx.wait();

        // Extract project ID from event
        const event = receipt.logs.find(log => {
            try {
                const parsed = contract.interface.parseLog(log);
                return parsed.name === 'ProjectCreated';
            } catch {
                return false;
            }
        });

        const parsed = contract.interface.parseLog(event);
        const projectId = parsed.args.projectId;

        return {
            success: true,
            projectId: Number(projectId),
            transactionHash: receipt.hash
        };
    } catch (error) {
        console.error('Blockchain project creation error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get project details from blockchain
 */
const getBlockchainProjectDetails = async (projectId) => {
    try {
        const contract = getContract();
        const details = await contract.getProjectDetails(projectId);

        return {
            client: details.client,
            freelancer: details.freelancer,
            arbitrator: details.arbitrator,
            totalBudget: ethers.formatEther(details.totalBudget),
            totalPaid: ethers.formatEther(details.totalPaid),
            milestoneCount: Number(details.milestoneCount),
            status: Number(details.status)
        };
    } catch (error) {
        console.error('Error fetching blockchain project:', error);
        throw error;
    }
};

/**
 * Get milestone details from blockchain
 */
const getBlockchainMilestoneDetails = async (projectId, milestoneId) => {
    try {
        const contract = getContract();
        const details = await contract.getMilestoneDetails(projectId, milestoneId);

        return {
            amount: ethers.formatEther(details.amount),
            status: Number(details.status)
        };
    } catch (error) {
        console.error('Error fetching blockchain milestone:', error);
        throw error;
    }
};

/**
 * Listen for ProjectFunded event
 */
const listenForProjectFunded = (callback) => {
    const contract = getContract();

    contract.on('ProjectFunded', (projectId, amount, event) => {
        callback({
            projectId: Number(projectId),
            amount: ethers.formatEther(amount),
            transactionHash: event.log.transactionHash
        });
    });
};

/**
 * Listen for MilestonePaid event
 */
const listenForMilestonePaid = (callback) => {
    const contract = getContract();

    contract.on('MilestonePaid', (projectId, milestoneId, freelancer, amount, event) => {
        callback({
            projectId: Number(projectId),
            milestoneId: Number(milestoneId),
            freelancer: freelancer,
            amount: ethers.formatEther(amount),
            transactionHash: event.log.transactionHash
        });
    });
};

/**
 * Listen for DisputeResolved event
 */
const listenForDisputeResolved = (callback) => {
    const contract = getContract();

    contract.on('DisputeResolved', (disputeId, projectId, milestoneId, freelancerAmount, clientAmount, event) => {
        callback({
            disputeId: Number(disputeId),
            projectId: Number(projectId),
            milestoneId: Number(milestoneId),
            freelancerAmount: ethers.formatEther(freelancerAmount),
            clientAmount: ethers.formatEther(clientAmount),
            transactionHash: event.log.transactionHash
        });
    });
};

module.exports = {
    getContract,
    createBlockchainProject,
    getBlockchainProjectDetails,
    getBlockchainMilestoneDetails,
    listenForProjectFunded,
    listenForMilestonePaid,
    listenForDisputeResolved
};
