import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express, RequestHandler } from "express";

// Swagger definition
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Twitter Clone API",
    version: "1.0.0",
    description: "A Twitter Clone API with Express and Prisma",
    license: {
      name: "MIT",
      url: "https://choosealicense.com/licenses/mit/",
    },
    contact: {
      name: "API Support",
      url: "https://twitter.com",
      email: "support@twitter.com",
    },
  },
  servers: [
    {
      url: "http://localhost:8080",
      description: "Development server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ["./src/domains/*/controller/*.ts"],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

// Function to setup our docs
export const setupSwagger = (app: Express) => {
  // Route for swagger docs - using separate calls to avoid type conflicts
  const serveStatic = swaggerUi.serve as RequestHandler[];
  app.use("/api-docs", ...serveStatic);
  app.use("/api-docs", swaggerUi.setup(swaggerSpec));

  // Route to get the swagger specs as JSON
  app.get("/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log("Swagger docs available at /api-docs");
};
