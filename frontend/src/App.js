import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Web3Provider } from './contexts/Web3Context';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';

// Pages (will create minimal versions)
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import BrowseProjectsPage from './pages/BrowseProjectsPage';
import CreateProjectPage from './pages/CreateProjectPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="container mt-4 text-center">Loading...</div>;
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppRoutes() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/browse-projects"
                    element={
                        <ProtectedRoute>
                            <BrowseProjectsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/create-project"
                    element={
                        <ProtectedRoute>
                            <CreateProjectPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/project/:id"
                    element={
                        <ProtectedRoute>
                            <ProjectDetailsPage />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Web3Provider>
                    <AppRoutes />
                </Web3Provider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
