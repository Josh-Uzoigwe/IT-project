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
    const { user, logout } = useAuth();
    const { account, connectWallet, isConnected } = useWeb3();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadProjects();
    }, [user]);

    const loadProjects = async () => {
        try {
            const response = await axios.get(`${API_URL}/projects?role=my-projects`);
            setProjects(response.data.projects);
        } catch (error) {
            console.error('Failed to load projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleWalletConnect = async () => {
        const result = await connectWallet();
        if (result.success && user) {
            // Link wallet to user account
            // This would call the linkWallet from AuthContext
        }
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
                            <button onClick={handleWalletConnect} className="btn btn-primary mt-2">
                                <WalletIcon className="icon-sm" />
                                Connect Wallet
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
                        {user?.role === 'Client' && (
                            <Link to="/create-project" className="btn btn-primary">
                                <PlusIcon className="icon-sm" />
                                Create Project
                            </Link>
                        )}
                        {user?.role === 'Freelancer' && (
                            <Link to="/browse-projects" className="btn btn-primary">
                                <SearchIcon className="icon-sm" />
                                Browse Projects
                            </Link>
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
                            {user?.role === 'Freelancer' && (
                                <Link to="/browse-projects" className="btn btn-primary">
                                    <SearchIcon className="icon-sm" />
                                    Find Projects
                                </Link>
                            )}
                            {user?.role === 'Client' && (
                                <Link to="/create-project" className="btn btn-primary">
                                    <PlusIcon className="icon-sm" />
                                    Create Your First Project
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="projects-grid mt-3">
                            {projects.map((project) => (
                                <Link
                                    key={project._id}
                                    to={`/project/${project._id}`}
                                    className="project-card"
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
                                        {user?.role === 'Client' && project.freelancer && (
                                            <span className="text-secondary">
                                                Freelancer: {project.freelancer.name}
                                            </span>
                                        )}
                                        {user?.role === 'Freelancer' && project.client && (
                                            <span className="text-secondary">
                                                Client: {project.client.name}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
