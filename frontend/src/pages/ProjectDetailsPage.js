import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useWeb3 } from '../contexts/Web3Context';
import './ProjectDetailsPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function ProjectDetailsPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const { approveMilestone, fundProject } = useWeb3();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadProjectDetails();
    }, [id]);

    const loadProjectDetails = async () => {
        try {
            const [projectRes, milestonesRes] = await Promise.all([
                axios.get(`${API_URL}/projects/${id}`),
                axios.get(`${API_URL}/milestones/project/${id}`)
            ]);

            setProject(projectRes.data.project);
            setMilestones(milestonesRes.data.milestones);
        } catch (error) {
            console.error('Failed to load project:', error);
            alert('Failed to load project details');
        } finally {
            setLoading(false);
        }
    };

    const handleFundProject = async () => {
        if (!project.blockchainProjectId) {
            alert('Project needs to be created on blockchain first');
            return;
        }

        setActionLoading(true);
        const result = await fundProject(project.blockchainProjectId, project.budget);

        if (result.success) {
            alert('Project funded successfully!');
            loadProjectDetails();
        } else {
            alert(`Funding failed: ${result.error}`);
        }
        setActionLoading(false);
    };

    const handleApproveMilestone = async (milestone) => {
        if (!project.blockchainProjectId) {
            alert('Blockchain project ID not found');
            return;
        }

        setActionLoading(true);
        const result = await approveMilestone(
            project.blockchainProjectId,
            milestone.blockchainMilestoneId
        );

        if (result.success) {
            alert('Milestone approved! Payment is being processed.');
            loadProjectDetails();
        } else {
            alert(`Approval failed: ${result.error}`);
        }
        setActionLoading(false);
    };

    const getMilestoneStatusBadge = (status) => {
        const map = {
            'Pending': 'badge-warning',
            'Submitted': 'badge-info',
            'Approved': 'badge-success',
            'Disputed': 'badge-danger',
            'Paid': 'badge-success'
        };
        return `badge ${map[status] || 'badge-info'}`;
    };

    if (loading) {
        return (
            <div className="container mt-4 text-center">
                <div className="loading"></div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="container mt-4 text-center">
                <p>Project not found</p>
                <button onClick={() => navigate('/dashboard')} className="btn btn-primary mt-2">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const isClient = user?.id === project.client?._id;
    const isFreelancer = user?.id === project.freelancer?._id;

    return (
        <div className="project-details">
            <div className="container">
                <button onClick={() => navigate('/dashboard')} className="btn btn-outline mb-3">
                    ← Back to Dashboard
                </button>

                {/* Project Header */}
                <div className="card project-header-card">
                    <div className="project-title-section">
                        <h1>{project.title}</h1>
                        <span className={`badge ${project.status === 'Active' ? 'badge-success' : 'badge-info'}`}>
                            {project.status}
                        </span>
                    </div>
                    <p className="project-desc">{project.description}</p>
                    <div className="project-meta">
                        <div className="meta-item">
                            <strong>Budget:</strong> {project.budget} ETH
                        </div>
                        <div className="meta-item">
                            <strong>Client:</strong> {project.client?.name}
                        </div>
                        {project.freelancer && (
                            <div className="meta-item">
                                <strong>Freelancer:</strong> {project.freelancer.name}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    {isClient && project.status === 'PendingFunding' && (
                        <button
                            onClick={handleFundProject}
                            className="btn btn-primary mt-3"
                            disabled={actionLoading}
                        >
                            {actionLoading ? <span className="loading"></span> : `Fund Project (${project.budget} ETH)`}
                        </button>
                    )}
                </div>

                {/* Milestones */}
                <div className="milestones-section mt-4">
                    <h2>Milestones</h2>
                    <div className="milestones-list">
                        {milestones.map((milestone) => (
                            <div key={milestone._id} className="milestone-card card">
                                <div className="milestone-header">
                                    <h3>{milestone.title}</h3>
                                    <span className={getMilestoneStatusBadge(milestone.status)}>
                                        {milestone.status}
                                    </span>
                                </div>
                                <div className="milestone-amount">
                                    💰 {milestone.amount} ETH
                                </div>

                                {milestone.status === 'Submitted' && milestone.submissionNotes && (
                                    <div className="submission-notes mt-2">
                                        <strong>Submission Notes:</strong>
                                        <p>{milestone.submissionNotes}</p>
                                    </div>
                                )}

                                {isClient && milestone.status === 'Submitted' && (
                                    <div className="milestone-actions mt-3">
                                        <button
                                            onClick={() => handleApproveMilestone(milestone)}
                                            className="btn btn-secondary"
                                            disabled={actionLoading}
                                        >
                                            ✓ Approve Milestone
                                        </button>
                                        <button className="btn btn-danger">
                                            ⚠ Raise Dispute
                                        </button>
                                    </div>
                                )}

                                {milestone.status === 'Paid' && (
                                    <div className="paid-badge mt-2">
                                        <span className="badge badge-success">✓ Paid</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProjectDetailsPage;
