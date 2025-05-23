import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";

import { Constants, NodeEnv, Logger, setupSwagger } from "@utils";
import { router } from "@router";
import { ErrorHandling } from "@utils/errors";

const app = express();

// Set up request logger
if (Constants.NODE_ENV === NodeEnv.DEV) {
  app.use(morgan("tiny")); // Log requests only in development environments
}

// Set up request parsers
app.use(express.json()); // Parses application/json payloads request bodies
app.use(express.urlencoded({ extended: false })); // Parse application/x-www-form-urlencoded request bodies
app.use(cookieParser()); // Parse cookies

// Set up CORS
app.use(
  cors({
    origin: Constants.CORS_WHITELIST,
  })
);

app.use("/api", router);

// Setup Swagger documentation
setupSwagger(app);

app.use(ErrorHandling);

app.listen(Constants.PORT, () => {
  Logger.info(`Server listening on port ${Constants.PORT}`);
  Logger.info(
    `Swagger documentation available at http://localhost:${Constants.PORT}/api-docs`
  );
});
