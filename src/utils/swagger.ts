import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

// Get the current environment and port
const getServerConfig = () => {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const port = process.env.PORT || "8080";

  if (isDevelopment) {
    return [
      {
        url: `http://localhost:${port}`,
        description: "Development server",
      },
    ];
  } else {
    // Production environment (Render)
    return [
      {
        url: "https://twitter-latest-m355.onrender.com",
        description: "Production server",
      },
    ];
  }
};

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
  servers: getServerConfig(),
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
  // Always use TypeScript source files since JSDoc comments are stripped from compiled JS
  apis: ["./src/domains/*/controller/*.ts"],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

// Function to setup our docs
export const setupSwagger = (app: Express) => {
  // Route for swagger docs - using any to avoid type conflicts between packages
  app.use(
    "/api-docs",
    ...(swaggerUi.serve as any),
    swaggerUi.setup(swaggerSpec)
  );

  // Route to get the swagger specs as JSON
  app.get("/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log("Swagger docs available at /api-docs");
};
