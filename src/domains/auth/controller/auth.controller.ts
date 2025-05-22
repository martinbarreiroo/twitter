import { Request, Response, Router } from "express";
import HttpStatus from "http-status";
// express-async-errors is a module that handles async errors in express, don't forget import it in your new controllers
import "express-async-errors";

import { db, BodyValidation } from "@utils";
import { UserRepositoryImpl } from "@domains/user/repository";

import { AuthService, AuthServiceImpl } from "../service";
import { LoginInputDTO, SignupInputDTO } from "../dto";

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SignupInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - username
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email
 *         password:
 *           type: string
 *           format: password
 *           description: User password
 *         username:
 *           type: string
 *           description: User's unique username
 *         name:
 *           type: string
 *           description: User's display name
 *     LoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email
 *         password:
 *           type: string
 *           format: password
 *           description: User password
 *     AuthToken:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT authentication token
 */

export const authRouter = Router();

// Use dependency injection
const service: AuthService = new AuthServiceImpl(new UserRepositoryImpl(db));

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupInput'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthToken'
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Email or username already exists
 *       500:
 *         description: Server error
 */
authRouter.post(
  "/signup",
  BodyValidation(SignupInputDTO),
  async (req: Request, res: Response) => {
    const data = req.body;

    const token = await service.signup(data);

    return res.status(HttpStatus.CREATED).json(token);
  }
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthToken'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
authRouter.post(
  "/login",
  BodyValidation(LoginInputDTO),
  async (req: Request, res: Response) => {
    const data = req.body;

    const token = await service.login(data);

    return res.status(HttpStatus.OK).json(token);
  }
);
