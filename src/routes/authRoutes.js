/**
 * VoidGuard AI Governance Suite - Authentication Routes
 * 
 * Authentication and authorization API routes
 * 
 * @author Ricardo Amaral (Brevvi) <team@silverbullet.live>
 * @version 1.0.0
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const { 
    authenticate, 
    generateToken, 
    generateRefreshToken,
    verifyRefreshToken 
} = require('../middleware/auth');
const { apiResponse } = require('../utils/responseHelpers');
const winston = require('winston');

const router = express.Router();

// Initialize logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/auth-routes.log' }),
        new winston.transports.Console()
    ]
});

// Rate limiting for auth endpoints
const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 auth requests per windowMs
    message: { 
        error: 'Too many authentication attempts, please try again later',
        retryAfter: 15 * 60 // 15 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip
});

// Strict rate limiting for registration
const registrationRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 registration attempts per hour
    message: { 
        error: 'Too many registration attempts, please try again later',
        retryAfter: 60 * 60 // 1 hour in seconds
    }
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Authenticate user and get access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@silverbullet.live"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "secure_password_123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                         organizationId:
 *                           type: string
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/login', 
    authRateLimit,
    [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return apiResponse.validationError(res, errors.array());
            }

            const { email, password } = req.body;

            logger.info('Login attempt', { 
                email, 
                ip: req.ip, 
                userAgent: req.get('user-agent') 
            });

            // TODO: Replace with actual database lookup
            // For demo purposes, using hardcoded admin user
            const demoUsers = [
                {
                    id: 'user_admin_001',
                    email: 'admin@silverbullet.live',
                    passwordHash: await bcrypt.hash('voidguard_admin_2025', 12),
                    role: 'super_admin',
                    organizationId: 'org_silverbullet_001',
                    permissions: ['*'], // All permissions
                    name: 'Ricardo Amaral (Brevvi)',
                    isActive: true
                },
                {
                    id: 'user_demo_001',
                    email: 'demo@voidguard.ai',
                    passwordHash: await bcrypt.hash('demo_password_123', 12),
                    role: 'enterprise_user',
                    organizationId: 'org_demo_001',
                    permissions: ['oracle.analyze', 'oracle.templates', 'dashboard.view'],
                    name: 'Demo User',
                    isActive: true
                }
            ];

            const user = demoUsers.find(u => u.email === email);

            if (!user || !user.isActive) {
                logger.warn('Login failed - user not found or inactive', { email, ip: req.ip });
                return apiResponse.unauthorized(res, 'Invalid email or password');
            }

            const passwordValid = await bcrypt.compare(password, user.passwordHash);
            if (!passwordValid) {
                logger.warn('Login failed - invalid password', { email, ip: req.ip });
                return apiResponse.unauthorized(res, 'Invalid email or password');
            }

            // Generate tokens
            const tokenPayload = {
                userId: user.id,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId,
                permissions: user.permissions
            };

            const accessToken = generateToken(tokenPayload);
            const refreshToken = generateRefreshToken({ userId: user.id });

            // Remove sensitive information
            const userResponse = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organizationId: user.organizationId,
                permissions: user.permissions
            };

            logger.info('Login successful', { 
                userId: user.id, 
                role: user.role,
                organizationId: user.organizationId,
                ip: req.ip 
            });

            return apiResponse.success(res, {
                message: 'Login successful',
                data: {
                    user: userResponse,
                    accessToken,
                    refreshToken,
                    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
                }
            });

        } catch (error) {
            logger.error('Login error', { 
                error: error.message, 
                stack: error.stack,
                ip: req.ip 
            });
            
            return apiResponse.error(res, 'Login failed', 500);
        }
    }
);

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register new user (enterprise customers only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - organizationName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *                 minLength: 2
 *               organizationName:
 *                 type: string
 *                 minLength: 2
 *               inviteCode:
 *                 type: string
 *                 description: Enterprise invitation code
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation error or user already exists
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/register',
    registrationRateLimit,
    [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Valid email is required'),
        body('password')
            .isLength({ min: 8 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('Password must contain at least 8 characters with uppercase, lowercase, number and special character'),
        body('name')
            .isLength({ min: 2 })
            .trim()
            .withMessage('Name must be at least 2 characters'),
        body('organizationName')
            .isLength({ min: 2 })
            .trim()
            .withMessage('Organization name must be at least 2 characters'),
        body('inviteCode')
            .optional()
            .isLength({ min: 8 })
            .withMessage('Invalid invitation code')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return apiResponse.validationError(res, errors.array());
            }

            const { email, password, name, organizationName, inviteCode } = req.body;

            logger.info('Registration attempt', { 
                email, 
                organizationName, 
                ip: req.ip 
            });

            // TODO: Replace with actual database operations
            // For now, return a demo response

            const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const organizationId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Hash password
            const passwordHash = await bcrypt.hash(password, 12);

            // Create demo user object
            const newUser = {
                id: userId,
                email,
                name,
                role: 'enterprise_user',
                organizationId,
                organizationName,
                permissions: ['oracle.analyze', 'oracle.templates', 'dashboard.view'],
                isActive: true,
                createdAt: new Date().toISOString()
            };

            // Generate tokens
            const tokenPayload = {
                userId: newUser.id,
                email: newUser.email,
                role: newUser.role,
                organizationId: newUser.organizationId,
                permissions: newUser.permissions
            };

            const accessToken = generateToken(tokenPayload);
            const refreshToken = generateRefreshToken({ userId: newUser.id });

            logger.info('Registration successful', { 
                userId: newUser.id, 
                organizationId,
                ip: req.ip 
            });

            return apiResponse.success(res, {
                message: 'Registration successful',
                data: {
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        name: newUser.name,
                        role: newUser.role,
                        organizationId: newUser.organizationId,
                        permissions: newUser.permissions
                    },
                    accessToken,
                    refreshToken,
                    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
                }
            }, 201);

        } catch (error) {
            logger.error('Registration error', { 
                error: error.message, 
                stack: error.stack,
                ip: req.ip 
            });
            
            return apiResponse.error(res, 'Registration failed', 500);
        }
    }
);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token using refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh',
    [
        body('refreshToken')
            .notEmpty()
            .withMessage('Refresh token is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return apiResponse.validationError(res, errors.array());
            }

            const { refreshToken } = req.body;

            // Verify refresh token
            const decoded = verifyRefreshToken(refreshToken);

            // TODO: Check if refresh token is blacklisted in database
            // TODO: Get user information from database

            // For demo purposes, create token payload
            const tokenPayload = {
                userId: decoded.userId,
                email: 'admin@silverbullet.live', // TODO: Get from database
                role: 'super_admin',
                organizationId: 'org_silverbullet_001',
                permissions: ['*']
            };

            const newAccessToken = generateToken(tokenPayload);
            const newRefreshToken = generateRefreshToken({ userId: decoded.userId });

            logger.info('Token refreshed successfully', { userId: decoded.userId });

            return apiResponse.success(res, {
                message: 'Token refreshed successfully',
                data: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
                }
            });

        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                logger.warn('Invalid refresh token', { error: error.message });
                return apiResponse.unauthorized(res, 'Invalid or expired refresh token');
            }

            logger.error('Token refresh error', { 
                error: error.message, 
                stack: error.stack 
            });
            
            return apiResponse.error(res, 'Token refresh failed', 500);
        }
    }
);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/profile', authenticate, async (req, res) => {
    try {
        const user = req.user;

        logger.info('Profile retrieved', { userId: user.id });

        return apiResponse.success(res, {
            message: 'Profile retrieved successfully',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    organizationId: user.organizationId,
                    permissions: user.permissions
                }
            }
        });

    } catch (error) {
        logger.error('Profile retrieval error', { 
            error: error.message,
            userId: req.user?.id 
        });
        
        return apiResponse.error(res, 'Failed to retrieve profile', 500);
    }
});

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout user (blacklist refresh token)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Authentication required
 */
router.post('/logout', authenticate, async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const userId = req.user.id;

        // TODO: Add refresh token to blacklist in database

        logger.info('User logged out', { userId });

        return apiResponse.success(res, {
            message: 'Logout successful',
            data: {
                loggedOut: true,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Logout error', { 
            error: error.message,
            userId: req.user?.id 
        });
        
        return apiResponse.error(res, 'Logout failed', 500);
    }
});

module.exports = router;