import { Request, Response, Router } from "express";
import "express-async-errors";
import HttpStatus from "http-status";

import { db } from "@utils";

import { FollowerRepositoryImpl } from "../repository";
import { FollowerService, FollowerServiceImpl } from "../service";

/**
 * @swagger
 * tags:
 *   name: Followers
 *   description: Follower management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FollowRequest:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           description: ID of the user to follow/unfollow
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 */

export const followerRouter = Router();

// Use dependency injection
const service: FollowerService = new FollowerServiceImpl(
  new FollowerRepositoryImpl(db)
);

/**
 * @swagger
 * /api/follower/follow/{userId}:
 *   post:
 *     summary: Follow a user
 *     tags: [Followers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user to follow
 *     responses:
 *       201:
 *         description: User followed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server Error
 */
followerRouter.post("/follow/:userId", async (req: Request, res: Response) => {
  const { userId } = res.locals.context; // Current user (follower)
  const { userId: followedId } = req.params; // User to follow

  await service.followUser(userId, followedId);

  return res
    .status(HttpStatus.CREATED)
    .json({ message: "User followed successfully" });
});

/**
 * @swagger
 * /api/follower/unfollow/{userId}:
 *   post:
 *     summary: Unfollow a user
 *     tags: [Followers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the user to unfollow
 *     responses:
 *       200:
 *         description: User unfollowed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Not authorized
 *       404:
 *         description: User not found or not following the user
 *       500:
 *         description: Server Error
 */
followerRouter.post(
  "/unfollow/:userId",
  async (req: Request, res: Response) => {
    const { userId } = res.locals.context; // Current user (follower)
    const { userId: followedId } = req.params; // User to unfollow

    await service.unfollowUser(userId, followedId);

    return res
      .status(HttpStatus.OK)
      .json({ message: "User unfollowed successfully" });
  }
);
