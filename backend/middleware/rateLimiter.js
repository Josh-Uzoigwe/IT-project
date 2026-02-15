const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting Middleware
 * Protect routes from abuse and brute-force attacks
 */

// General API rate limiter
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests, please try again later.',
        retryAfter: 15
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many requests from this IP, please try again after 15 minutes',
            retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        });
    }
});

// Strict rate limiter for authentication routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login attempts per windowMs
    message: {
        success: false,
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: 15
    },
    skipSuccessfulRequests: true, // Don't count successful logins
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many authentication attempts from this IP, please try again after 15 minutes',
            retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        });
    }
});

// Registration rate limiter
const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 registration attempts per hour
    message: {
        success: false,
        error: 'Too many account creation attempts, please try again later.'
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many accounts created from this IP, please try again after an hour',
            retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        });
    }
});

// Blockchain transaction rate limiter (prevent spam transactions)
const blockchainLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // Limit each IP to 20 blockchain operations per 5 minutes
    message: {
        success: false,
        error: 'Too many blockchain operations, please try again later.'
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many blockchain operations from this IP, please wait before trying again',
            retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        });
    }
});

// Project creation rate limiter
const projectCreationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 project creations per hour
    message: {
        success: false,
        error: 'Too many projects created, please try again later.'
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many projects created from this IP, please try again after an hour',
            retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        });
    }
});

// Password reset rate limiter
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 password reset attempts per hour
    message: {
        success: false,
        error: 'Too many password reset attempts, please try again later.'
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: 'Too many password reset attempts, please try again after an hour',
            retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        });
    }
});

module.exports = {
    generalLimiter,
    authLimiter,
    registrationLimiter,
    blockchainLimiter,
    projectCreationLimiter,
    passwordResetLimiter
};
