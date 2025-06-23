import { Request, Response, Router } from "express";
import HttpStatus from "http-status";
// express-async-errors is a module that handles async errors in express, don't forget import it in your new controllers
import "express-async-errors";

import { BodyValidation, db } from "@utils";

import { UserRepositoryImpl } from "@domains/user/repository";
import { CreatePostInputDTO, PostImageUploadInputDTO } from "../dto";
import { PostRepositoryImpl } from "../repository";
import { PostService, PostServiceImpl } from "../service";

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Post management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Post ID
 *         content:
 *           type: string
 *           description: Post content
 *         authorId:
 *           type: string
 *           description: Author ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     ExtendedPost:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Post ID
 *         content:
 *           type: string
 *           description: Post content
 *         authorId:
 *           type: string
 *           description: Author ID
 *         parentId:
 *           type: string
 *           description: Parent post ID (for comments)
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: S3 keys for post images
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         author:
 *           $ref: '#/components/schemas/User'
 *         qtyLikes:
 *           type: integer
 *           description: Number of likes on this post
 *         qtyRetweets:
 *           type: integer
 *           description: Number of retweets on this post
 *         qtyComments:
 *           type: integer
 *           description: Number of comments on this post
 *         hasLiked:
 *           type: boolean
 *           description: Whether the current user has liked this post
 *         hasRetweeted:
 *           type: boolean
 *           description: Whether the current user has retweeted this post
 *     CreatePostInput:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         content:
 *           type: string
 *           description: Post content
 *     PaginationParams:
 *       type: object
 *       properties:
 *         limit:
 *           type: integer
 *           description: Maximum number of posts to return
 *         before:
 *           type: string
 *           description: Cursor for pagination (before timestamp)
 *         after:
 *           type: string
 *           description: Cursor for pagination (after timestamp)
 *     PostImageUploadRequest:
 *       type: object
 *       required:
 *         - images
 *       properties:
 *         images:
 *           type: array
 *           maxItems: 4
 *           items:
 *             type: object
 *             required:
 *               - fileExtension
 *               - contentType
 *             properties:
 *               fileExtension:
 *                 type: string
 *                 enum: [jpg, jpeg, png, gif, webp]
 *                 description: File extension for the image
 *               contentType:
 *                 type: string
 *                 enum: [image/jpeg, image/png, image/gif, image/webp]
 *                 description: MIME content type of the image
 *     PostImageUploadResponse:
 *       type: object
 *       properties:
 *         uploads:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               uploadUrl:
 *                 type: string
 *                 description: Pre-signed URL for uploading the image to S3
 *               imageKey:
 *                 type: string
 *                 description: S3 key for the uploaded image
 */

export const postRouter = Router();

// Use dependency injection
const service: PostService = new PostServiceImpl(
  new PostRepositoryImpl(db),
  new UserRepositoryImpl(db)
);

/**
 * @swagger
 * /api/post:
 *   get:
 *     summary: Get latest posts with reaction counts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of posts to return
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Cursor for pagination (before timestamp)
 *       - in: query
 *         name: after
 *         schema:
 *           type: string
 *         description: Cursor for pagination (after timestamp)
 *     responses:
 *       200:
 *         description: List of posts with reaction counts and author information
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ExtendedPost'
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
postRouter.get("/", async (req: Request, res: Response) => {
  const { userId } = res.locals.context;
  const { limit, before, after } = req.query as Record<string, string>;

  const posts = await service.getLatestPosts(userId, {
    limit: Number(limit),
    before,
    after,
  });

  return res.status(HttpStatus.OK).json(posts);
});

// Important: More specific routes must come before generic routes with path parameters
/**
 * @swagger
 * /api/post/by_user/{userId}:
 *   get:
 *     summary: Get posts by a specific user with reaction counts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user whose posts to fetch
 *     responses:
 *       200:
 *         description: List of posts by the specified user with reaction counts and author information
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ExtendedPost'
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
postRouter.get("/by_user/:userId", async (req: Request, res: Response) => {
  const { userId } = res.locals.context;
  const { userId: authorId } = req.params;

  const posts = await service.getPostsByAuthor(userId, authorId);

  return res.status(HttpStatus.OK).json(posts);
});

// Generic route with path parameter should come after more specific routes
/**
 * @swagger
 * /api/post/{postId}:
 *   get:
 *     summary: Get a specific post by ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the post to fetch
 *     responses:
 *       200:
 *         description: Post details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
postRouter.get("/:postId", async (req: Request, res: Response) => {
  const { userId } = res.locals.context;
  const { postId } = req.params;

  const postWithReactions = await service.getPost(userId, postId);

  return res.status(HttpStatus.OK).json(postWithReactions);
});

/**
 * @swagger
 * /api/post:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePostInput'
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
postRouter.post(
  "/",
  BodyValidation(CreatePostInputDTO),
  async (req: Request, res: Response) => {
    const { userId } = res.locals.context;
    const data = req.body;

    const post = await service.createPost(userId, data);

    return res.status(HttpStatus.CREATED).json(post);
  }
);

/**
 * @swagger
 * /api/post/images/upload-urls:
 *   post:
 *     summary: Generate pre-signed URLs for post image uploads
 *     description: Get pre-signed URLs to upload post images directly to S3 (max 4 images)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostImageUploadRequest'
 *     responses:
 *       200:
 *         description: Pre-signed URLs generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PostImageUploadResponse'
 *       400:
 *         description: Invalid input data or unsupported file types
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
postRouter.post(
  "/images/upload-urls",
  BodyValidation(PostImageUploadInputDTO),
  async (req: Request, res: Response) => {
    const { userId } = res.locals.context;
    const data = req.body;

    const uploadUrls = await service.generatePostImageUploadUrls(userId, data);

    return res.status(HttpStatus.OK).json(uploadUrls);
  }
);

/**
 * @swagger
 * /api/post/{postId}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the post to delete
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - not the post owner
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
postRouter.delete("/:postId", async (req: Request, res: Response) => {
  const { userId } = res.locals.context;
  const { postId } = req.params;

  await service.deletePost(userId, postId);

  return res.status(HttpStatus.OK).send(`Deleted post ${postId}`);
});
