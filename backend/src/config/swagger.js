const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DSP Real Estate Investment API',
      version: '1.0.0',
      description:
        'A comprehensive RESTful API for the DSP Real Estate Investment platform. ' +
        'Provides endpoints for user authentication, property listings, investment tracking, ' +
        'portfolio analytics, property search, and third-party API integrations. ' +
        'Designed for real estate investors to discover properties, manage investments, ' +
        'and monitor portfolio performance.',
      contact: {
        name: 'DSP Real Estate Support',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from /api/auth/login',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for programmatic access',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication and user management' },
      { name: 'Properties', description: 'Property listings and management' },
      { name: 'Investments', description: 'Investment tracking and management' },
      { name: 'Search', description: 'Property search and saved searches' },
      { name: 'Dashboard', description: 'Portfolio dashboard and analytics' },
      { name: 'API Keys', description: 'API key management for programmatic access' },
      { name: 'API Integrations', description: 'Third-party API integration management' },
    ],
  },
  apis: [path.join(__dirname, '..', 'routes', '*.js')],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
