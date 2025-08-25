/**
 * VoidGuard AI Governance Suite - Authentication Middleware
 * 
 * JWT-based authentication and authorization middleware
 * 
 * @author Ricardo Amaral (Brevvi) <team@silverbullet.live>
 * @version 1.0.0
 */

const jwt = require('jsonwebtoken');
const { apiResponse } = require('../utils/responseHelpers');
const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/auth.log' }),
        new winston.transports.Console()
    ]
});

/**
 * JWT Authentication Middleware
 * Verifies JWT token and adds user information to request
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const apiKey = req.headers['x-api-key'];

        // Check for Bearer token
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                // Add user information to request
                req.user = {
                    id: decoded.userId,
                    email: decoded.email,
                    role: decoded.role,
                    organizationId: decoded.organizationId,
                    permissions: decoded.permissions || []
                };
                
                logger.info('JWT authentication successful', {
                    userId: req.user.id,
                    organizationId: req.user.organizationId,
                    role: req.user.role,
                    requestId: req.requestId
                });
                
                return next();
            } catch (jwtError) {
                logger.warn('JWT verification failed', {
                    error: jwtError.message,
                    requestId: req.requestId,
                    ip: req.ip
                });
                
                return apiResponse.unauthorized(res, 'Invalid or expired token');
            }
        }

        // Check for API Key (for service-to-service authentication)
        if (apiKey) {
            // TODO: Implement API key validation
            // For now, return unauthorized
            logger.warn('API key authentication attempted but not implemented', {
                requestId: req.requestId,
                ip: req.ip
            });
            
            return apiResponse.unauthorized(res, 'API key authentication not implemented');
        }

        // No authentication provided
        logger.warn('No authentication provided', {
            requestId: req.requestId,
            ip: req.ip,
            userAgent: req.get('user-agent')
        });
        
        return apiResponse.unauthorized(res, 'Authentication required');

    } catch (error) {
        logger.error('Authentication middleware error', {
            error: error.message,
            stack: error.stack,
            requestId: req.requestId
        });
        
        return apiResponse.error(res, 'Authentication error', 500);
    }
};

/**
 * Optional Authentication Middleware
 * Adds user information if token is present, but doesn't require authentication
 */
const optionalAuthenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                req.user = {
                    id: decoded.userId,
                    email: decoded.email,
                    role: decoded.role,
                    organizationId: decoded.organizationId,
                    permissions: decoded.permissions || []
                };
                
                logger.info('Optional JWT authentication successful', {
                    userId: req.user.id,
                    requestId: req.requestId
                });
            } catch (jwtError) {
                // Token is invalid, but that's okay for optional auth
                logger.debug('Optional JWT verification failed', {
                    error: jwtError.message,
                    requestId: req.requestId
                });
            }
        }
        
        return next();
    } catch (error) {
        logger.error('Optional authentication middleware error', {
            error: error.message,
            requestId: req.requestId
        });
        
        // Don't fail the request for optional auth errors
        return next();
    }
};

/**
 * Role-based Authorization Middleware
 * Requires specific roles to access the endpoint
 * 
 * @param {Array<string>} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
const requireRole = (allowedRoles = []) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                logger.warn('Role authorization attempted without authentication', {
                    requestId: req.requestId,
                    ip: req.ip
                });
                
                return apiResponse.unauthorized(res, 'Authentication required');
            }

            const userRole = req.user.role;
            
            if (!allowedRoles.includes(userRole)) {
                logger.warn('Role authorization failed', {
                    userId: req.user.id,
                    userRole,
                    allowedRoles,
                    requestId: req.requestId
                });
                
                return apiResponse.forbidden(res, `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`);
            }

            logger.info('Role authorization successful', {
                userId: req.user.id,
                userRole,
                requestId: req.requestId
            });
            
            return next();
        } catch (error) {
            logger.error('Role authorization middleware error', {
                error: error.message,
                requestId: req.requestId
            });
            
            return apiResponse.error(res, 'Authorization error', 500);
        }
    };
};

/**
 * Permission-based Authorization Middleware
 * Requires specific permissions to access the endpoint
 * 
 * @param {Array<string>} requiredPermissions - Array of required permissions
 * @returns {Function} Express middleware function
 */
const requirePermission = (requiredPermissions = []) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return apiResponse.unauthorized(res, 'Authentication required');
            }

            const userPermissions = req.user.permissions || [];
            const hasPermission = requiredPermissions.every(permission => 
                userPermissions.includes(permission)
            );
            
            if (!hasPermission) {
                logger.warn('Permission authorization failed', {
                    userId: req.user.id,
                    userPermissions,
                    requiredPermissions,
                    requestId: req.requestId
                });
                
                return apiResponse.forbidden(res, `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`);
            }

            logger.info('Permission authorization successful', {
                userId: req.user.id,
                requiredPermissions,
                requestId: req.requestId
            });
            
            return next();
        } catch (error) {
            logger.error('Permission authorization middleware error', {
                error: error.message,
                requestId: req.requestId
            });
            
            return apiResponse.error(res, 'Authorization error', 500);
        }
    };
};

/**
 * Organization-based Authorization Middleware
 * Ensures user belongs to the required organization
 * 
 * @param {string} organizationIdParam - Request parameter containing organization ID
 * @returns {Function} Express middleware function
 */
const requireOrganization = (organizationIdParam = 'organizationId') => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return apiResponse.unauthorized(res, 'Authentication required');
            }

            const requestedOrgId = req.params[organizationIdParam];
            const userOrgId = req.user.organizationId;
            
            // Super admins can access any organization
            if (req.user.role === 'super_admin') {
                return next();
            }
            
            if (requestedOrgId && requestedOrgId !== userOrgId) {
                logger.warn('Organization authorization failed', {
                    userId: req.user.id,
                    userOrgId,
                    requestedOrgId,
                    requestId: req.requestId
                });
                
                return apiResponse.forbidden(res, 'Access denied to this organization');
            }

            return next();
        } catch (error) {
            logger.error('Organization authorization middleware error', {
                error: error.message,
                requestId: req.requestId
            });
            
            return apiResponse.error(res, 'Authorization error', 500);
        }
    };
};

/**
 * Generate JWT Token
 * Utility function to create JWT tokens
 * 
 * @param {Object} payload - Token payload
 * @param {Object} options - Token options
 * @returns {string} JWT token
 */
const generateToken = (payload, options = {}) => {
    const defaultOptions = {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'voidguard-ai-governance-suite',
        audience: 'voidguard-users'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        ...defaultOptions,
        ...options
    });
};

/**
 * Generate Refresh Token
 * Utility function to create refresh tokens
 * 
 * @param {Object} payload - Token payload
 * @returns {string} Refresh token
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
        issuer: 'voidguard-ai-governance-suite',
        audience: 'voidguard-users'
    });
};

/**
 * Verify Refresh Token
 * Utility function to verify refresh tokens
 * 
 * @param {string} refreshToken - Refresh token to verify
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (refreshToken) => {
    return jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
};

/**
 * VoidGuard Security Headers Middleware
 * Adds VoidGuard-specific security headers
 */
const voidguardSecurity = (req, res, next) => {
    // VoidGuard identification headers
    res.setHeader('X-VoidGuard-Framework', 'AI-Governance-Suite');
    res.setHeader('X-VoidGuard-Version', '1.0.0');
    res.setHeader('X-VoidGuard-Safety-Compliant', 'true');
    
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    next();
};

module.exports = {
    authenticate,
    optionalAuthenticate,
    requireRole,
    requirePermission,
    requireOrganization,
    generateToken,
    generateRefreshToken,
    verifyRefreshToken,
    voidguardSecurity
};