import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import EscrowContractABI from '../contracts/EscrowContract.json';

const Web3Context = createContext(null);

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
const NETWORK_ID = parseInt(process.env.REACT_APP_NETWORK_ID || '11155111');
const NETWORK_NAME = process.env.REACT_APP_NETWORK_NAME || 'Sepolia';

export const useWeb3 = () => {
    const context = useContext(Web3Context);
    if (!context) {
        throw new Error('useWeb3 must be used within Web3Provider');
    }
    return context;
};

export const Web3Provider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [chainId, setChainId] = useState(null);
    const [connecting, setConnecting] = useState(false);

    const connectWallet = useCallback(async () => {
        if (typeof window.ethereum === 'undefined') {
            alert('Please install MetaMask to use this application');
            return { success: false, error: 'MetaMask not installed' };
        }

        try {
            setConnecting(true);

            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            const web3Signer = await web3Provider.getSigner();
            const network = await web3Provider.getNetwork();

            setAccount(accounts[0]);
            setProvider(web3Provider);
            setSigner(web3Signer);
            setChainId(Number(network.chainId));

            // Initialize contract
            if (CONTRACT_ADDRESS) {
                const escrowContract = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    EscrowContractABI.abi,
                    web3Signer
                );
                setContract(escrowContract);
            }

            // Check network
            if (Number(network.chainId) !== NETWORK_ID) {
                alert(`Please switch to ${NETWORK_NAME} network in MetaMask`);
                return { success: false, error: 'Wrong network' };
            }

            return { success: true, account: accounts[0] };
        } catch (error) {
            console.error('Wallet connection error:', error);
            return { success: false, error: error.message };
        } finally {
            setConnecting(false);
        }
    }, []);

    const disconnectWallet = () => {
        setAccount(null);
        setProvider(null);
        setSigner(null);
        setContract(null);
    };

    // Listen for account changes
    useEffect(() => {
        if (typeof window !== 'undefined' && window.ethereum) {
            try {
                window.ethereum.on('accountsChanged', (accounts) => {
                    if (accounts.length > 0) {
                        setAccount(accounts[0]);
                    } else {
                        disconnectWallet();
                    }
                });

                window.ethereum.on('chainChanged', () => {
                    window.location.reload();
                });
            } catch (error) {
                console.warn('Could not set up MetaMask listeners:', error);
            }
        }

        return () => {
            if (typeof window !== 'undefined' && window.ethereum) {
                try {
                    window.ethereum.removeAllListeners('accountsChanged');
                    window.ethereum.removeAllListeners('chainChanged');
                } catch (error) {
                    console.warn('Could not remove MetaMask listeners:', error);
                }
            }
        };
    }, []);

    // Contract interaction Methods
    const createProject = async (freelancerAddress, arbitratorAddress, milestoneAmounts) => {
        if (!contract) throw new Error('Contract not initialized');

        try {
            const amounts = milestoneAmounts.map(amount =>
                ethers.parseEther(amount.toString())
            );

            const tx = await contract.createProject(
                freelancerAddress,
                arbitratorAddress,
                amounts
            );

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
            const projectId = Number(parsed.args.projectId);

            return {
                success: true,
                projectId,
                transactionHash: receipt.hash
            };
        } catch (error) {
            console.error('Create project error:', error);
            return { success: false, error: error.message };
        }
    };

    const fundProject = async (projectId, amount) => {
        if (!contract) throw new Error('Contract not initialized');

        try {
            const tx = await contract.fundProject(projectId, {
                value: ethers.parseEther(amount.toString())
            });

            const receipt = await tx.wait();

            return {
                success: true,
                transactionHash: receipt.hash
            };
        } catch (error) {
            console.error('Fund project error:', error);
            return { success: false, error: error.message };
        }
    };

    const submitMilestone = async (projectId, milestoneId) => {
        if (!contract) throw new Error('Contract not initialized');

        try {
            const tx = await contract.submitMilestone(projectId, milestoneId);
            const receipt = await tx.wait();

            return {
                success: true,
                transactionHash: receipt.hash
            };
        } catch (error) {
            console.error('Submit milestone error:', error);
            return { success: false, error: error.message };
        }
    };

    const approveMilestone = async (projectId, milestoneId) => {
        if (!contract) throw new Error('Contract not initialized');

        try {
            const tx = await contract.approveMilestone(projectId, milestoneId);
            const receipt = await tx.wait();

            return {
                success: true,
                transactionHash: receipt.hash
            };
        } catch (error) {
            console.error('Approve milestone error:', error);
            return { success: false, error: error.message };
        }
    };

    const raiseDispute = async (projectId, milestoneId) => {
        if (!contract) throw new Error('Contract not initialized');

        try {
            const tx = await contract.raiseDispute(projectId, milestoneId);
            const receipt = await tx.wait();

            return {
                success: true,
                transactionHash: receipt.hash
            };
        } catch (error) {
            console.error('Raise dispute error:', error);
            return { success: false, error: error.message };
        }
    };

    const resolveDispute = async (disputeId, freelancerPercentage) => {
        if (!contract) throw new Error('Contract not initialized');

        try {
            const tx = await contract.resolveDispute(disputeId, freelancerPercentage);
            const receipt = await tx.wait();

            return {
                success: true,
                transactionHash: receipt.hash
            };
        } catch (error) {
            console.error('Resolve dispute error:', error);
            return { success: false, error: error.message };
        }
    };

    const getProjectDetails = async (projectId) => {
        if (!contract) throw new Error('Contract not initialized');

        try {
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
            console.error('Get project details error:', error);
            throw error;
        }
    };

    const value = {
        account,
        provider,
        signer,
        contract,
        chainId,
        connecting,
        isConnected: !!account,
        isCorrectNetwork: chainId === NETWORK_ID,
        connectWallet,
        disconnectWallet,
        // Contract methods
        createProject,
        fundProject,
        submitMilestone,
        approveMilestone,
        raiseDispute,
        resolveDispute,
        getProjectDetails
    };

    return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
