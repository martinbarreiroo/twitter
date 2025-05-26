import { PrismaClient } from "@prisma/client";
import { ReactionInputDTO, ReactionOutputDTO } from "../dto";
import { ReactionRepository } from "./reaction.repository";

export class ReactionRepositoryImpl implements ReactionRepository {
  constructor(private readonly db: PrismaClient) {}

  async createReaction(data: ReactionInputDTO): Promise<ReactionOutputDTO> {
    // First, verify if user has access to this post
    const post = await this.db.post.findUnique({
      where: {
        id: data.postId,
      },
      include: {
        author: true,
      },
    });

    // If post doesn't exist, can't react to it
    if (!post) {
      throw new Error("Post not found");
    }

    // Check visibility permissions:
    // 1. Is the post from a public profile? If yes, allow reaction
    // 2. Is the current user the post author? If yes, allow reaction
    // 3. Does the current user follow the post author? If yes, allow reaction
    // Otherwise, deny reaction

    // Post isn't from a public profile, and user isn't the post author
    if (post.author.isPrivate && post.authorId !== data.userId) {
      // Check if user follows the post author
      const follows = await this.db.follow.findFirst({
        where: {
          followerId: data.userId,
          followedId: post.authorId,
          deletedAt: null,
        },
      });

      // If user doesn't follow the author, deny reaction
      if (!follows) {
        throw new Error("You do not have permission to react to this post");
      }
    }

    // At this point, user has permission to react
    const reaction = await this.db.reaction.create({
      data: {
        type: data.type === "like" ? "LIKE" : "RETWEET",
        authorId: data.userId,
        postId: data.postId,
      },
    });

    return new ReactionOutputDTO({
      id: reaction.id,
      postId: reaction.postId,
      userId: reaction.authorId,
      type: reaction.type === "LIKE" ? "like" : "retweet", // Map DB enum to DTO type
      createdAt: reaction.createdAt,
      updatedAt: reaction.updatedAt,
    });
  }

  async findReactionById(id: string): Promise<ReactionOutputDTO | null> {
    const reaction = await this.db.reaction.findUnique({
      where: { id },
    });

    if (!reaction) {
      return null;
    }

    return new ReactionOutputDTO({
      id: reaction.id,
      postId: reaction.postId,
      userId: reaction.authorId,
      type: reaction.type === "LIKE" ? "like" : "retweet", // Map DB enum to DTO type
      createdAt: reaction.createdAt,
      updatedAt: reaction.updatedAt,
    });
  }

  async findReactionByUserAndPostAndType(
    userId: string,
    postId: string,
    type: string
  ): Promise<ReactionOutputDTO | null> {
    const reaction = await this.db.reaction.findFirst({
      where: {
        authorId: userId,
        postId: postId,
        type: type === "like" ? "LIKE" : "RETWEET",
      },
    });

    if (!reaction) {
      return null;
    }

    return new ReactionOutputDTO({
      id: reaction.id,
      postId: reaction.postId,
      userId: reaction.authorId,
      type: reaction.type === "LIKE" ? "like" : "retweet", // Map DB enum to DTO type
      createdAt: reaction.createdAt,
      updatedAt: reaction.updatedAt,
    });
  }

  async deleteReaction(id: string): Promise<boolean> {
    try {
      await this.db.reaction.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
