const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Manga Management System API',
      version: '1.0.0',
      description: 'API documentation for Manga Management System Backend',
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste your JWT token here (get it from POST /api/auth/login)',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 10 },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication' },
      { name: 'Users', description: 'User management' },
      { name: 'Uploads', description: 'File uploads via Cloudinary' },
      { name: 'Series', description: 'Series management' },
      { name: 'Chapters', description: 'Chapter management' },
      { name: 'Pages', description: 'Page management' },
      { name: 'Page Regions', description: 'Page region management' },
      { name: 'Page Tasks', description: 'Task management' },
      { name: 'Page Task Feedbacks', description: 'Task feedback' },
      { name: 'Annotations', description: 'Annotations on pages/regions' },
      { name: 'Manuscripts', description: 'Manuscript management' },
      { name: 'Manuscript Files', description: 'Manuscript file uploads' },
      { name: 'Review Sessions', description: 'Review session management' },
      { name: 'Votes', description: 'Voting' },
      { name: 'Ranking Periods', description: 'Ranking periods' },
      { name: 'Rankings', description: 'Ranking calculation & board' },
      { name: 'Notifications', description: 'Notifications' },
      { name: 'Dashboard', description: 'Dashboard stats' },
      { name: 'Mangaka', description: 'Mangaka role APIs' },
      { name: 'Assistant', description: 'Assistant role APIs' },
      { name: 'Editor', description: 'Editor role APIs' },
      { name: 'Board', description: 'Editorial Board APIs' },
      { name: 'Admin', description: 'Admin management APIs' },
      { name: 'Internal', description: 'Internal notification service' },
      { name: 'AI Assistant', description: 'AI-powered manga analysis (Panel Detection, Smart Coloring)' },
    ],
  },
  apis: ['./src/modules/**/*.routes.js', './src/docs/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
