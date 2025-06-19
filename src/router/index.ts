import { withAuth } from "@utils";
import { Router } from "express";

import { authRouter } from "@domains/auth";
import { chatRouter } from "@domains/chat";
import { followerRouter } from "@domains/follower";
import { healthRouter } from "@domains/health";
import { commentRouter, postRouter } from "@domains/post";
import { reactionRouter } from "@domains/reaction";
import { userRouter } from "@domains/user";

export const router = Router();

router.use("/health", healthRouter);
router.use("/auth", authRouter);
router.use("/user", withAuth, userRouter);
router.use("/post", withAuth, postRouter);
router.use("/comment", withAuth, commentRouter);
router.use("/follower", withAuth, followerRouter);
router.use("/reaction", withAuth, reactionRouter);
router.use("/chat", withAuth, chatRouter);
