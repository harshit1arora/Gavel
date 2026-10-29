import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Gavel API',
      version: '1.0.0',
      description: 'API Documentation for Gavel AI Enterprise Platform',
    },
    servers: [
      {
        url: '/v1',
        description: 'V1 API',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: 'Bearer <api_key>',
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Generate from JSDoc in routes
};

export const swaggerSpec = swaggerJsdoc(options);
