import { Request, Response, Router } from "express";
import HttpStatus from "http-status";
// express-async-errors is a module that handles async errors in express, don't forget import it in your new controllers
import "express-async-errors";

import { db, BodyValidation } from "@utils";

import { PostRepositoryImpl } from "../repository";
import { UserRepositoryImpl } from "@domains/user/repository";
import { PostService, PostServiceImpl } from "../service";
import { CreateCommentInputDTO } from "../dto";

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
 *     Comment:
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
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *     CreateCommentInput:
 *       type: object
 *       required:
 *         - content
 *         - parentId
 *       properties:
 *         content:
 *           type: string
 *           description: Comment content
 *         parentId:
 *           type: string
 *           description: ID of the post to comment on
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
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
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
 *               $ref: '#/components/schemas/Comment'
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
  "/",
  BodyValidation(CreateCommentInputDTO),
  async (req: Request, res: Response) => {
    const { userId } = res.locals.context;
    const data = req.body;

    const comment = await service.createComment(userId, data);

    return res.status(HttpStatus.CREATED).json(comment);
  }
);
