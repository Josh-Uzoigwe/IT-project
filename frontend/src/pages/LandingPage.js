import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import {
    LockIcon,
    RocketIcon,
    ShieldCheckIcon,
    ChartIcon,
    ScaleIcon,
    BoltIcon,
    SunIcon,
    MoonIcon,
    ArrowRightIcon,
    HeartIcon
} from '../components/Icons';
import './LandingPage.css';

function LandingPage() {
    const { toggleTheme, isDark } = useTheme();

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="navbar">
                <div className="container navbar-content">
                    <Link to="/" className="logo">
                        <div className="logo-icon">
                            <LockIcon className="icon" />
                        </div>
                        <h2>GigsNearYou</h2>
                    </Link>
                    <div className="nav-actions">
                        <button onClick={toggleTheme} className="theme-toggle" title="Toggle theme">
                            {isDark ? <SunIcon className="icon" /> : <MoonIcon className="icon" />}
                        </button>
                        <Link to="/login" className="btn btn-outline">Login</Link>
                        <Link to="/register" className="btn btn-primary">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-background">
                    <div className="gradient-blob blob-1"></div>
                    <div className="gradient-blob blob-2"></div>
                    <div className="gradient-blob blob-3"></div>
                </div>
                <div className="container hero-content">
                    <div className="hero-text">
                        <div className="badge hero-badge">
                            <RocketIcon className="icon-sm" />
                            Powered by Blockchain
                        </div>
                        <h1 className="hero-title">
                            Secure Freelance Payments with{' '}
                            <span className="gradient-text">Blockchain Technology</span>
                        </h1>
                        <p className="hero-description">
                            Protect your projects with milestone-based escrow payments. Smart contracts ensure
                            trust between clients and freelancers with automated, transparent transactions.
                        </p>
                        <div className="hero-buttons">
                            <Link to="/register" className="btn btn-primary btn-lg">
                                Start Your Project
                                <ArrowRightIcon className="icon-sm btn-arrow" />
                            </Link>
                            <a href="#how-it-works" className="btn btn-outline btn-lg">
                                See How It Works
                            </a>
                        </div>
                        <div className="hero-stats">
                            <div className="stat-item">
                                <div className="stat-number">100%</div>
                                <div className="stat-label">Secure</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number">0%</div>
                                <div className="stat-label">Platform Fees</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number">24/7</div>
                                <div className="stat-label">Available</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header">
                        <h2>Why Choose Our Platform?</h2>
                        <p>Built with cutting-edge blockchain technology for ultimate security</p>
                    </div>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <ShieldCheckIcon />
                            </div>
                            <h3>Secure Escrow</h3>
                            <p>
                                Funds are locked in smart contracts until both parties agree. No middleman,
                                no manipulation, just pure blockchain security.
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <ChartIcon />
                            </div>
                            <h3>Milestone-Based Payments</h3>
                            <p>
                                Break projects into milestones. Release payments step-by-step as work is
                                completed and approved.
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <ScaleIcon />
                            </div>
                            <h3>Dispute Resolution</h3>
                            <p>
                                Fair arbitration system to resolve conflicts. Independent arbitrators ensure
                                justice for both parties.
                            </p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <BoltIcon />
                            </div>
                            <h3>Instant Settlements</h3>
                            <p>
                                Automated smart contracts release payments instantly upon milestone approval.
                                No delays, no hassle.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="how-it-works-section">
                <div className="container">
                    <div className="section-header">
                        <h2>How It Works</h2>
                        <p>Three simple steps to secure your freelance work</p>
                    </div>
                    <div className="steps-container">
                        <div className="step-card">
                            <div className="step-number">1</div>
                            <div className="step-content">
                                <h3>Create Project</h3>
                                <p>
                                    Post your project with detailed requirements and milestones.
                                    Set the budget in ETH.
                                </p>
                            </div>
                        </div>
                        <div className="step-connector"></div>
                        <div className="step-card">
                            <div className="step-number">2</div>
                            <div className="step-content">
                                <h3>Fund Escrow</h3>
                                <p>
                                    Client deposits funds into the blockchain smart contract.
                                    Funds are locked securely.
                                </p>
                            </div>
                        </div>
                        <div className="step-connector"></div>
                        <div className="step-card">
                            <div className="step-number">3</div>
                            <div className="step-content">
                                <h3>Complete & Release</h3>
                                <p>
                                    Freelancer completes milestones, client approves, and payments
                                    are released automatically.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container cta-content">
                    <h2>Ready to Secure Your Next Project?</h2>
                    <p>Join thousands of freelancers and clients using blockchain escrow</p>
                    <div className="cta-buttons">
                        <Link to="/register?role=client" className="btn btn-lg">
                            I'm a Client
                        </Link>
                        <Link to="/register?role=freelancer" className="btn btn-outline btn-lg">
                            I'm a Freelancer
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container footer-content">
                    <div className="footer-section">
                        <div className="footer-brand">
                            <div className="footer-brand-icon">
                                <LockIcon className="icon" />
                            </div>
                            <h4>GigsNearYou</h4>
                        </div>
                        <p>Secure freelance payments with blockchain technology. Trust, transparency, and automation.</p>
                    </div>
                    <div className="footer-section">
                        <h4>Quick Links</h4>
                        <Link to="/register">Get Started</Link>
                        <Link to="/login">Login</Link>
                        <a href="#how-it-works">How It Works</a>
                    </div>
                    <div className="footer-section">
                        <h4>Resources</h4>
                        <a href="#">Documentation</a>
                        <a href="#">Smart Contracts</a>
                        <a href="#">Support</a>
                    </div>
                </div>
                <div className="footer-bottom">
                    <div className="container">
                        <p>
                            &copy; 2026 GigsNearYou. Built with <HeartIcon className="icon-sm" style={{ display: 'inline', verticalAlign: 'middle', color: 'var(--danger-color)' }} /> on the blockchain.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
