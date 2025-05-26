// filepath: /Users/martinbarreiro/Developer/twitter/src/domains/post/repository/post.repository.impl.ts
import { PrismaClient } from "@prisma/client";

import { CursorPagination } from "@types";

import { PostRepository } from ".";
import { CreatePostInputDTO, CreateCommentInputDTO, PostDTO } from "../dto";

export class PostRepositoryImpl implements PostRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(userId: string, data: CreatePostInputDTO): Promise<PostDTO> {
    const post = await this.db.post.create({
      data: {
        authorId: userId,
        ...data,
      },
    });
    return new PostDTO(post);
  }

  async createComment(
    userId: string,
    data: CreateCommentInputDTO
  ): Promise<PostDTO> {
    const comment = await this.db.post.create({
      data: {
        authorId: userId,
        content: data.content,
        images: data.images || [],
        parentId: data.parentId,
      },
    });
    return new PostDTO(comment);
  }

  async getAllByDatePaginated(
    userId: string,
    options: CursorPagination
  ): Promise<PostDTO[]> {
    // First, get IDs of users this user follows
    const followedUsers = await this.db.follow.findMany({
      where: {
        followerId: userId,
        deletedAt: null,
      },
      select: {
        followedId: true,
      },
    });

    const followedUserIds = followedUsers.map((follow) => follow.followedId);

    // Get posts from public accounts, accounts the user follows, or the user's own posts
    const posts = await this.db.post.findMany({
      where: {
        parentId: null, // Only get posts, not comments
        OR: [
          // Posts from public profiles
          {
            author: {
              isPrivate: false,
            },
          },
          // Posts from private profiles the user follows
          {
            authorId: {
              in: followedUserIds,
            },
          },
          // User's own posts
          {
            authorId: userId,
          },
        ],
      },
      cursor: options.after
        ? { id: options.after }
        : options.before
        ? { id: options.before }
        : undefined,
      skip: options.after ?? options.before ? 1 : undefined,
      take: options.limit
        ? options.before
          ? -options.limit
          : options.limit
        : undefined,
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "asc",
        },
      ],
    });
    return posts.map((post) => new PostDTO(post));
  }

  async delete(postId: string): Promise<void> {
    await this.db.post.delete({
      where: {
        id: postId,
      },
    });
  }

  async getById(postId: string, userId: string): Promise<PostDTO | null> {
    const post = await this.db.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        author: true,
      },
    });

    if (!post) return null;

    // If the post belongs to a user with a public profile, return it
    if (!post.author.isPrivate) {
      return new PostDTO(post);
    }

    // If the current user is the author, return the post
    if (post.authorId === userId) {
      return new PostDTO(post);
    }

    // Check if the current user follows the post author
    const follows = await this.db.follow.findFirst({
      where: {
        followerId: userId,
        followedId: post.authorId,
        deletedAt: null,
      },
    });

    // If the current user doesn't follow the author, don't return the post
    if (!follows) {
      return null;
    }

    return new PostDTO(post);
  }

  async getByAuthorId(
    userId: string,
    authorId: string
  ): Promise<PostDTO[] | null> {
    // Get the author
    const author = await this.db.user.findUnique({
      where: {
        id: authorId,
      },
    });

    // If author doesn't exist, return empty array
    if (!author) {
      return null;
    }

    // If the user is requesting their own posts
    if (userId === authorId) {
      const posts = await this.db.post.findMany({
        where: {
          authorId,
          parentId: null, // Only get posts, not comments
        },
      });
      return posts.map((post) => new PostDTO(post));
    }

    // If the author has a public profile, return all posts
    if (!author.isPrivate) {
      const posts = await this.db.post.findMany({
        where: {
          authorId,
          parentId: null, // Only get posts, not comments
        },
      });
      return posts.map((post) => new PostDTO(post));
    }

    // If the author has a private profile, check if the user follows the author
    const follows = await this.db.follow.findFirst({
      where: {
        followerId: userId,
        followedId: authorId,
        deletedAt: null,
      },
    });

    // If the user doesn't follow the private author, return null
    if (!follows) {
      return null;
    }

    // If the user follows the author, return all posts
    const posts = await this.db.post.findMany({
      where: {
        authorId,
        parentId: null, // Only get posts, not comments
      },
    });
    return posts.map((post) => new PostDTO(post));
  }

  async getCommentsByPostId(
    userId: string,
    postId: string,
    options: CursorPagination
  ): Promise<PostDTO[]> {
    // First, check if the user can access the parent post
    const parentPost = await this.getById(postId, userId);
    if (!parentPost) {
      return []; // If user can't access the parent post, return empty array
    }

    // Get comments with privacy filtering
    const followedUsers = await this.db.follow.findMany({
      where: {
        followerId: userId,
        deletedAt: null,
      },
      select: {
        followedId: true,
      },
    });

    const followedUserIds = followedUsers.map((follow) => follow.followedId);

    const comments = await this.db.post.findMany({
      where: {
        parentId: postId,
        OR: [
          // Comments from public profiles
          {
            author: {
              isPrivate: false,
            },
          },
          // Comments from private profiles the user follows
          {
            authorId: {
              in: followedUserIds,
            },
          },
          // User's own comments
          {
            authorId: userId,
          },
        ],
      },
      cursor: options.after
        ? { id: options.after }
        : options.before
        ? { id: options.before }
        : undefined,
      skip: options.after ?? options.before ? 1 : undefined,
      take: options.limit
        ? options.before
          ? -options.limit
          : options.limit
        : undefined,
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "asc",
        },
      ],
      include: {
        author: true,
      },
    });

    return comments.map((comment) => new PostDTO(comment));
  }

  async getReactionCounts(
    postId: string
  ): Promise<{ likeCount: number; retweetCount: number }> {
    const likesResult = await this.db.$queryRaw`
      SELECT COUNT(*) as count 
      FROM "Reaction" 
      WHERE "postId" = ${postId} AND "type" = 'LIKE'
    `;
    const likeCount =
      Array.isArray(likesResult) && likesResult[0]
        ? Number(likesResult[0].count)
        : 0;

    const retweetsResult = await this.db.$queryRaw`
      SELECT COUNT(*) as count 
      FROM "Reaction" 
      WHERE "postId" = ${postId} AND "type" = 'RETWEET'
    `;
    const retweetCount =
      Array.isArray(retweetsResult) && retweetsResult[0]
        ? Number(retweetsResult[0].count)
        : 0;

    return { likeCount, retweetCount };
  }

  async getUserReactions(
    postId: string,
    userId: string
  ): Promise<{ hasLiked: boolean; hasRetweeted: boolean }> {
    const userReactionsResult = await this.db.$queryRaw`
      SELECT "type" 
      FROM "Reaction" 
      WHERE "postId" = ${postId} AND "authorId" = ${userId}
    `;

    const userReactions = Array.isArray(userReactionsResult)
      ? userReactionsResult
      : [];
    const hasLiked = userReactions.some(
      (reaction: any) => reaction.type === "LIKE"
    );
    const hasRetweeted = userReactions.some(
      (reaction: any) => reaction.type === "RETWEET"
    );

    return { hasLiked, hasRetweeted };
  }
}
