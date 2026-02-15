import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './BrowseProjectsPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function BrowseProjectsPage() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadProjects();
    }, [filter]);

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

    return (
        <div className="browse-projects-page">
            {/* Header */}
            <nav className="navbar">
                <div className="container navbar-content">
                    <Link to="/" className="logo">
                        <h2>🔒 Escrow Platform</h2>
                    </Link>
                    <div className="nav-actions">
                        <Link to="/dashboard" className="btn btn-outline">Dashboard</Link>
                    </div>
                </div>
            </nav>

            <div className="container">
                <div className="page-header">
                    <h1>Browse Available Projects</h1>
                    <p>Find exciting freelance opportunities</p>
                </div>

                {/* Filters */}
                <div className="filters-section">
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
                        <div className="loading"></div>
                        <p>Loading projects...</p>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="empty-state card">
                        <h3>No projects available yet</h3>
                        <p>Check back soon for new opportunities!</p>
                    </div>
                ) : (
                    <div className="projects-grid">
                        {projects.map((project) => (
                            <div key={project._id} className="project-card card">
                                <div className="project-card-header">
                                    <h3>{project.title}</h3>
                                    <span className="badge badge-success">{project.status}</span>
                                </div>
                                <p className="project-description">{project.description}</p>
                                <div className="project-meta">
                                    <div className="meta-item">
                                        <strong>Budget:</strong> {project.budget} ETH
                                    </div>
                                    {project.category && (
                                        <div className="meta-item">
                                            <strong>Category:</strong> {project.category}
                                        </div>
                                    )}
                                    <div className="meta-item">
                                        <strong>Client:</strong> {project.client?.name || 'Anonymous'}
                                    </div>
                                </div>
                                <div className="project-actions">
                                    <Link to={`/project/${project._id}`} className="btn btn-primary">
                                        View Details
                                    </Link>
                                    <button className="btn btn-outline">Submit Proposal</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default BrowseProjectsPage;
