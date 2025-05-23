import { Request, Response, Router } from "express";
import HttpStatus from "http-status";
// express-async-errors is a module that handles async errors in express, don't forget import it in your new controllers
import "express-async-errors";

import { db } from "@utils";

import { ReactionRepositoryImpl } from "../repository";
import { ReactionService, ReactionServiceImpl } from "../service";
import { ReactionEnum } from "../enum/reaction.enum";
import { ReactionInputDTO } from "../dto";

// Custom middleware to handle potential JSON formatting issues with reaction types
const normalizeReactionBody = (req: Request, res: Response, next: Function) => {
  if (req.body && req.body.type) {
    // If type is not a string (like unquoted LIKE or RETWEET), convert to string
    if (typeof req.body.type !== "string") {
      const typeStr = String(req.body.type).toLowerCase();
      if (typeStr === "like" || typeStr === "retweet") {
        req.body.type = typeStr;
      }
    }
  }
  next();
};

export const reactionRouter = Router();

const service: ReactionService = new ReactionServiceImpl(
  new ReactionRepositoryImpl(db)
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
 *     description: Add or remove a reaction (like/retweet) to a specific post
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
 *
 * /api/reaction:
 *   post:
 *     summary: React to a post (like or retweet) using query parameter
 *     description: Add or remove a reaction (like/retweet) to a specific post
 *     tags: [Reactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
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
 *       200:
 *         description: Reaction removed successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
// Handle reaction with postId in the path parameter
reactionRouter.post("/:postId", async (req: Request, res: Response) => {
  const { userId } = res.locals.context; // Current user
  const { postId } = req.params; // Post to react to
  const { type } = req.body; // Type of reaction

  // Validate reaction type
  if (!type || (type !== ReactionEnum.LIKE && type !== ReactionEnum.RETWEET)) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json({ error: "Invalid reaction type. Use 'like' or 'retweet'" });
  }

  const reactionDto: ReactionInputDTO = {
    postId,
    userId,
    type,
  };

  const reaction = await service.createReaction(reactionDto);

  // If reaction is null, it means it was removed
  if (!reaction) {
    return res.status(HttpStatus.OK).json({
      message: `${
        type === ReactionEnum.LIKE ? "Like" : "Retweet"
      } removed successfully`,
    });
  }

  // Otherwise, it was added
  return res.status(HttpStatus.CREATED).json(reaction);
});

reactionRouter.delete("/:reactionId", async (req: Request, res: Response) => {
  const { reactionId } = req.params;

  await service.deleteReaction(reactionId);

  return res
    .status(HttpStatus.OK)
    .json({ message: "Reaction removed successfully" });
});
