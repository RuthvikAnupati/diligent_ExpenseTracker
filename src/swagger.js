const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Expense Tracker API',
      version: '1.0.0',
      description: 'A RESTful API for managing personal expenses with JSON file storage, category filtering, and totals aggregation.'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server'
      }
    ],
    components: {
      schemas: {
        Expense: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'd3b07384-d113-40e4-a727-e4324f92323e' },
            title: { type: 'string', example: 'Groceries' },
            amount: { type: 'number', example: 45.50 },
            category: { type: 'string', example: 'Food' },
            date: { type: 'string', format: 'date', example: '2026-08-02' }
          }
        },
        ExpenseInput: {
          type: 'object',
          required: ['title', 'amount', 'category'],
          properties: {
            title: { type: 'string', example: 'Groceries' },
            amount: { type: 'number', example: 45.50 },
            category: { type: 'string', example: 'Food' },
            date: { type: 'string', format: 'date', example: '2026-08-02' }
          }
        },
        TotalsResponse: {
          type: 'object',
          properties: {
            overallTotal: { type: 'number', example: 150.75 },
            byCategory: {
              type: 'object',
              additionalProperties: { type: 'number' },
              example: { Food: 45.50, Transport: 105.25 }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Invalid expense data provided.' }
          }
        }
      }
    }
  },
  apis: ['./src/app.js']
};

const specs = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));
}

module.exports = setupSwagger;
