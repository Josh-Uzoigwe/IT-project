import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useWeb3 } from '../contexts/Web3Context';
import {
    LockIcon,
    UserIcon,
    WalletIcon,
    LogOutIcon,
    BriefcaseIcon,
    PlusIcon,
    SearchIcon,
    EthereumIcon,
    GridIcon
} from '../components/Icons';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Dashboard() {
    const { user, logout, linkWallet } = useAuth();
    const { account, connectWallet, isConnected } = useWeb3();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [walletConnecting, setWalletConnecting] = useState(false);
    const [walletError, setWalletError] = useState('');
    const navigate = useNavigate();

    // Normalize role for comparisons (case-insensitive)
    const userRole = (user?.role || '').toLowerCase();
    const isClient = userRole === 'client';
    const isFreelancer = userRole === 'freelancer';

    useEffect(() => {
        if (user) {
            loadProjects();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadProjects = async () => {
        try {
            const response = await axios.get(`${API_URL}/projects?role=my-projects`);
            setProjects(response.data.projects || []);
        } catch (error) {
            console.error('Failed to load projects:', error);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    const handleWalletConnect = async () => {
        setWalletError('');
        setWalletConnecting(true);
        try {
            const result = await connectWallet();
            if (result.success && result.account) {
                // Link wallet to user account in the backend
                const linkResult = await linkWallet(result.account);
                if (!linkResult.success) {
                    setWalletError('Wallet connected but linking failed: ' + (linkResult.error || 'Unknown error'));
                }
            } else if (!result.success) {
                setWalletError(result.error || 'Failed to connect wallet');
            }
        } catch (error) {
            console.error('Wallet connection error:', error);
            setWalletError('Failed to connect wallet: ' + error.message);
        } finally {
            setWalletConnecting(false);
        }
    };

    const handleCreateProject = () => {
        navigate('/create-project');
    };

    const handleBrowseProjects = () => {
        navigate('/browse-projects');
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'Open': 'badge-info',
            'PendingFunding': 'badge-warning',
            'Funded': 'badge-info',
            'Active': 'badge-success',
            'Completed': 'badge-success',
            'Disputed': 'badge-danger',
            'Cancelled': 'badge-danger'
        };

        return `badge ${statusMap[status] || 'badge-info'}`;
    };

    return (
        <div className="dashboard">
            {/* Header */}
            <nav className="dashboard-nav">
                <div className="container dashboard-nav-content">
                    <Link to="/" className="logo">
                        <div className="logo-icon">
                            <LockIcon className="icon" />
                        </div>
                        <h2>GigsNearYou</h2>
                    </Link>
                    <div className="nav-actions">
                        <span className="user-name">
                            <UserIcon className="icon-sm" />
                            {user?.name}
                        </span>
                        <button onClick={logout} className="btn btn-outline">
                            <LogOutIcon className="icon-sm" />
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="dashboard-content container">
                {/* Wallet Connection */}
                <div className="wallet-section">
                    <h3>
                        <WalletIcon className="icon" />
                        Wallet Status
                    </h3>
                    {isConnected ? (
                        <div className="wallet-connected">
                            <span className="badge badge-success">Connected</span>
                            <p className="wallet-address">{account}</p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-secondary">Connect your MetaMask wallet to interact with smart contracts</p>
                            {walletError && <p style={{ color: '#e74c3c', marginBottom: '8px', fontSize: '14px' }}>{walletError}</p>}
                            <button
                                onClick={handleWalletConnect}
                                className="btn btn-primary mt-2"
                                disabled={walletConnecting}
                            >
                                <WalletIcon className="icon-sm" />
                                {walletConnecting ? 'Connecting...' : 'Connect Wallet'}
                            </button>
                        </div>
                    )}
                </div>

                {/* User Info */}
                <div className="user-info card mt-3">
                    <h2>Welcome, {user?.name}!</h2>
                    <p className="user-role badge badge-primary">{user?.role}</p>
                    {user?.walletAddress && (
                        <p className="text-secondary">Linked Wallet: {user.walletAddress}</p>
                    )}
                </div>

                {/* Projects Section */}
                <div className="projects-section mt-4">
                    <div className="section-header">
                        <h2>
                            <GridIcon className="icon" />
                            My Projects
                        </h2>
                        {isClient && (
                            <button onClick={handleCreateProject} className="btn btn-primary">
                                <PlusIcon className="icon-sm" />
                                Create Project
                            </button>
                        )}
                        {isFreelancer && (
                            <button onClick={handleBrowseProjects} className="btn btn-primary">
                                <SearchIcon className="icon-sm" />
                                Browse Projects
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="text-center mt-4">
                            <div className="loading loading-lg"></div>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="empty-state mt-3">
                            <div className="empty-state-icon">
                                <BriefcaseIcon />
                            </div>
                            <p>No projects yet</p>
                            {isFreelancer && (
                                <button onClick={handleBrowseProjects} className="btn btn-primary">
                                    <SearchIcon className="icon-sm" />
                                    Find Projects
                                </button>
                            )}
                            {isClient && (
                                <button onClick={handleCreateProject} className="btn btn-primary">
                                    <PlusIcon className="icon-sm" />
                                    Create Your First Project
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="projects-grid mt-3">
                            {projects.map((project) => (
                                <div
                                    key={project._id}
                                    onClick={() => navigate(`/project/${project._id}`)}
                                    className="project-card"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="project-header">
                                        <h3>{project.title}</h3>
                                        <span className={getStatusBadge(project.status)}>
                                            {project.status}
                                        </span>
                                    </div>
                                    <p className="project-description">{project.description}</p>
                                    <div className="project-footer">
                                        <span className="project-budget">
                                            <EthereumIcon className="icon-sm" style={{ WebkitTextFillColor: 'initial' }} />
                                            {project.budget} ETH
                                        </span>
                                        {isClient && project.freelancer && (
                                            <span className="text-secondary">
                                                Freelancer: {project.freelancer.name}
                                            </span>
                                        )}
                                        {isFreelancer && project.client && (
                                            <span className="text-secondary">
                                                Client: {project.client.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
