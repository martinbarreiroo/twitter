import { Request, Response, Router } from "express";
import HttpStatus from "http-status";
// express-async-errors is a module that handles async errors in express, don't forget import it in your new controllers
import "express-async-errors";

import { db } from "@utils";

import { UserRepositoryImpl } from "../repository";
import { UserService, UserServiceImpl } from "../service";
import { ImageUploadRequestDTO } from "../dto";

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
 *         profilePicture:
 *           type: string
 *           nullable: true
 *           description: S3 key for the user's profile picture
 *         likesCount:
 *           type: integer
 *           description: Number of likes the user has made
 *         retweetsCount:
 *           type: integer
 *           description: Number of retweets the user has made
 *         commentsCount:
 *           type: integer
 *           description: Number of comments the user has made
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
 *     ImageUploadRequest:
 *       type: object
 *       required:
 *         - fileExtension
 *         - contentType
 *       properties:
 *         fileExtension:
 *           type: string
 *           enum: [jpg, jpeg, png, gif, webp]
 *           description: File extension for the image
 *         contentType:
 *           type: string
 *           enum: [image/jpeg, image/png, image/gif, image/webp]
 *           description: MIME content type of the image
 *     ImageUploadResponse:
 *       type: object
 *       properties:
 *         uploadUrl:
 *           type: string
 *           description: Pre-signed URL for uploading the image to S3
 *         imageKey:
 *           type: string
 *           description: S3 key for the uploaded image
 *     ProfilePictureUpdate:
 *       type: object
 *       required:
 *         - profilePictureKey
 *       properties:
 *         profilePictureKey:
 *           type: string
 *           description: S3 key of the uploaded profile picture
 */

export const userRouter = Router();

// Use dependency injection
const service: UserService = new UserServiceImpl(new UserRepositoryImpl(db));

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

  const user = await service.getUserById(userId);

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
  const { userId } = res.locals.context;

  const user = await service.getUserWithFollowInfo(userId, otherUserId);

  return res.status(HttpStatus.OK).json(user);
});

/**
 * @swagger
 * /api/user/by_username/{username}:
 *   get:
 *     summary: Get users by username search
 *     description: Returns a list of users whose usernames contain the provided search term
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *         description: Username search term
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
 *         description: List of users matching the username search
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
userRouter.get(
  "/by_username/:username",
  async (req: Request, res: Response) => {
    const { username } = req.params;
    const { limit, skip } = req.query as Record<string, string>;

    const users = await service.getUsersByUsername(username, {
      limit: Number(limit) || undefined,
      skip: Number(skip) || undefined,
    });

    return res.status(HttpStatus.OK).json(users);
  }
);

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
userRouter.delete("/", async (res: Response) => {
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
userRouter.patch("/privacy", async (req: Request, res: Response) => {
  const { userId } = res.locals.context;
  const { isPrivate } = req.body as { isPrivate: boolean };

  await service.updatePrivacy(userId, isPrivate);

  const updatedUser = await service.getUserById(userId);

  return res.status(HttpStatus.OK).json({
    message: "Privacy settings updated successfully",
    user: updatedUser,
  });
});

/**
 * @swagger
 * /api/user/{userId}/likes:
 *   get:
 *     summary: Get posts liked by user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of likes to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *         description: Number of likes to skip
 *     responses:
 *       200:
 *         description: List of posts liked by user
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
userRouter.get("/:userId/likes", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { limit, skip } = req.query as Record<string, string>;

  const likes = await service.getUserLikes(userId, {
    limit: Number(limit),
    skip: Number(skip),
  });

  return res.status(HttpStatus.OK).json(likes);
});

/**
 * @swagger
 * /api/user/{userId}/retweets:
 *   get:
 *     summary: Get posts retweeted by user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of retweets to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *         description: Number of retweets to skip
 *     responses:
 *       200:
 *         description: List of posts retweeted by user
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
userRouter.get("/:userId/retweets", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { limit, skip } = req.query as Record<string, string>;

  const retweets = await service.getUserRetweets(userId, {
    limit: Number(limit),
    skip: Number(skip),
  });

  return res.status(HttpStatus.OK).json(retweets);
});

/**
 * @swagger
 * /api/user/{userId}/comments:
 *   get:
 *     summary: Get comments made by user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of comments to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *         description: Number of comments to skip
 *     responses:
 *       200:
 *         description: List of comments made by user
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
userRouter.get("/:userId/comments", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { limit, skip } = req.query as Record<string, string>;

  const comments = await service.getUserComments(userId, {
    limit: Number(limit),
    skip: Number(skip),
  });

  return res.status(HttpStatus.OK).json(comments);
});

/**
 * @swagger
 * /api/user/profile-picture/upload-url:
 *   post:
 *     summary: Generate pre-signed URL for profile picture upload
 *     description: Get a pre-signed URL to upload a profile picture directly to S3
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ImageUploadRequest'
 *     responses:
 *       200:
 *         description: Pre-signed URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImageUploadResponse'
 *       400:
 *         description: Invalid input data or unsupported file type
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
userRouter.post(
  "/profile-picture/upload-url",
  async (req: Request, res: Response) => {
    const { userId } = res.locals.context;
    const { fileExtension, contentType } = req.body;

    const response = await service.generateProfilePictureUploadUrl(userId, {
      fileExtension,
      contentType,
    });

    return res.status(HttpStatus.OK).json(response);
  }
);

/**
 * @swagger
 * /api/user/profile-picture:
 *   put:
 *     summary: Update user profile picture
 *     description: Update the user's profile picture after successful S3 upload
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfilePictureUpdate'
 *     responses:
 *       200:
 *         description: Profile picture updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profile picture updated successfully"
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
userRouter.put("/profile-picture", async (req: Request, res: Response) => {
  const { userId } = res.locals.context;
  const { profilePictureKey } = req.body;

  await service.updateUserProfilePicture(userId, profilePictureKey);

  return res.status(HttpStatus.OK).json({
    message: "Profile picture updated successfully",
  });
});
