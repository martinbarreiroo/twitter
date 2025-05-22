import { Request, Response, Router } from "express";
import HttpStatus from "http-status";
// express-async-errors is a module that handles async errors in express, don't forget import it in your new controllers
import "express-async-errors";

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: API health check
 */

export const healthRouter = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check API health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy and running properly
 *       500:
 *         description: Server error
 */
healthRouter.get("/", (req: Request, res: Response) => {
  return res.status(HttpStatus.OK).send();
});
