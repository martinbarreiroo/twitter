import { Request, Response, Router } from "express";
import "express-async-errors";
import HttpStatus from "http-status";

import { BodyValidation, db } from "@utils";

import { UserRepositoryImpl } from "@domains/user/repository";
import { CreateCommentInputDTO, PostImageUploadInputDTO } from "../dto";
import { PostRepositoryImpl } from "../repository";
import { PostService, PostServiceImpl } from "../service";

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Comment management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ExtendedPost:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Comment ID
 *         content:
 *           type: string
 *           description: Comment content
 *         authorId:
 *           type: string
 *           description: Author ID
 *         parentId:
 *           type: string
 *           description: Parent post ID
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: S3 keys for comment images
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         author:
 *           $ref: '#/components/schemas/User'
 *         qtyLikes:
 *           type: integer
 *           description: Number of likes on this comment
 *         qtyRetweets:
 *           type: integer
 *           description: Number of retweets on this comment
 *         qtyComments:
 *           type: integer
 *           description: Number of comments on this comment
 *     CreateCommentInput:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         content:
 *           type: string
 *           description: Comment content
 *         images:
 *           type: array
 *           maxItems: 4
 *           items:
 *             type: string
 *           description: S3 keys for comment images (optional)
 */

export const commentRouter = Router();

// Use dependency injection
const service: PostService = new PostServiceImpl(
  new PostRepositoryImpl(db),
  new UserRepositoryImpl(db)
);

/**
 * @swagger
 * /api/comment/{postId}:
 *   get:
 *     summary: Get comments for a specific post
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the post to get comments for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of comments to return
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
 *         description: List of comments sorted by total reactions (likes + retweets + comments)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ExtendedPost'
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
commentRouter.get("/:postId", async (req: Request, res: Response) => {
  const { userId } = res.locals.context;
  const { postId } = req.params;
  const { limit, before, after } = req.query as Record<string, string>;

  const comments = await service.getCommentsByPostId(userId, postId, {
    limit: Number(limit),
    before,
    after,
  });

  return res.status(HttpStatus.OK).json(comments);
});

/**
 * @swagger
 * /api/comment:
 *   post:
 *     summary: Create a new comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentInput'
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Parent post not found
 *       500:
 *         description: Server error
 */
commentRouter.post(
  "/:postId",
  BodyValidation(CreateCommentInputDTO),
  async (req: Request, res: Response) => {
    const { userId } = res.locals.context;
    const { postId } = req.params;
    const data = req.body;

    const comment = await service.createComment(userId, postId, data);

    return res.status(HttpStatus.CREATED).json(comment);
  }
);

/**
 * @swagger
 * /api/comment/images/upload-urls:
 *   post:
 *     summary: Generate pre-signed URLs for comment image uploads
 *     description: Get pre-signed URLs to upload comment images directly to S3 (max 4 images)
 *     tags: [Comments]
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
commentRouter.post(
  "/images/upload-urls",
  BodyValidation(PostImageUploadInputDTO),
  async (req: Request, res: Response) => {
    const { userId } = res.locals.context;
    const data = req.body;

    const uploadUrls = await service.generatePostImageUploadUrls(userId, data);

    return res.status(HttpStatus.OK).json(uploadUrls);
  }
);
