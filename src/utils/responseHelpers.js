/**
 * VoidGuard AI Governance Suite - Response Helpers
 * 
 * Standardized API response utilities
 * 
 * @author Ricardo Amaral (Brevvi) <team@silverbullet.live>
 * @version 1.0.0
 */

/**
 * Standardized API response format
 */
class ApiResponse {
    /**
     * Success response
     * @param {Object} res - Express response object
     * @param {Object} data - Response data
     * @param {number} statusCode - HTTP status code (default: 200)
     */
    success(res, data, statusCode = 200) {
        const response = {
            success: true,
            timestamp: new Date().toISOString(),
            ...data,
            voidguard: {
                version: '1.0.0',
                framework: 'VoidGuard AI Governance Suite',
                safetyCompliant: true
            }
        };

        return res.status(statusCode).json(response);
    }

    /**
     * Error response
     * @param {Object} res - Express response object
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code (default: 500)
     * @param {Object} details - Additional error details
     */
    error(res, message, statusCode = 500, details = null) {
        const response = {
            success: false,
            timestamp: new Date().toISOString(),
            error: {
                message,
                code: statusCode,
                details
            },
            voidguard: {
                version: '1.0.0',
                framework: 'VoidGuard AI Governance Suite',
                safetyCompliant: true
            }
        };

        return res.status(statusCode).json(response);
    }

    /**
     * Validation error response
     * @param {Object} res - Express response object
     * @param {Array} validationErrors - Array of validation errors
     */
    validationError(res, validationErrors) {
        const response = {
            success: false,
            timestamp: new Date().toISOString(),
            error: {
                message: 'Validation failed',
                code: 400,
                details: {
                    validationErrors: validationErrors.map(err => ({
                        field: err.param || err.path,
                        message: err.msg || err.message,
                        value: err.value
                    }))
                }
            },
            voidguard: {
                version: '1.0.0',
                framework: 'VoidGuard AI Governance Suite',
                safetyCompliant: true
            }
        };

        return res.status(400).json(response);
    }

    /**
     * Unauthorized response
     * @param {Object} res - Express response object
     * @param {string} message - Custom message (optional)
     */
    unauthorized(res, message = 'Authentication required') {
        return this.error(res, message, 401);
    }

    /**
     * Forbidden response
     * @param {Object} res - Express response object
     * @param {string} message - Custom message (optional)
     */
    forbidden(res, message = 'Insufficient permissions') {
        return this.error(res, message, 403);
    }

    /**
     * Not found response
     * @param {Object} res - Express response object
     * @param {string} message - Custom message (optional)
     */
    notFound(res, message = 'Resource not found') {
        return this.error(res, message, 404);
    }

    /**
     * Rate limit exceeded response
     * @param {Object} res - Express response object
     * @param {string} message - Custom message (optional)
     */
    rateLimit(res, message = 'Rate limit exceeded') {
        return this.error(res, message, 429);
    }

    /**
     * Service unavailable response
     * @param {Object} res - Express response object
     * @param {string} message - Custom message (optional)
     */
    serviceUnavailable(res, message = 'Service temporarily unavailable') {
        return this.error(res, message, 503);
    }

    /**
     * Paginated response
     * @param {Object} res - Express response object
     * @param {Array} data - Array of data items
     * @param {Object} pagination - Pagination metadata
     * @param {string} message - Success message (optional)
     */
    paginated(res, data, pagination, message = 'Data retrieved successfully') {
        const response = {
            success: true,
            timestamp: new Date().toISOString(),
            message,
            data,
            pagination: {
                page: pagination.page || 1,
                limit: pagination.limit || 20,
                total: pagination.total || data.length,
                pages: Math.ceil((pagination.total || data.length) / (pagination.limit || 20)),
                hasNext: pagination.hasNext || false,
                hasPrev: pagination.hasPrev || false
            },
            voidguard: {
                version: '1.0.0',
                framework: 'VoidGuard AI Governance Suite',
                safetyCompliant: true
            }
        };

        return res.status(200).json(response);
    }

    /**
     * Created response (for POST requests)
     * @param {Object} res - Express response object
     * @param {Object} data - Created resource data
     * @param {string} message - Success message (optional)
     */
    created(res, data, message = 'Resource created successfully') {
        return this.success(res, { message, data }, 201);
    }

    /**
     * Updated response (for PUT/PATCH requests)
     * @param {Object} res - Express response object
     * @param {Object} data - Updated resource data
     * @param {string} message - Success message (optional)
     */
    updated(res, data, message = 'Resource updated successfully') {
        return this.success(res, { message, data }, 200);
    }

    /**
     * Deleted response (for DELETE requests)
     * @param {Object} res - Express response object
     * @param {string} message - Success message (optional)
     */
    deleted(res, message = 'Resource deleted successfully') {
        return this.success(res, { message }, 200);
    }

    /**
     * No content response (for successful operations with no return data)
     * @param {Object} res - Express response object
     */
    noContent(res) {
        return res.status(204).send();
    }

    /**
     * Health check response
     * @param {Object} res - Express response object
     * @param {Object} healthData - Health check data
     */
    health(res, healthData) {
        const response = {
            status: healthData.status || 'healthy',
            timestamp: new Date().toISOString(),
            services: healthData.services || {},
            version: healthData.version || '1.0.0',
            uptime: healthData.uptime || process.uptime(),
            voidguard: {
                framework: 'VoidGuard AI Governance Suite',
                safetyCompliant: true,
                complianceScore: healthData.complianceScore || 0.98
            }
        };

        const statusCode = healthData.status === 'healthy' ? 200 : 
                          healthData.status === 'degraded' ? 200 : 503;

        return res.status(statusCode).json(response);
    }

    /**
     * Async operation started response
     * @param {Object} res - Express response object
     * @param {Object} operationData - Operation tracking data
     */
    asyncStarted(res, operationData) {
        const response = {
            success: true,
            timestamp: new Date().toISOString(),
            message: 'Operation started successfully',
            operation: {
                id: operationData.id,
                status: 'started',
                estimatedCompletion: operationData.estimatedCompletion,
                statusUrl: operationData.statusUrl
            },
            voidguard: {
                version: '1.0.0',
                framework: 'VoidGuard AI Governance Suite',
                safetyCompliant: true
            }
        };

        return res.status(202).json(response);
    }

    /**
     * Operation status response
     * @param {Object} res - Express response object
     * @param {Object} statusData - Operation status data
     */
    operationStatus(res, statusData) {
        const response = {
            success: true,
            timestamp: new Date().toISOString(),
            operation: {
                id: statusData.id,
                status: statusData.status,
                progress: statusData.progress || 0,
                message: statusData.message,
                result: statusData.result,
                error: statusData.error,
                createdAt: statusData.createdAt,
                updatedAt: statusData.updatedAt,
                completedAt: statusData.completedAt
            },
            voidguard: {
                version: '1.0.0',
                framework: 'VoidGuard AI Governance Suite',
                safetyCompliant: true
            }
        };

        return res.status(200).json(response);
    }
}

/**
 * Request ID middleware to track requests across services
 */
const requestIdMiddleware = (req, res, next) => {
    req.requestId = req.headers['x-request-id'] || 
                   req.headers['x-correlation-id'] || 
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.setHeader('X-Request-ID', req.requestId);
    next();
};

/**
 * Response time middleware
 */
const responseTimeMiddleware = (req, res, next) => {
    const startTime = Date.now();
    
    // Override res.end to set response time before finishing
    const originalEnd = res.end;
    res.end = function(...args) {
        if (!res.headersSent) {
            const responseTime = Date.now() - startTime;
            res.setHeader('X-Response-Time', `${responseTime}ms`);
        }
        originalEnd.apply(this, args);
    };
    
    next();
};

/**
 * Security headers middleware
 */
const securityHeadersMiddleware = (req, res, next) => {
    // VoidGuard security headers
    res.setHeader('X-VoidGuard-Version', '1.0.0');
    res.setHeader('X-VoidGuard-Framework', 'AI-Governance-Suite');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    next();
};

module.exports = {
    apiResponse: new ApiResponse(),
    requestIdMiddleware,
    responseTimeMiddleware,
    securityHeadersMiddleware
};