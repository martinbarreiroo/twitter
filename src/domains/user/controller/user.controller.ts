import { Request, Response, Router } from "express";
import HttpStatus from "http-status";
// express-async-errors is a module that handles async errors in express, don't forget import it in your new controllers
import "express-async-errors";

import { db } from "@utils";

import { UserRepositoryImpl } from "../repository";
import { UserService, UserServiceImpl } from "../service";

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: User ID
 *         email:
 *           type: string
 *           format: email
 *           description: User email
 *         username:
 *           type: string
 *           description: Username
 *         name:
 *           type: string
 *           description: User display name
 *         isPrivate:
 *           type: boolean
 *           description: Whether the profile is private
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     PrivacyUpdate:
 *       type: object
 *       required:
 *         - isPrivate
 *       properties:
 *         isPrivate:
 *           type: boolean
 *           description: Privacy setting (true for private, false for public)
 *     PaginationParams:
 *       type: object
 *       properties:
 *         limit:
 *           type: integer
 *           description: Maximum number of users to return
 *         skip:
 *           type: integer
 *           description: Number of users to skip
 */

export const userRouter = Router();

// Use dependency injection
const service: UserService = new UserServiceImpl(new UserRepositoryImpl(db));

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Get user recommendations
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of users to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *         description: Number of users to skip
 *     responses:
 *       200:
 *         description: List of recommended users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
userRouter.get("/", async (req: Request, res: Response) => {
  const { userId } = res.locals.context;
  const { limit, skip } = req.query as Record<string, string>;

  const users = await service.getUserRecommendations(userId, {
    limit: Number(limit),
    skip: Number(skip),
  });

  return res.status(HttpStatus.OK).json(users);
});

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
userRouter.get("/me", async (req: Request, res: Response) => {
  const { userId } = res.locals.context;

  const user = await service.getUser(userId);

  return res.status(HttpStatus.OK).json(user);
});

/**
 * @swagger
 * /api/user/{userId}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user to fetch
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - private account
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
userRouter.get("/:userId", async (req: Request, res: Response) => {
  const { userId: otherUserId } = req.params;

  const user = await service.getUser(otherUserId);

  return res.status(HttpStatus.OK).json(user);
});

/**
 * @swagger
 * /api/user:
 *   delete:
 *     summary: Delete current user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
userRouter.delete("/", async (req: Request, res: Response) => {
  const { userId } = res.locals.context;

  await service.deleteUser(userId);

  return res.status(HttpStatus.OK);
});

/**
 * @swagger
 * /api/user/privacy:
 *   patch:
 *     summary: Update privacy settings
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PrivacyUpdate'
 *     responses:
 *       200:
 *         description: Privacy settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// New endpoint to toggle privacy settings
userRouter.patch("/privacy", async (req: Request, res: Response) => {
  const { userId } = res.locals.context;
  const { isPrivate } = req.body as { isPrivate: boolean };

  await service.updatePrivacy(userId, isPrivate);

  const updatedUser = await service.getUser(userId);

  return res.status(HttpStatus.OK).json({
    message: "Privacy settings updated successfully",
    user: updatedUser,
  });
});
