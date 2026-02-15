const { body, validationResult, param, query } = require('express-validator');

/**
 * Sanitization Middleware
 * Common validation and sanitization rules for input data
 */

// Sanitize strings - trim and escape
const sanitizeString = (field, options = {}) => {
    const chain = body(field).trim();
    if (options.escape) {
        chain.escape();
    }
    return chain;
};

// Email validation
const validateEmail = () => {
    return body('email')
        .trim()
        .toLowerCase()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail();
};

// Password validation
const validatePassword = (field = 'password') => {
    return body(field)
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
        .withMessage('Password must contain both letters and numbers');
};

// Name validation
const validateName = () => {
    return body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s\-']+$/)
        .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes');
};

// Wallet address validation (Ethereum)
const validateWalletAddress = (field = 'walletAddress') => {
    return body(field)
        .optional()
        .trim()
        .toLowerCase()
        .matches(/^0x[a-fA-F0-9]{40}$/)
        .withMessage('Invalid Ethereum wallet address');
};

// MongoDB ObjectId validation
const validateObjectId = (field) => {
    return param(field)
        .trim()
        .isMongoId()
        .withMessage(`Invalid ${field} format`);
};

// Budget validation
const validateBudget = () => {
    return body('budget')
        .isFloat({ min: 0.001, max: 10000 })
        .withMessage('Budget must be between 0.001 and 10000 ETH');
};

// Milestone amount validation
const validateMilestoneAmount = () => {
    return body('milestones.*.amount')
        .isFloat({ min: 0.0001 })
        .withMessage('Milestone amount must be greater than 0');
};

// Title validation
const validateTitle = () => {
    return body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters');
};

// Description validation
const validateDescription = () => {
    return body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ min: 10, max: 5000 })
        .withMessage('Description must be between 10 and 5000 characters');
};

// Role validation
const validateRole = () => {
    return body('role')
        .trim()
        .isIn(['Client', 'Freelancer', 'Arbitrator'])
        .withMessage('Role must be Client, Freelancer, or Arbitrator');
};

// Pagination validation
const validatePagination = () => {
    return [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100')
    ];
};

// Percentage validation (for dispute resolution)
const validatePercentage = (field = 'freelancerPercentage') => {
    return body(field)
        .isInt({ min: 0, max: 100 })
        .withMessage('Percentage must be between 0 and 100');
};

/**
 * Validation result handler middleware
 * Returns formatted errors if validation fails
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg,
            value: err.value
        }));

        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: formattedErrors
        });
    }
    next();
};

/**
 * XSS Prevention - Strip potentially dangerous HTML tags
 */
const stripHtmlTags = (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(/<[^>]*>/g, '');
};

/**
 * Sanitize object recursively
 */
const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
        return typeof obj === 'string' ? stripHtmlTags(obj) : obj;
    }

    const sanitized = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            sanitized[key] = sanitizeObject(obj[key]);
        }
    }
    return sanitized;
};

/**
 * Request body sanitization middleware
 */
const sanitizeRequestBody = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    next();
};

/**
 * Common validation chains for different route types
 */
const validationChains = {
    // User registration
    register: [
        validateName(),
        validateEmail(),
        validatePassword(),
        validateRole()
    ],

    // User login
    login: [
        validateEmail(),
        body('password').notEmpty().withMessage('Password is required')
    ],

    // Project creation
    createProject: [
        validateTitle(),
        validateDescription(),
        validateBudget(),
        body('milestones')
            .isArray({ min: 1 })
            .withMessage('At least one milestone is required'),
        body('milestones.*.title')
            .trim()
            .notEmpty()
            .withMessage('Milestone title is required'),
        validateMilestoneAmount()
    ],

    // Wallet linking
    linkWallet: [
        validateWalletAddress()
    ],

    // Dispute resolution
    resolveDispute: [
        validatePercentage()
    ]
};

module.exports = {
    sanitizeString,
    validateEmail,
    validatePassword,
    validateName,
    validateWalletAddress,
    validateObjectId,
    validateBudget,
    validateMilestoneAmount,
    validateTitle,
    validateDescription,
    validateRole,
    validatePagination,
    validatePercentage,
    handleValidationErrors,
    sanitizeRequestBody,
    stripHtmlTags,
    sanitizeObject,
    validationChains
};
