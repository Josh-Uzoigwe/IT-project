/**
 * Custom Error Classes
 * Standardized error handling across the application
 */

class AppError extends Error {
    constructor(message, statusCode, errorCode = null) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode || this.constructor.name;
        this.isOperational = true;
        this.timestamp = new Date().toISOString();

        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            success: false,
            error: this.message,
            errorCode: this.errorCode,
            statusCode: this.statusCode,
            timestamp: this.timestamp
        };
    }
}

// 400 Bad Request
class ValidationError extends AppError {
    constructor(message = 'Validation failed', details = null) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            details: this.details
        };
    }
}

// 401 Unauthorized
class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

// 403 Forbidden
class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}

// 404 Not Found
class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
        this.resource = resource;
    }
}

// 409 Conflict
class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409, 'CONFLICT');
    }
}

// 500 Internal Server Error
class InternalError extends AppError {
    constructor(message = 'Internal server error') {
        super(message, 500, 'INTERNAL_ERROR');
    }
}

// Blockchain-specific errors
class BlockchainError extends AppError {
    constructor(message = 'Blockchain operation failed', txHash = null) {
        super(message, 502, 'BLOCKCHAIN_ERROR');
        this.txHash = txHash;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            txHash: this.txHash
        };
    }
}

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    // Log error details for debugging
    console.error('[Error]', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Handle known operational errors
    if (err instanceof AppError) {
        return res.status(err.statusCode).json(err.toJSON());
    }

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        const details = Object.values(err.errors).map(e => ({
            field: e.path,
            message: e.message
        }));
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            errorCode: 'MONGOOSE_VALIDATION',
            details
        });
    }

    // Handle Mongoose cast errors (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            error: `Invalid ${err.path}: ${err.value}`,
            errorCode: 'INVALID_ID'
        });
    }

    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            success: false,
            error: `${field} already exists`,
            errorCode: 'DUPLICATE_KEY',
            field
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid token',
            errorCode: 'INVALID_TOKEN'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: 'Token expired',
            errorCode: 'TOKEN_EXPIRED'
        });
    }

    // Default to 500 internal server error
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
        errorCode: 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

/**
 * Async handler wrapper
 * Eliminates need for try-catch in async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    InternalError,
    BlockchainError,
    errorHandler,
    asyncHandler
};
