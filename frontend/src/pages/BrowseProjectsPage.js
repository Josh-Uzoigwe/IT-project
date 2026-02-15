import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
    LockIcon,
    SearchIcon,
    BriefcaseIcon,
    EthereumIcon,
    UserIcon,
    GridIcon
} from '../components/Icons';
import './BrowseProjectsPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function BrowseProjectsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [proposalModal, setProposalModal] = useState(null);
    const [proposalData, setProposalData] = useState({ coverLetter: '', proposedTimeline: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const response = await axios.get(`${API_URL}/projects?status=Open`);
            setProjects(response.data.projects || []);
        } catch (error) {
            console.error('Failed to load projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = ['All', 'Web Development', 'Mobile Apps', 'Design', 'Writing', 'Marketing'];

    const filteredProjects = projects.filter(project => {
        const matchesCategory = filter === 'All' || project.category === filter;
        const matchesSearch = !search ||
            project.title?.toLowerCase().includes(search.toLowerCase()) ||
            project.description?.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleSubmitProposal = async (e) => {
        e.preventDefault();
        if (!proposalModal) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/proposals`, {
                projectId: proposalModal._id,
                coverLetter: proposalData.coverLetter,
                proposedTimeline: proposalData.proposedTimeline
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            alert('✅ Proposal submitted successfully!');
            setProposalModal(null);
            setProposalData({ coverLetter: '', proposedTimeline: '' });
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to submit proposal';
            alert('❌ ' + msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="browse-page">
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

            {/* Page Header */}
            <div className="page-header">
                <div className="container page-header-content">
                    <div className="page-title">
                        <div className="page-title-icon">
                            <BriefcaseIcon />
                        </div>
                        <div>
                            <h1>Browse Available Projects</h1>
                            <p>Find exciting freelance opportunities</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
                {/* Search and Filters */}
                <div className="filters-section">
                    <div className="search-box">
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Search projects by title or description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="category-filters">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                className={`filter-btn ${filter === cat ? 'active' : ''}`}
                                onClick={() => setFilter(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Projects Grid */}
                {loading ? (
                    <div className="loading-state">
                        <div className="loading loading-lg"></div>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <BriefcaseIcon />
                        </div>
                        <h3>No projects found</h3>
                        <p>{filter !== 'All' ? `No ${filter} projects available. Try a different category.` : 'Check back soon for new opportunities!'}</p>
                    </div>
                ) : (
                    <div className="projects-grid">
                        {filteredProjects.map((project) => (
                            <div key={project._id} className="project-card">
                                <div className="project-card-top">
                                    <div className="project-card-header">
                                        <h3>{project.title}</h3>
                                        <span className="badge badge-success">{project.status}</span>
                                    </div>
                                    <p className="project-card-description">{project.description}</p>
                                    {project.category && (
                                        <span className="project-category">{project.category}</span>
                                    )}
                                </div>

                                <div className="project-card-meta">
                                    <div className="project-budget">
                                        <EthereumIcon className="icon-sm" style={{ WebkitTextFillColor: 'initial' }} />
                                        {project.budget} ETH
                                    </div>
                                    <div className="project-client">
                                        <UserIcon className="icon-sm" />
                                        {project.client?.name || 'Anonymous'}
                                    </div>
                                </div>

                                <div className="project-actions">
                                    <button
                                        onClick={() => navigate(`/project/${project._id}`)}
                                        className="btn btn-primary"
                                    >
                                        View Details
                                    </button>
                                    {user?.role?.toLowerCase() === 'freelancer' && (
                                        <button
                                            onClick={() => {
                                                setProposalModal(project);
                                                setProposalData({ coverLetter: '', proposedTimeline: '' });
                                            }}
                                            className="btn btn-outline"
                                        >
                                            Submit Proposal
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Proposal Modal */}
            {proposalModal && (
                <div className="modal-overlay" onClick={() => setProposalModal(null)}>
                    <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Submit Proposal</h2>
                            <button className="modal-close" onClick={() => setProposalModal(null)}>×</button>
                        </div>
                        <p className="modal-subtitle">For: <strong>{proposalModal.title}</strong></p>

                        <form onSubmit={handleSubmitProposal}>
                            <div className="form-group">
                                <label className="form-label">Estimated Timeline</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={proposalData.proposedTimeline}
                                    onChange={(e) => setProposalData({ ...proposalData, proposedTimeline: e.target.value })}
                                    placeholder="e.g. 2 weeks"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Cover Letter</label>
                                <textarea
                                    className="form-textarea"
                                    value={proposalData.coverLetter}
                                    onChange={(e) => setProposalData({ ...proposalData, coverLetter: e.target.value })}
                                    rows="5"
                                    placeholder="Why are you the best fit for this project? Describe your relevant experience..."
                                    required
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setProposalModal(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Submit Proposal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BrowseProjectsPage;
