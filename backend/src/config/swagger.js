const swaggerJSDoc = require("swagger-jsdoc");
const path = require("path");

// Swagger definition
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Employee Leave Management System API",
    version: "1.0.0",
    description:
      "Production-ready REST API documentation for the Employee Leave Management System.",
    contact: {
      name: "Backend Engineering Team",
      email: "hello@gcu.in",
    },
  },
  servers: [
    {
      url:
        process.env.NODE_ENV === "production"
          ? "https://employee-leave-api-62a7.onrender.com"
          : "http://localhost:5000",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token in the format: Bearer <JWT-token>",
      },
    },
  },
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  // Path to the API docs (where JSDoc comments reside)
  apis: [path.join(__dirname, "../routes/*.js")],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
