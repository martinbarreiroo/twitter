import { Request, Response, Router } from "express";
import HttpStatus from "http-status";
// express-async-errors is a module that handles async errors in express, don't forget import it in your new controllers
import "express-async-errors";

import { db, BodyValidation } from "@utils";

import { PostRepositoryImpl } from "../repository";
import { PostService, PostServiceImpl } from "../service";
import { CreatePostInputDTO } from "../dto";

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
 */

export const postRouter = Router();

// Use dependency injection
const service: PostService = new PostServiceImpl(new PostRepositoryImpl(db));

/**
 * @swagger
 * /api/post:
 *   get:
 *     summary: Get latest posts
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
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
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
 *     summary: Get posts by a specific user
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
 *         description: List of posts by the specified user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
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

  console.log(`Attempting to get post with ID: ${postId} for user: ${userId}`); // Debug log

  // Breakpoint would be set on the next line during debugging
  const post = await service.getPost(userId, postId);

  try {
    // Use raw SQL queries instead of Prisma client to avoid caching issues
    const likesResult = await db.$queryRaw`
      SELECT COUNT(*) as count 
      FROM "Reaction" 
      WHERE "postId" = ${postId} AND "type" = 'LIKE'
    `;
    const likeCount =
      Array.isArray(likesResult) && likesResult[0]
        ? Number(likesResult[0].count)
        : 0;

    const retweetsResult = await db.$queryRaw`
      SELECT COUNT(*) as count 
      FROM "Reaction" 
      WHERE "postId" = ${postId} AND "type" = 'RETWEET'
    `;
    const retweetCount =
      Array.isArray(retweetsResult) && retweetsResult[0]
        ? Number(retweetsResult[0].count)
        : 0;

    // Check if current user has liked or retweeted
    const userReactionsResult = await db.$queryRaw`
      SELECT "type" 
      FROM "Reaction" 
      WHERE "postId" = ${postId} AND "authorId" = ${userId}
    `;

    const userReactions = Array.isArray(userReactionsResult)
      ? userReactionsResult
      : [];
    const hasLiked = userReactions.some((reaction) => reaction.type === "LIKE");
    const hasRetweeted = userReactions.some(
      (reaction) => reaction.type === "RETWEET"
    );

    // Add reaction data to post response
    const postWithReactions = {
      ...post,
      reactions: {
        likeCount,
        retweetCount,
        hasLiked,
        hasRetweeted,
      },
    };

    return res.status(HttpStatus.OK).json(postWithReactions);
  } catch (error) {
    console.error("Error fetching reactions:", error);
    // If there's an error with reactions, just return the post without reaction data
    return res.status(HttpStatus.OK).json(post);
  }
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
