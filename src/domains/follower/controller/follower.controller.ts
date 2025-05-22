import { Request, Response, Router } from "express";
import HttpStatus from "http-status";
import "express-async-errors";

import { db } from "@utils";

import { FollowerRepositoryImpl } from "../repository";
import { FollowerService, FollowerServiceImpl } from "../service";

export const followerRouter = Router();

// Use dependency injection
const service: FollowerService = new FollowerServiceImpl(
  new FollowerRepositoryImpl(db)
);

/**
 * @route POST /api/follower/follow/:userId
 * @desc Follow a user
 * @access Private
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
 * @route POST /api/follower/unfollow/:userId
 * @desc Unfollow a user
 * @access Private
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
