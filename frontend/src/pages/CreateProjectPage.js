import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './CreateProjectPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function CreateProjectPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const errorRef = useRef(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Web Development',
        budget: '',
        milestones: [{ title: '', amount: '' }]
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleMilestoneChange = (index, field, value) => {
        const newMilestones = [...formData.milestones];
        newMilestones[index][field] = value;
        setFormData({ ...formData, milestones: newMilestones });
    };

    const addMilestone = () => {
        setFormData({
            ...formData,
            milestones: [...formData.milestones, { title: '', amount: '' }]
        });
    };

    const removeMilestone = (index) => {
        const newMilestones = formData.milestones.filter((_, i) => i !== index);
        setFormData({ ...formData, milestones: newMilestones });
    };

    const showError = (msg) => {
        setError(msg);
        setSuccess('');
        // Scroll to error
        setTimeout(() => {
            if (errorRef.current) {
                errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        // Basic validation
        if (!formData.title.trim()) {
            showError('Please enter a project title.');
            setLoading(false);
            return;
        }

        if (!formData.description.trim()) {
            showError('Please enter a project description.');
            setLoading(false);
            return;
        }

        if (!formData.budget || parseFloat(formData.budget) <= 0) {
            showError('Please enter a valid budget.');
            setLoading(false);
            return;
        }

        // Validate milestones
        for (let i = 0; i < formData.milestones.length; i++) {
            if (!formData.milestones[i].title.trim()) {
                showError(`Please enter a title for milestone ${i + 1}.`);
                setLoading(false);
                return;
            }
            if (!formData.milestones[i].amount || parseFloat(formData.milestones[i].amount) <= 0) {
                showError(`Please enter a valid amount for milestone ${i + 1}.`);
                setLoading(false);
                return;
            }
        }

        // Check milestone sum matches budget
        const milestoneSum = formData.milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
        const budgetVal = parseFloat(formData.budget);
        if (Math.abs(milestoneSum - budgetVal) > 0.001) {
            showError(`Milestone amounts (${milestoneSum.toFixed(4)} ETH) must equal the total budget (${budgetVal} ETH). Please adjust your milestones.`);
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                showError('You are not logged in. Please log in again.');
                setLoading(false);
                return;
            }

            const response = await axios.post(`${API_URL}/projects`, {
                title: formData.title.trim(),
                description: formData.description.trim(),
                category: formData.category,
                budget: budgetVal,
                milestones: formData.milestones.map(m => ({
                    title: m.title.trim(),
                    amount: parseFloat(m.amount)
                }))
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            setSuccess('Project created successfully! Redirecting...');
            alert('✅ Project created successfully!');
            setTimeout(() => navigate('/dashboard'), 500);
        } catch (err) {
            console.error('Create project error:', err);
            let errorMsg = 'Failed to create project.';
            if (err.response) {
                const errorData = err.response.data;
                if (errorData?.errors && Array.isArray(errorData.errors)) {
                    errorMsg = errorData.errors.map(e => e.msg || e.message).join('. ');
                } else if (errorData?.error) {
                    errorMsg = errorData.error;
                } else {
                    errorMsg = `Server error (${err.response.status}): ${JSON.stringify(errorData)}`;
                }
            } else if (err.request) {
                errorMsg = 'No response from server. Is the backend running?';
            } else {
                errorMsg = err.message;
            }
            showError(errorMsg);
            alert('❌ Error: ' + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const totalMilestoneAmount = formData.milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
    const budgetMatch = !formData.budget || Math.abs(totalMilestoneAmount - parseFloat(formData.budget)) <= 0.001;

    return (
        <div className="create-project-page">
            <nav className="navbar">
                <div className="container navbar-content">
                    <Link to="/" className="logo">
                        <h2>🔒 Escrow Platform</h2>
                    </Link>
                    <div className="nav-actions">
                        <Link to="/dashboard" className="btn btn-outline">← Back to Dashboard</Link>
                    </div>
                </div>
            </nav>

            <div className="container">
                <div className="create-project-container">
                    <div className="page-header">
                        <h1>Create New Project</h1>
                        <p>Post a project and receive proposals from talented freelancers</p>
                    </div>

                    <form onSubmit={handleSubmit} className="project-form card">
                        <div className="form-group">
                            <label className="form-label">Project Title*</label>
                            <input
                                type="text"
                                name="title"
                                className="form-input"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Build a responsive landing page"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description*</label>
                            <textarea
                                name="description"
                                className="form-textarea"
                                value={formData.description}
                                onChange={handleChange}
                                rows="6"
                                placeholder="Describe your project in detail..."
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Category*</label>
                                <select
                                    name="category"
                                    className="form-select"
                                    value={formData.category}
                                    onChange={handleChange}
                                >
                                    <option value="Web Development">Web Development</option>
                                    <option value="Mobile Apps">Mobile Apps</option>
                                    <option value="Design">Design</option>
                                    <option value="Writing">Writing</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Total Budget (ETH)*</label>
                                <input
                                    type="number"
                                    name="budget"
                                    className="form-input"
                                    value={formData.budget}
                                    onChange={handleChange}
                                    step="0.001"
                                    min="0"
                                    placeholder="e.g. 1.5"
                                />
                            </div>
                        </div>

                        <div className="milestones-section">
                            <div className="section-header">
                                <h3>Project Milestones</h3>
                                <button type="button" onClick={addMilestone} className="btn btn-outline btn-sm">
                                    + Add Milestone
                                </button>
                            </div>

                            {formData.milestones.map((milestone, index) => (
                                <div key={index} className="milestone-item">
                                    <div className="milestone-number">{index + 1}</div>
                                    <div className="milestone-fields">
                                        <div className="form-group">
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={milestone.title}
                                                onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                                                placeholder="Milestone title"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={milestone.amount}
                                                onChange={(e) => handleMilestoneChange(index, 'amount', e.target.value)}
                                                placeholder="Amount (ETH)"
                                                step="0.001"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                    {formData.milestones.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeMilestone(index)}
                                            className="btn-remove"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}

                            <div className="milestone-summary">
                                <strong>Total Milestone Amount:</strong> {totalMilestoneAmount.toFixed(3)} ETH
                                {!budgetMatch && (
                                    <span className="warning-text">
                                        (Should equal budget: {formData.budget} ETH)
                                    </span>
                                )}
                                {budgetMatch && formData.budget && (
                                    <span style={{ color: '#27ae60', marginLeft: '8px' }}>✓ Matches budget</span>
                                )}
                            </div>
                        </div>

                        {/* Error and success messages right above the submit button */}
                        <div ref={errorRef}>
                            {error && (
                                <div style={{
                                    background: 'rgba(231, 76, 60, 0.15)',
                                    border: '1px solid rgba(231, 76, 60, 0.5)',
                                    color: '#e74c3c',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    marginBottom: '16px',
                                    fontSize: '14px'
                                }}>
                                    ❌ {error}
                                </div>
                            )}
                            {success && (
                                <div style={{
                                    background: 'rgba(39, 174, 96, 0.15)',
                                    border: '1px solid rgba(39, 174, 96, 0.5)',
                                    color: '#27ae60',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    marginBottom: '16px',
                                    fontSize: '14px'
                                }}>
                                    ✅ {success}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-large"
                            disabled={loading}
                            style={{ width: '100%', padding: '14px', fontSize: '16px' }}
                        >
                            {loading ? 'Creating Project...' : 'Create Project'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CreateProjectPage;
