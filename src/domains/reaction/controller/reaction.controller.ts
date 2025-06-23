import { Request, Response, Router } from "express";
import HttpStatus from "http-status";
// express-async-errors is a module that handles async errors in express, don't forget import it in your new controllers
import "express-async-errors";

import { db } from "@utils";

import { PostRepositoryImpl } from "@domains/post/repository";
import { UserRepositoryImpl } from "@domains/user/repository";
import { ReactionRepositoryImpl } from "../repository";
import { ReactionService, ReactionServiceImpl } from "../service";

export const reactionRouter = Router();

const service: ReactionService = new ReactionServiceImpl(
  new ReactionRepositoryImpl(db),
  new UserRepositoryImpl(db),
  new PostRepositoryImpl(db)
);

/**
 * @swagger
 * tags:
 *   name: Reactions
 *   description: Reaction management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ReactionInput:
 *       type: object
 *       required:
 *         - type
 *       properties:
 *         type:
 *           type: string
 *           enum: [like, retweet]
 *           description: Type of reaction
 *     ReactionOutput:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Reaction ID
 *         postId:
 *           type: string
 *           description: Post ID
 *         userId:
 *           type: string
 *           description: User ID
 *         type:
 *           type: string
 *           enum: [like, retweet]
 *           description: Type of reaction
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /api/reaction/{postId}:
 *   post:
 *     summary: React to a post (like or retweet) using path parameter
 *     description: Add a reaction (like/retweet) to a specific post
 *     tags: [Reactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to react to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReactionInput'
 *     responses:
 *       201:
 *         description: Reaction added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReactionOutput'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Post not found
 *       409:
 *         description: Reaction already exists
 *       500:
 *         description: Server error
 */
// Handle reaction with postId in the path parameter
reactionRouter.post("/:postId", async (req: Request, res: Response) => {
  const { userId } = res.locals.context; // Current user
  const { postId } = req.params; // Post to react to
  const { type } = req.body; // Type of reaction

  const reaction = await service.createReactionWithValidation(
    userId,
    postId,
    type
  );

  return res.status(HttpStatus.CREATED).json(reaction);
});

/**
 * @swagger
 * /api/reaction/{postId}/{type}:
 *   delete:
 *     summary: Delete a specific reaction
 *     description: Remove the current user's specific reaction (like or retweet) from a post
 *     tags: [Reactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to remove reaction from
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [like, retweet]
 *         description: Type of reaction to remove
 *     responses:
 *       200:
 *         description: Reaction removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Reaction removed successfully"
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Reaction not found
 *       500:
 *         description: Server error
 */
reactionRouter.delete("/:postId/:type", async (req: Request, res: Response) => {
  const { userId } = res.locals.context; // Current user
  const { postId, type } = req.params;

  await service.deleteReactionByPostAndType(userId, postId, type);

  return res
    .status(HttpStatus.OK)
    .json({ message: "Reaction removed successfully" });
});
