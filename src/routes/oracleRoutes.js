/**
 * VoidGuard AI Governance Suite - Oracle Strategic Intelligence Routes
 * 
 * API routes for Oracle Strategic Intelligence functionality
 * 
 * @author Ricardo Amaral (Brevvi) <team@silverbullet.live>
 * @version 1.0.0
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, query, param, validationResult } = require('express-validator');
const OracleController = require('../controllers/OracleController');
const auth = require('../middleware/auth');
const { apiResponse } = require('../utils/responseHelpers');

const router = express.Router();

// Rate limiting for Oracle endpoints
const oracleRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many Oracle requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to all Oracle routes
router.use(oracleRateLimit);

// Validation middleware
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return apiResponse.validationError(res, errors.array());
    }
    next();
};

/**
 * @swagger
 * /api/v1/oracle/analyze:
 *   post:
 *     tags: [Oracle Strategic Intelligence]
 *     summary: Analyze strategic intelligence query
 *     description: Process a strategic query using Value-Void Axiom and Algorithm Microscope engines
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 1000
 *                 description: Strategic intelligence query to analyze
 *               options:
 *                 type: object
 *                 properties:
 *                   includeVisualization:
 *                     type: boolean
 *                     default: true
 *                   analysisDepth:
 *                     type: string
 *                     enum: [shallow, standard, deep]
 *                     default: standard
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OracleAnalysisResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/RateLimit'
 */
router.post('/analyze',
    auth.authenticate,
    [
        body('query')
            .trim()
            .isLength({ min: 5, max: 1000 })
            .withMessage('Query must be between 5 and 1000 characters'),
        body('options.includeVisualization')
            .optional()
            .isBoolean()
            .withMessage('includeVisualization must be a boolean'),
        body('options.analysisDepth')
            .optional()
            .isIn(['shallow', 'standard', 'deep'])
            .withMessage('analysisDepth must be one of: shallow, standard, deep')
    ],
    validateRequest,
    OracleController.analyzeQuery
);

/**
 * @swagger
 * /api/v1/oracle/batch-analyze:
 *   post:
 *     tags: [Oracle Strategic Intelligence]
 *     summary: Analyze multiple queries in batch
 *     description: Process multiple strategic queries efficiently
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - queries
 *             properties:
 *               queries:
 *                 type: array
 *                 maxItems: 10
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - query
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Unique identifier for the query
 *                     query:
 *                       type: string
 *                       minLength: 5
 *                       maxLength: 1000
 *     responses:
 *       200:
 *         description: Batch analysis completed
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/batch-analyze',
    auth.authenticate,
    auth.requireRole(['admin', 'enterprise_user']),
    [
        body('queries')
            .isArray({ max: 10 })
            .withMessage('Queries must be an array with maximum 10 items'),
        body('queries.*.id')
            .isString()
            .notEmpty()
            .withMessage('Each query must have a valid id'),
        body('queries.*.query')
            .trim()
            .isLength({ min: 5, max: 1000 })
            .withMessage('Each query must be between 5 and 1000 characters')
    ],
    validateRequest,
    OracleController.batchAnalyze
);

/**
 * @swagger
 * /api/v1/oracle/insights/{sessionId}:
 *   get:
 *     tags: [Oracle Strategic Intelligence]
 *     summary: Retrieve analysis insights
 *     description: Get detailed insights for a previous analysis session
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Analysis session identifier
 *       - in: query
 *         name: includeRaw
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include raw analysis data
 *     responses:
 *       200:
 *         description: Insights retrieved successfully
 *       404:
 *         description: Session not found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/insights/:sessionId',
    auth.authenticate,
    [
        param('sessionId')
            .isUUID()
            .withMessage('Session ID must be a valid UUID'),
        query('includeRaw')
            .optional()
            .isBoolean()
            .withMessage('includeRaw must be a boolean')
    ],
    validateRequest,
    OracleController.getInsights
);

/**
 * @swagger
 * /api/v1/oracle/templates:
 *   get:
 *     tags: [Oracle Strategic Intelligence]
 *     summary: Get analysis templates
 *     description: Retrieve available analysis templates for different use cases
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [strategic, operational, risk, innovation]
 *         description: Filter templates by category
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/templates',
    auth.authenticate,
    [
        query('category')
            .optional()
            .isIn(['strategic', 'operational', 'risk', 'innovation'])
            .withMessage('Category must be one of: strategic, operational, risk, innovation')
    ],
    validateRequest,
    OracleController.getTemplates
);

/**
 * @swagger
 * /api/v1/oracle/custom-models:
 *   post:
 *     tags: [Oracle Strategic Intelligence]
 *     summary: Create custom analysis model
 *     description: Train a custom Oracle model for enterprise-specific use cases
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - trainingData
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               trainingData:
 *                 type: array
 *                 minItems: 10
 *                 items:
 *                   type: object
 *                   properties:
 *                     input:
 *                       type: string
 *                     expectedOutput:
 *                       type: object
 *     responses:
 *       201:
 *         description: Custom model creation initiated
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/custom-models',
    auth.authenticate,
    auth.requireRole(['admin', 'enterprise_user']),
    [
        body('name')
            .trim()
            .isLength({ min: 3, max: 50 })
            .withMessage('Name must be between 3 and 50 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Description must be at most 500 characters'),
        body('trainingData')
            .isArray({ min: 10 })
            .withMessage('Training data must contain at least 10 examples')
    ],
    validateRequest,
    OracleController.createCustomModel
);

/**
 * @swagger
 * /api/v1/oracle/custom-models:
 *   get:
 *     tags: [Oracle Strategic Intelligence]
 *     summary: List custom models
 *     description: Get list of available custom Oracle models
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [training, ready, failed]
 *         description: Filter models by status
 *     responses:
 *       200:
 *         description: Models retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/custom-models',
    auth.authenticate,
    auth.requireRole(['admin', 'enterprise_user']),
    [
        query('status')
            .optional()
            .isIn(['training', 'ready', 'failed'])
            .withMessage('Status must be one of: training, ready, failed')
    ],
    validateRequest,
    OracleController.getCustomModels
);

/**
 * @swagger
 * /api/v1/oracle/health:
 *   get:
 *     tags: [Oracle Strategic Intelligence]
 *     summary: Get Oracle service health
 *     description: Check the health status of Oracle engines
 *     responses:
 *       200:
 *         description: Health status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                 engines:
 *                   type: object
 *                   properties:
 *                     axiom:
 *                       type: string
 *                     microscope:
 *                       type: string
 *                     aquarium:
 *                       type: string
 *                 version:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health',
    OracleController.getHealth
);

module.exports = router;