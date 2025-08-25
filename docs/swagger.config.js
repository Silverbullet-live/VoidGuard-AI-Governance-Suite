/**
 * VoidGuard AI Governance Suite - Swagger Configuration
 * 
 * Swagger JSDoc configuration for API documentation generation
 * 
 * @author Ricardo Amaral (Brevvi) <team@silverbullet.live>
 * @version 1.0.0
 */

const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

// Swagger definition
const swaggerDefinition = {
    openapi: '3.0.3',
    info: {
        title: 'VoidGuard AI Governance Suite API',
        version: '1.0.0',
        description: `
# VoidGuard AI Governance Suite API

Complete Enterprise AI Safety & Governance Platform

The VoidGuard AI Governance Suite provides comprehensive AI governance, safety monitoring, 
strategic intelligence analysis, and voice-enabled corporate assistance through a unified API.

## Suite Components

1. **Oracle Strategic Intelligence** - AI consciousness analysis for strategic decision-making
2. **VoidGuard Enterprise Dashboard** - Centralized AI governance and compliance monitoring  
3. **Alo Corporate Suite** - Enterprise voice assistant for communication management
4. **Algorithm Transparency Engine** - AI system auditing and bias detection

## Authentication

All API endpoints require authentication using Bearer tokens (JWT).
Enterprise SSO integration available for SAML and OAuth providers.

## Rate Limiting

- Standard users: 100 requests per 15 minutes
- Enterprise users: 1000 requests per 15 minutes
- Admin users: Unlimited (with fair usage policy)

## VoidGuard Safety Framework

All API responses include VoidGuard safety metadata ensuring:
- ✅ Human Control & Agent Autonomy
- ✅ Transparency in Agent Behavior  
- ✅ Ethical Guidelines Integration
- ✅ Human Values Validation
- ✅ Privacy Protection
- ✅ Secure Interactions

---

**Created by:** Ricardo Amaral (Brevvi) - Silverbullet Research  
**Founded:** July 18, 2025
        `,
        contact: {
            name: 'Ricardo Amaral (Brevvi) - Silverbullet Research',
            email: 'team@silverbullet.live',
            url: 'https://silverbullet.live'
        },
        license: {
            name: 'Proprietary',
            url: 'https://voidguard.ai/license'
        },
        termsOfService: 'https://voidguard.ai/terms'
    },
    servers: [
        {
            url: 'https://api.voidguard.ai/v1',
            description: 'Production server'
        },
        {
            url: 'https://staging-api.voidguard.ai/v1',
            description: 'Staging server'
        },
        {
            url: 'http://localhost:3000/api/v1',
            description: 'Development server'
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT token for API authentication'
            },
            apiKeyAuth: {
                type: 'apiKey',
                in: 'header',
                name: 'X-API-Key',
                description: 'API key for service-to-service authentication'
            }
        },
        responses: {
            Success: {
                description: 'Operation successful',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                success: {
                                    type: 'boolean',
                                    example: true
                                },
                                timestamp: {
                                    type: 'string',
                                    format: 'date-time'
                                },
                                message: {
                                    type: 'string'
                                },
                                data: {
                                    type: 'object'
                                },
                                voidguard: {
                                    $ref: '#/components/schemas/VoidGuardMetadata'
                                }
                            }
                        }
                    }
                }
            },
            BadRequest: {
                description: 'Bad request - validation error',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                success: {
                                    type: 'boolean',
                                    example: false
                                },
                                timestamp: {
                                    type: 'string',
                                    format: 'date-time'
                                },
                                error: {
                                    type: 'object',
                                    properties: {
                                        message: {
                                            type: 'string',
                                            example: 'Validation failed'
                                        },
                                        code: {
                                            type: 'integer',
                                            example: 400
                                        },
                                        details: {
                                            type: 'object'
                                        }
                                    }
                                },
                                voidguard: {
                                    $ref: '#/components/schemas/VoidGuardMetadata'
                                }
                            }
                        }
                    }
                }
            },
            Unauthorized: {
                description: 'Authentication required',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                success: {
                                    type: 'boolean',
                                    example: false
                                },
                                error: {
                                    type: 'object',
                                    properties: {
                                        message: {
                                            type: 'string',
                                            example: 'Authentication required'
                                        },
                                        code: {
                                            type: 'integer',
                                            example: 401
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            Forbidden: {
                description: 'Insufficient permissions',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                success: {
                                    type: 'boolean',
                                    example: false
                                },
                                error: {
                                    type: 'object',
                                    properties: {
                                        message: {
                                            type: 'string',
                                            example: 'Insufficient permissions'
                                        },
                                        code: {
                                            type: 'integer',
                                            example: 403
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            RateLimit: {
                description: 'Rate limit exceeded',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                success: {
                                    type: 'boolean',
                                    example: false
                                },
                                error: {
                                    type: 'object',
                                    properties: {
                                        message: {
                                            type: 'string',
                                            example: 'Rate limit exceeded'
                                        },
                                        code: {
                                            type: 'integer',
                                            example: 429
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        schemas: {
            VoidGuardMetadata: {
                type: 'object',
                description: 'VoidGuard AI Safety Framework metadata',
                properties: {
                    version: {
                        type: 'string',
                        example: '1.0.0'
                    },
                    framework: {
                        type: 'string',
                        example: 'VoidGuard AI Governance Suite'
                    },
                    safetyCompliant: {
                        type: 'boolean',
                        example: true
                    },
                    complianceScore: {
                        type: 'number',
                        format: 'float',
                        minimum: 0,
                        maximum: 1,
                        example: 0.98
                    }
                }
            }
        }
    },
    security: [
        {
            bearerAuth: []
        }
    ],
    tags: [
        {
            name: 'Authentication',
            description: 'User authentication and authorization'
        },
        {
            name: 'Oracle Strategic Intelligence',
            description: 'AI consciousness analysis and strategic intelligence'
        },
        {
            name: 'VoidGuard Safety',
            description: 'AI safety validation and compliance monitoring'
        },
        {
            name: 'Alo Voice Suite',
            description: 'Enterprise voice assistant and communication management'
        },
        {
            name: 'Algorithm Transparency',
            description: 'AI system auditing and transparency analysis'
        },
        {
            name: 'Admin',
            description: 'Administrative operations and system management'
        }
    ]
};

// Options for the swagger docs
const options = {
    swaggerDefinition,
    apis: [
        path.join(__dirname, '../src/routes/*.js'),
        path.join(__dirname, '../src/controllers/*.js'),
        path.join(__dirname, '../src/models/*.js'),
        path.join(__dirname, './openapi.yml')
    ],
    explorer: true
};

// Initialize swagger-jsdoc
const specs = swaggerJSDoc(options);

// Swagger UI options
const swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
        tryItOutEnabled: true,
        requestInterceptor: (req) => {
            // Add custom headers for VoidGuard
            req.headers['X-VoidGuard-Client'] = 'swagger-ui';
            req.headers['X-VoidGuard-Version'] = '1.0.0';
            return req;
        }
    },
    customCss: `
        .swagger-ui .topbar { 
            background-color: #1a1a2e; 
        }
        .swagger-ui .topbar-wrapper::before {
            content: "🛡️ VoidGuard AI Governance Suite API Documentation";
            color: #64ffda;
            font-size: 16px;
            font-weight: bold;
        }
        .swagger-ui .topbar-wrapper .link {
            display: none;
        }
        .swagger-ui .info .title {
            color: #64ffda;
        }
        .swagger-ui .scheme-container {
            background: #f8f9fa;
            border: 1px solid #64ffda;
        }
    `,
    customSiteTitle: 'VoidGuard AI Governance Suite API',
    customfavIcon: '/favicon.ico'
};

/**
 * Setup Swagger documentation middleware
 * @param {Express} app - Express application instance
 */
function setupSwagger(app) {
    // Serve swagger docs
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));
    
    // Serve OpenAPI JSON
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(specs);
    });

    // Serve OpenAPI YAML
    app.get('/api-docs.yml', (req, res) => {
        res.setHeader('Content-Type', 'application/x-yaml');
        const yaml = require('js-yaml');
        res.send(yaml.dump(specs));
    });

    // API documentation home redirect
    app.get('/docs', (req, res) => {
        res.redirect('/api-docs');
    });

    console.log('📚 API Documentation available at:');
    console.log('   - Swagger UI: /api-docs');
    console.log('   - OpenAPI JSON: /api-docs.json');
    console.log('   - OpenAPI YAML: /api-docs.yml');
}

module.exports = {
    specs,
    setupSwagger,
    swaggerUiOptions
};