import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const Web3Context = createContext(null);

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '';
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
    const [ethersLoaded, setEthersLoaded] = useState(false);
    const [ethersModule, setEthersModule] = useState(null);
    const [contractABI, setContractABI] = useState(null);

    // Lazy‑load ethers and contract ABI so an import failure does not crash the entire app
    useEffect(() => {
        const load = async () => {
            try {
                const ethers = await import('ethers');
                setEthersModule(ethers);

                // Try to load the ABI
                try {
                    const abi = await import('../contracts/EscrowContract.json');
                    setContractABI(abi.default || abi);
                } catch (e) {
                    console.warn('Could not load contract ABI:', e);
                }

                setEthersLoaded(true);
            } catch (e) {
                console.error('Failed to load ethers.js:', e);
                setEthersLoaded(true); // Mark as loaded so the UI still renders
            }
        };
        load();
    }, []);

    const connectWallet = useCallback(async () => {
        // Check for MetaMask
        if (typeof window === 'undefined' || !window.ethereum) {
            return {
                success: false,
                error: 'MetaMask is not installed. Please install the MetaMask browser extension to connect your wallet.'
            };
        }

        if (!ethersModule) {
            return { success: false, error: 'Web3 library is still loading. Please try again in a moment.' };
        }

        try {
            setConnecting(true);

            // This is the line that triggers the MetaMask popup
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (!accounts || accounts.length === 0) {
                return { success: false, error: 'No accounts returned from MetaMask' };
            }

            const ethers = ethersModule;
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            const web3Signer = await web3Provider.getSigner();
            const network = await web3Provider.getNetwork();

            setAccount(accounts[0]);
            setProvider(web3Provider);
            setSigner(web3Signer);
            setChainId(Number(network.chainId));

            // Initialize contract if ABI and address are available
            if (CONTRACT_ADDRESS && contractABI && contractABI.abi) {
                try {
                    const escrowContract = new ethers.Contract(
                        CONTRACT_ADDRESS,
                        contractABI.abi,
                        web3Signer
                    );
                    setContract(escrowContract);
                } catch (e) {
                    console.warn('Could not initialize contract:', e);
                }
            }

            // Check network
            if (Number(network.chainId) !== NETWORK_ID) {
                console.warn(`Connected to chain ${network.chainId}, expected ${NETWORK_ID} (${NETWORK_NAME})`);
            }

            return { success: true, account: accounts[0] };
        } catch (error) {
            console.error('Wallet connection error:', error);
            if (error.code === 4001) {
                return { success: false, error: 'You rejected the connection request in MetaMask.' };
            }
            return { success: false, error: error.message || 'Failed to connect wallet' };
        } finally {
            setConnecting(false);
        }
    }, [ethersModule, contractABI]);

    const disconnectWallet = () => {
        setAccount(null);
        setProvider(null);
        setSigner(null);
        setContract(null);
    };

    // Listen for account/chain changes
    useEffect(() => {
        if (typeof window !== 'undefined' && window.ethereum) {
            const handleAccountsChanged = (accounts) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                } else {
                    disconnectWallet();
                }
            };

            const handleChainChanged = () => {
                window.location.reload();
            };

            try {
                window.ethereum.on('accountsChanged', handleAccountsChanged);
                window.ethereum.on('chainChanged', handleChainChanged);
            } catch (error) {
                console.warn('Could not set up MetaMask listeners:', error);
            }

            return () => {
                try {
                    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                    window.ethereum.removeListener('chainChanged', handleChainChanged);
                } catch (error) {
                    console.warn('Could not remove MetaMask listeners:', error);
                }
            };
        }
    }, []);

    // Contract interaction methods — only work if contract is initialized
    const createProject = async (freelancerAddress, arbitratorAddress, milestoneAmounts) => {
        if (!contract || !ethersModule) throw new Error('Contract not initialized. Please connect your wallet first.');
        const amounts = milestoneAmounts.map(amount =>
            ethersModule.parseEther(amount.toString())
        );
        const tx = await contract.createProject(freelancerAddress, arbitratorAddress, amounts);
        const receipt = await tx.wait();
        const event = receipt.logs.find(log => {
            try { return contract.interface.parseLog(log)?.name === 'ProjectCreated'; } catch { return false; }
        });
        if (event) {
            const parsed = contract.interface.parseLog(event);
            return { success: true, projectId: Number(parsed.args.projectId), transactionHash: receipt.hash };
        }
        return { success: true, transactionHash: receipt.hash };
    };

    const fundProject = async (projectId, amount) => {
        if (!contract || !ethersModule) throw new Error('Contract not initialized');
        const tx = await contract.fundProject(projectId, { value: ethersModule.parseEther(amount.toString()) });
        const receipt = await tx.wait();
        return { success: true, transactionHash: receipt.hash };
    };

    const submitMilestone = async (projectId, milestoneId) => {
        if (!contract) throw new Error('Contract not initialized');
        const tx = await contract.submitMilestone(projectId, milestoneId);
        const receipt = await tx.wait();
        return { success: true, transactionHash: receipt.hash };
    };

    const approveMilestone = async (projectId, milestoneId) => {
        if (!contract) throw new Error('Contract not initialized');
        const tx = await contract.approveMilestone(projectId, milestoneId);
        const receipt = await tx.wait();
        return { success: true, transactionHash: receipt.hash };
    };

    const raiseDispute = async (projectId, milestoneId) => {
        if (!contract) throw new Error('Contract not initialized');
        const tx = await contract.raiseDispute(projectId, milestoneId);
        const receipt = await tx.wait();
        return { success: true, transactionHash: receipt.hash };
    };

    const resolveDispute = async (disputeId, freelancerPercentage) => {
        if (!contract) throw new Error('Contract not initialized');
        const tx = await contract.resolveDispute(disputeId, freelancerPercentage);
        const receipt = await tx.wait();
        return { success: true, transactionHash: receipt.hash };
    };

    const getProjectDetails = async (projectId) => {
        if (!contract || !ethersModule) throw new Error('Contract not initialized');
        const details = await contract.getProjectDetails(projectId);
        return {
            client: details.client,
            freelancer: details.freelancer,
            arbitrator: details.arbitrator,
            totalBudget: ethersModule.formatEther(details.totalBudget),
            totalPaid: ethersModule.formatEther(details.totalPaid),
            milestoneCount: Number(details.milestoneCount),
            status: Number(details.status)
        };
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
