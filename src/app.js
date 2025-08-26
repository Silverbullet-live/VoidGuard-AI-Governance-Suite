/**
 * VoidGuard AI Governance Suite - Main Application
 * 
 * Complete Enterprise AI Safety & Governance Platform
 * Created by Ricardo Amaral (Brevvi) - Silverbullet Research
 * 
 * @author Ricardo Amaral (Brevvi) <team@silverbullet.live>
 * @version 1.0.0
 * @since July 18, 2025
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

// Import middleware
const { 
    requestIdMiddleware, 
    responseTimeMiddleware, 
    securityHeadersMiddleware,
    apiResponse 
} = require('./utils/responseHelpers');
const { voidguardSecurity } = require('./middleware/auth');

// Import routes
const oracleRoutes = require('./routes/oracleRoutes');
const authRoutes = require('./routes/authRoutes');

// Import documentation
const { setupSwagger } = require('../docs/swagger.config');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/app.log' }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// =============================================================================
// MIDDLEWARE SETUP
// =============================================================================

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Request tracking and security
app.use(requestIdMiddleware);
app.use(responseTimeMiddleware);
app.use(voidguardSecurity);
app.use(securityHeadersMiddleware);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.CORS_ORIGINS ? 
            process.env.CORS_ORIGINS.split(',') : 
            ['http://localhost:3000', 'http://localhost:3001'];
        
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
        'X-Request-ID',
        'X-VoidGuard-Component'
    ]
};

if (process.env.ENABLE_CORS === 'true') {
    app.use(cors(corsOptions));
}

// Compression and parsing
app.use(compression());
app.use(express.json({ 
    limit: '10mb',
    type: ['application/json', 'application/vnd.api+json']
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => {
        // Dynamic rate limiting based on user role
        if (req.user) {
            switch (req.user.role) {
                case 'super_admin':
                case 'admin':
                    return 1000; // Admin users: 1000 requests per 15min
                case 'enterprise_user':
                    return 500;  // Enterprise users: 500 requests per 15min
                default:
                    return 100;  // Standard users: 100 requests per 15min
            }
        }
        return 50; // Unauthenticated: 50 requests per 15min
    },
    message: (req) => ({
        success: false,
        error: {
            message: 'Rate limit exceeded. Please try again later.',
            code: 429,
            details: {
                windowMs: 15 * 60 * 1000,
                maxRequests: req.rateLimit?.limit || 50
            }
        },
        voidguard: {
            version: '1.0.0',
            framework: 'VoidGuard AI Governance Suite',
            safetyCompliant: true
        }
    }),
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use user ID for authenticated requests, IP for others
        return req.user ? `user_${req.user.id}` : req.ip;
    }
});

app.use(limiter);

// =============================================================================
// ROUTES SETUP
// =============================================================================

// Health check endpoint (no authentication required)
app.get('/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            oracle: 'operational',
            voidguard: 'operational',
            voice: 'not_implemented',
            transparency: 'not_implemented',
            database: 'not_connected',
            redis: 'not_connected'
        },
        version: '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
    };

    return apiResponse.health(res, health);
});

// API documentation
setupSwagger(app);

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/oracle', oracleRoutes);

// TODO: Add other route modules
// app.use('/api/v1/dashboard', dashboardRoutes);
// app.use('/api/v1/voice', voiceRoutes);
// app.use('/api/v1/transparency', transparencyRoutes);
// app.use('/api/v1/admin', adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
    return apiResponse.success(res, {
        message: 'Welcome to VoidGuard AI Governance Suite',
        data: {
            version: '1.0.0',
            description: 'Complete Enterprise AI Safety & Governance Platform',
            author: 'Ricardo Amaral (Brevvi) - Silverbullet Research',
            founded: 'July 18, 2025',
            components: [
                'Oracle Strategic Intelligence',
                'VoidGuard Enterprise Dashboard',
                'Alo Corporate Suite',
                'Algorithm Transparency Engine'
            ],
            documentation: '/api-docs',
            health: '/health',
            endpoints: {
                oracle: '/api/v1/oracle',
                dashboard: '/api/v1/dashboard (coming soon)',
                voice: '/api/v1/voice (coming soon)',
                transparency: '/api/v1/transparency (coming soon)',
                auth: '/api/v1/auth (coming soon)',
                admin: '/api/v1/admin (coming soon)'
            }
        }
    });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use('*', (req, res) => {
    logger.warn('Route not found', {
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.requestId
    });
    
    return apiResponse.notFound(res, `Route ${req.method} ${req.originalUrl} not found`);
});

// Global error handler
app.use((error, req, res, next) => {
    logger.error('Unhandled application error', {
        error: error.message,
        stack: error.stack,
        method: req.method,
        path: req.originalUrl,
        requestId: req.requestId,
        userId: req.user?.id
    });

    // Handle specific error types
    if (error.name === 'ValidationError') {
        return apiResponse.validationError(res, [{ message: error.message }]);
    }

    if (error.name === 'UnauthorizedError') {
        return apiResponse.unauthorized(res, error.message);
    }

    if (error.type === 'entity.parse.failed') {
        return apiResponse.error(res, 'Invalid JSON payload', 400);
    }

    if (error.type === 'entity.too.large') {
        return apiResponse.error(res, 'Request entity too large', 413);
    }

    // Default error response
    return apiResponse.error(res, 
        process.env.NODE_ENV === 'production' ? 
            'Internal server error' : 
            error.message, 
        500
    );
});

// =============================================================================
// SERVER STARTUP
// =============================================================================

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    server.close(() => {
        logger.info('HTTP server closed.');
        
        // Close database connections, Redis connections, etc.
        // TODO: Add cleanup for database and Redis connections
        
        process.exit(0);
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
        logger.error('Forcing shutdown after timeout');
        process.exit(1);
    }, 30000);
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at Promise', {
        promise: promise,
        reason: reason
    });
    // Don't exit in production, just log the error
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack
    });
    process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`
🛡️  VoidGuard AI Governance Suite v1.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 Server running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📚 API Documentation: http://localhost:${PORT}/api-docs
💚 Health Check: http://localhost:${PORT}/health

📡 Available Endpoints:
   • Oracle Strategic Intelligence: /api/v1/oracle
   • VoidGuard Dashboard: /api/v1/dashboard (coming soon)
   • Alo Voice Suite: /api/v1/voice (coming soon)  
   • Algorithm Transparency: /api/v1/transparency (coming soon)

🧬 Suite Components:
   ✅ Oracle Strategic Intelligence (Value-Void Axiom)
   ✅ VoidGuard Safety Framework  
   🏗️  Alo Corporate Suite (architecture ready)
   🏗️  Algorithm Transparency Engine (architecture ready)

👨‍💻 Created by: Ricardo Amaral (Brevvi) - Silverbullet Research
📅 Founded: July 18, 2025
🔗 Contact: team@silverbullet.live

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
    
    logger.info('VoidGuard AI Governance Suite started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

module.exports = app;