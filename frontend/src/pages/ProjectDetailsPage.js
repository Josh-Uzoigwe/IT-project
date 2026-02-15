import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useWeb3 } from '../contexts/Web3Context';
import {
    LockIcon,
    BriefcaseIcon,
    EthereumIcon,
    UserIcon,
    CheckCircleIcon,
    ClockIcon,
    AlertCircleIcon,
    FlagIcon,
    ArrowLeftIcon
} from '../components/Icons';
import './ProjectDetailsPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function ProjectDetailsPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Safely destructure Web3 context — it may fail if ethers.js isn't loaded
    let approveMilestone, fundProject;
    try {
        const web3 = useWeb3();
        approveMilestone = web3?.approveMilestone;
        fundProject = web3?.fundProject;
    } catch (e) {
        // Web3 not available
    }

    const [project, setProject] = useState(null);
    const [milestones, setMilestones] = useState([]);
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadProjectDetails();
    }, [id]);

    const loadProjectDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const [projectRes, milestonesRes] = await Promise.all([
                axios.get(`${API_URL}/projects/${id}`, { headers }),
                axios.get(`${API_URL}/milestones/project/${id}`, { headers })
            ]);

            setProject(projectRes.data.project);
            setMilestones(milestonesRes.data.milestones || []);

            // Load proposals if user is the client
            if (projectRes.data.project?.client?._id === user?.id) {
                try {
                    const proposalsRes = await axios.get(`${API_URL}/proposals/project/${id}`, { headers });
                    setProposals(proposalsRes.data.proposals || []);
                } catch (e) {
                    // Proposals fetch failed silently
                }
            }
        } catch (err) {
            console.error('Failed to load project:', err);
            setError('Failed to load project details');
        } finally {
            setLoading(false);
        }
    };

    const handleFundProject = async () => {
        if (!fundProject) {
            alert('Please connect your wallet first');
            return;
        }
        if (!project.blockchainProjectId && project.blockchainProjectId !== 0) {
            alert('Project needs to be created on blockchain first');
            return;
        }

        setActionLoading(true);
        try {
            const result = await fundProject(project.blockchainProjectId, project.budget);
            if (result.success) {
                alert('✅ Project funded successfully!');
                loadProjectDetails();
            } else {
                alert(`❌ Funding failed: ${result.error}`);
            }
        } catch (e) {
            alert('❌ Funding error: ' + e.message);
        }
        setActionLoading(false);
    };

    const handleApproveMilestone = async (milestone) => {
        if (!approveMilestone) {
            alert('Please connect your wallet first');
            return;
        }
        if (!project.blockchainProjectId && project.blockchainProjectId !== 0) {
            alert('Blockchain project ID not found');
            return;
        }

        setActionLoading(true);
        try {
            const result = await approveMilestone(
                project.blockchainProjectId,
                milestone.blockchainMilestoneId
            );
            if (result.success) {
                alert('✅ Milestone approved! Payment is being processed.');
                loadProjectDetails();
            } else {
                alert(`❌ Approval failed: ${result.error}`);
            }
        } catch (e) {
            alert('❌ Approval error: ' + e.message);
        }
        setActionLoading(false);
    };

    const handleAcceptProposal = async (proposalId) => {
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/proposals/${proposalId}/accept`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert('✅ Proposal accepted! The freelancer has been assigned.');
            loadProjectDetails();
        } catch (err) {
            alert('❌ ' + (err.response?.data?.error || 'Failed to accept proposal'));
        }
        setActionLoading(false);
    };

    const getMilestoneIcon = (status) => {
        switch (status) {
            case 'Approved':
            case 'Paid':
                return <CheckCircleIcon className="icon" />;
            case 'Submitted':
                return <FlagIcon className="icon" />;
            case 'Disputed':
                return <AlertCircleIcon className="icon" />;
            default:
                return <ClockIcon className="icon" />;
        }
    };

    const getMilestoneStatusClass = (status) => {
        switch (status) {
            case 'Approved':
            case 'Paid': return 'completed';
            case 'Submitted': return 'active';
            case 'Disputed': return 'disputed';
            default: return '';
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Active':
            case 'Completed':
            case 'Funded': return 'badge-success';
            case 'Open': return 'badge-info';
            case 'PendingFunding': return 'badge-warning';
            case 'Disputed':
            case 'Cancelled': return 'badge-danger';
            default: return 'badge-info';
        }
    };

    if (loading) {
        return (
            <div className="project-details-page">
                <div className="loading-full">
                    <div className="loading loading-lg"></div>
                    <p>Loading project...</p>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="project-details-page">
                <div className="container" style={{ paddingTop: '80px', textAlign: 'center' }}>
                    <AlertCircleIcon className="icon-xl" style={{ color: 'var(--danger-color)', margin: '0 auto 16px' }} />
                    <h2>{error || 'Project not found'}</h2>
                    <button onClick={() => navigate('/dashboard')} className="btn btn-primary mt-3">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const isClient = user?.id === project.client?._id;
    const isFreelancer = user?.id === project.freelancer?._id;
    const completedMilestones = milestones.filter(m => m.status === 'Approved' || m.status === 'Paid').length;
    const progressPercent = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;

    return (
        <div className="project-details-page">
            {/* Navigation */}
            <nav className="dashboard-nav">
                <div className="container dashboard-nav-content">
                    <Link to="/" className="logo">
                        <div className="logo-icon">
                            <LockIcon className="icon" />
                        </div>
                        <h2>GigsNearYou</h2>
                    </Link>
                    <div className="nav-actions">
                        <button onClick={() => navigate('/dashboard')} className="btn btn-outline">
                            ← Dashboard
                        </button>
                    </div>
                </div>
            </nav>

            {/* Header Section */}
            <div className="project-header-section">
                <div className="container project-header-content">
                    <div className="project-title-area">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <h1>{project.title}</h1>
                            <span className={`badge ${getStatusBadgeClass(project.status)}`}>
                                {project.status}
                            </span>
                        </div>
                        <div className="project-meta">
                            <div className="project-meta-item">
                                <EthereumIcon className="icon-sm" />
                                <strong>{project.budget} ETH</strong>
                            </div>
                            {project.category && (
                                <div className="project-meta-item">
                                    <BriefcaseIcon className="icon-sm" />
                                    {project.category}
                                </div>
                            )}
                            <div className="project-meta-item">
                                <UserIcon className="icon-sm" />
                                Client: {project.client?.name || 'Anonymous'}
                            </div>
                            {project.freelancer && (
                                <div className="project-meta-item">
                                    <UserIcon className="icon-sm" />
                                    Freelancer: {project.freelancer.name}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="project-actions">
                        {isClient && project.status === 'PendingFunding' && (
                            <button
                                onClick={handleFundProject}
                                className="btn btn-primary btn-lg"
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Processing...' : `Fund Project (${project.budget} ETH)`}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
                <div className="project-content">
                    {/* Left Side - Description & Milestones */}
                    <div className="project-main">
                        {/* Description */}
                        <div className="project-section">
                            <div className="project-section-header">
                                <div className="project-section-title">
                                    <BriefcaseIcon className="icon" />
                                    Project Description
                                </div>
                            </div>
                            <p className="project-description">{project.description}</p>
                        </div>

                        {/* Milestones */}
                        <div className="project-section">
                            <div className="project-section-header">
                                <div className="project-section-title">
                                    <FlagIcon className="icon" />
                                    Milestones ({completedMilestones}/{milestones.length})
                                </div>
                            </div>

                            {milestones.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)' }}>No milestones defined yet.</p>
                            ) : (
                                <div className="milestones-timeline">
                                    {milestones.map((milestone, index) => (
                                        <div key={milestone._id} className="milestone-timeline-item">
                                            <div className="milestone-timeline-connector">
                                                <div className={`milestone-status-dot ${getMilestoneStatusClass(milestone.status)}`}>
                                                    {getMilestoneIcon(milestone.status)}
                                                </div>
                                                {index < milestones.length - 1 && <div className="milestone-line"></div>}
                                            </div>
                                            <div className="milestone-content">
                                                <div className="milestone-content-header">
                                                    <div>
                                                        <div className="milestone-title">{milestone.title}</div>
                                                        <span className={`badge ${getStatusBadgeClass(milestone.status)}`} style={{ marginTop: '6px' }}>
                                                            {milestone.status}
                                                        </span>
                                                    </div>
                                                    <div className="milestone-amount">
                                                        <EthereumIcon className="icon-sm" style={{ WebkitTextFillColor: 'initial' }} />
                                                        {milestone.amount} ETH
                                                    </div>
                                                </div>

                                                {milestone.submissionNotes && (
                                                    <div style={{
                                                        background: 'var(--bg-tertiary)',
                                                        padding: '10px 14px',
                                                        borderRadius: 'var(--radius-md)',
                                                        marginTop: '12px',
                                                        fontSize: '14px',
                                                        color: 'var(--text-secondary)'
                                                    }}>
                                                        <strong>Submission Notes:</strong> {milestone.submissionNotes}
                                                    </div>
                                                )}

                                                {isClient && milestone.status === 'Submitted' && (
                                                    <div className="milestone-actions">
                                                        <button
                                                            onClick={() => handleApproveMilestone(milestone)}
                                                            className="btn btn-success btn-sm"
                                                            disabled={actionLoading}
                                                        >
                                                            ✓ Approve
                                                        </button>
                                                        <button className="btn btn-danger btn-sm">
                                                            Raise Dispute
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Proposals (Client only) */}
                        {isClient && proposals.length > 0 && (
                            <div className="project-section">
                                <div className="project-section-header">
                                    <div className="project-section-title">
                                        <UserIcon className="icon" />
                                        Proposals ({proposals.length})
                                    </div>
                                </div>
                                <div className="proposals-list">
                                    {proposals.map((proposal) => (
                                        <div key={proposal._id} className="proposal-item">
                                            <div className="proposal-header">
                                                <div className="proposal-freelancer">
                                                    <div className="participant-avatar">
                                                        <UserIcon />
                                                    </div>
                                                    <div>
                                                        <div className="participant-name">{proposal.freelancer?.name || 'Unknown'}</div>
                                                        <div className="participant-role">{proposal.freelancer?.email}</div>
                                                    </div>
                                                </div>
                                                <span className={`badge ${proposal.status === 'Accepted' ? 'badge-success' : proposal.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>
                                                    {proposal.status}
                                                </span>
                                            </div>
                                            {proposal.coverLetter && (
                                                <p className="proposal-cover-letter">{proposal.coverLetter}</p>
                                            )}
                                            {proposal.proposedTimeline && (
                                                <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                                                    Timeline: {proposal.proposedTimeline}
                                                </p>
                                            )}
                                            {proposal.status === 'Pending' && project.status === 'Open' && (
                                                <button
                                                    onClick={() => handleAcceptProposal(proposal._id)}
                                                    className="btn btn-primary btn-sm mt-2"
                                                    disabled={actionLoading}
                                                >
                                                    Accept Proposal
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar */}
                    <div className="project-sidebar">
                        {/* Budget Card */}
                        <div className="sidebar-card">
                            <div className="sidebar-card-title">
                                <EthereumIcon className="icon" />
                                Budget
                            </div>
                            <div className="budget-display">
                                <div className="budget-display-label">Total Budget</div>
                                <div className="budget-display-value">
                                    {project.budget} ETH
                                </div>
                            </div>
                            {milestones.length > 0 && (
                                <div className="budget-progress">
                                    <div className="budget-progress-bar">
                                        <div className="budget-progress-fill" style={{ width: `${progressPercent}%` }}></div>
                                    </div>
                                    <div className="budget-progress-label">
                                        <span>{completedMilestones} of {milestones.length} milestones</span>
                                        <span>{progressPercent}%</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Participants Card */}
                        <div className="sidebar-card">
                            <div className="sidebar-card-title">
                                <UserIcon className="icon" />
                                Participants
                            </div>
                            <div className="participant-item">
                                <div className="participant-avatar">
                                    <UserIcon />
                                </div>
                                <div className="participant-info">
                                    <div className="participant-name">{project.client?.name || 'Unknown'}</div>
                                    <div className="participant-role">Client</div>
                                </div>
                            </div>
                            {project.freelancer && (
                                <div className="participant-item">
                                    <div className="participant-avatar" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
                                        <UserIcon />
                                    </div>
                                    <div className="participant-info">
                                        <div className="participant-name">{project.freelancer.name}</div>
                                        <div className="participant-role">Freelancer</div>
                                    </div>
                                </div>
                            )}
                            {project.arbitrator && (
                                <div className="participant-item">
                                    <div className="participant-avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                                        <UserIcon />
                                    </div>
                                    <div className="participant-info">
                                        <div className="participant-name">{project.arbitrator.name}</div>
                                        <div className="participant-role">Arbitrator</div>
                                    </div>
                                </div>
                            )}
                            {!project.freelancer && project.status === 'Open' && (
                                <p style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginTop: '12px' }}>
                                    No freelancer assigned yet — awaiting proposals.
                                </p>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="sidebar-card">
                            <div className="sidebar-card-title">
                                Quick Actions
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <button onClick={() => navigate('/browse-projects')} className="btn btn-outline w-full">
                                    Browse Projects
                                </button>
                                <button onClick={() => navigate('/dashboard')} className="btn btn-outline w-full">
                                    Go to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProjectDetailsPage;
