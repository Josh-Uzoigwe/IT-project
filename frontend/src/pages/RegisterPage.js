import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    LockIcon,
    MailIcon,
    UserIcon,
    EyeIcon,
    EyeOffIcon,
    AlertCircleIcon,
    ArrowRightIcon,
    BriefcaseIcon,
    ScaleIcon,
    CheckCircleIcon
} from '../components/Icons';
import './AuthPages.css';

function RegisterPage() {
    const [searchParams] = useSearchParams();
    const initialRole = searchParams.get('role') || 'Client';

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: initialRole.charAt(0).toUpperCase() + initialRole.slice(1)
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const result = await register(
                formData.name,
                formData.email,
                formData.password,
                formData.role
            );

            if (result.success) {
                setSuccess('Account created successfully!');
                setTimeout(() => navigate('/dashboard'), 1500);
            } else {
                setError(result.error || 'Registration failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <Link to="/" className="auth-logo">
                        <div className="auth-logo-icon">
                            <LockIcon />
                        </div>
                        <h1>GigsNearYou</h1>
                    </Link>
                    <h2>Create Account</h2>
                    <p>Join the secure freelance marketplace</p>
                </div>

                {error && (
                    <div className="auth-error">
                        <AlertCircleIcon className="icon" />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="auth-success">
                        <CheckCircleIcon className="icon" />
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">
                            <UserIcon />
                            Full Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <MailIcon />
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <LockIcon />
                            Password
                        </label>
                        <div className="password-field">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                className="form-input"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create a password"
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOffIcon className="icon-sm" /> : <EyeIcon className="icon-sm" />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <LockIcon />
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="form-input"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Select Your Role</label>
                        <div className="role-selection">
                            <div className="role-option">
                                <input
                                    type="radio"
                                    id="role-client"
                                    name="role"
                                    value="Client"
                                    checked={formData.role === 'Client'}
                                    onChange={handleChange}
                                />
                                <label htmlFor="role-client">
                                    <div className="role-icon">
                                        <BriefcaseIcon />
                                    </div>
                                    <span className="role-name">Client</span>
                                </label>
                            </div>
                            <div className="role-option">
                                <input
                                    type="radio"
                                    id="role-freelancer"
                                    name="role"
                                    value="Freelancer"
                                    checked={formData.role === 'Freelancer'}
                                    onChange={handleChange}
                                />
                                <label htmlFor="role-freelancer">
                                    <div className="role-icon">
                                        <UserIcon />
                                    </div>
                                    <span className="role-name">Freelancer</span>
                                </label>
                            </div>
                            <div className="role-option">
                                <input
                                    type="radio"
                                    id="role-arbitrator"
                                    name="role"
                                    value="Arbitrator"
                                    checked={formData.role === 'Arbitrator'}
                                    onChange={handleChange}
                                />
                                <label htmlFor="role-arbitrator">
                                    <div className="role-icon">
                                        <ScaleIcon />
                                    </div>
                                    <span className="role-name">Arbitrator</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? (
                            <span className="loading"></span>
                        ) : (
                            <>
                                Create Account
                                <ArrowRightIcon className="icon-sm" />
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;
