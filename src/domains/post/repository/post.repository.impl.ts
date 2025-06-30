// filepath: /Users/martinbarreiro/Developer/twitter/src/domains/post/repository/post.repository.impl.ts
import { PrismaClient } from "@prisma/client";

import { CursorPagination } from "@types";

import { PostRepository } from ".";
import {
  CommentDTO,
  CreateCommentInputDTO,
  CreatePostInputDTO,
  ExtendedPostDTO,
  PostDTO,
} from "../dto";

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
    postId: string,
    data: CreateCommentInputDTO
  ): Promise<CommentDTO> {
    const comment = await this.db.post.create({
      data: {
        authorId: userId,
        content: data.content,
        images: data.images,
        parentId: postId,
      },
    });
    return new CommentDTO(comment);
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
        AND: [
          // Add timestamp filtering for cursor pagination
          ...(options.after
            ? [{ createdAt: { lt: new Date(options.after) } }]
            : []),
          ...(options.before
            ? [{ createdAt: { gt: new Date(options.before) } }]
            : []),
          {
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
        ],
      },
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

  async getById(
    postId: string,
    userId: string
  ): Promise<ExtendedPostDTO | null> {
    const post = await this.db.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        author: true,
        reactions: true,
      },
    });

    if (!post) return null;

    // Get user reactions
    const userReactions = await this.getUserReactions(postId, userId);

    // Use counter fields from database and include user reactions
    const extendedPost = new ExtendedPostDTO({
      ...post,
      commentsCount: post.commentsCount,
      likesCount: post.likesCount,
      retweetsCount: post.retweetsCount,
      hasLiked: userReactions.hasLiked,
      hasRetweeted: userReactions.hasRetweeted,
    });

    // If the post belongs to a user with a public profile, return it
    if (!post.author.isPrivate) {
      return extendedPost;
    }

    // If the current user is the author, return the post
    if (post.authorId === userId) {
      return extendedPost;
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

    return extendedPost;
  }

  // Update getByAuthorId to return ExtendedPostDTO
  async getByAuthorId(
    userId: string,
    authorId: string,
    options: CursorPagination
  ): Promise<ExtendedPostDTO[] | null> {
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

    let canAccess = false;

    // If the user is requesting their own posts
    if (userId === authorId) {
      canAccess = true;
    }
    // If the author has a public profile
    else if (!author.isPrivate) {
      canAccess = true;
    }
    // If the author has a private profile, check if the user follows the author
    else {
      const follows = await this.db.follow.findFirst({
        where: {
          followerId: userId,
          followedId: authorId,
          deletedAt: null,
        },
      });
      canAccess = !!follows;
    }

    if (!canAccess) {
      return null;
    }

    // Get posts with all necessary data for ExtendedPostDTO
    const posts = await this.db.post.findMany({
      where: {
        authorId,
        parentId: null, // Only get posts, not comments
        AND: [
          ...(options.after
            ? [{ createdAt: { lt: new Date(options.after) } }]
            : []),
          ...(options.before
            ? [{ createdAt: { gt: new Date(options.before) } }]
            : []),
        ],
      },
      take: options.limit
        ? options.before
          ? -options.limit
          : options.limit
        : undefined,
      include: {
        author: true,
        reactions: true,
      },
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "asc",
        },
      ],
    });

    // Transform to ExtendedPostDTO with counter fields from database
    const extendedPosts = await Promise.all(
      posts.map(async (post) => {
        const userReactions = await this.getUserReactions(post.id, userId);
        return new ExtendedPostDTO({
          ...post,
          commentsCount: post.commentsCount,
          likesCount: post.likesCount,
          retweetsCount: post.retweetsCount,
          hasLiked: userReactions.hasLiked,
          hasRetweeted: userReactions.hasRetweeted,
        });
      })
    );

    return extendedPosts;
  }

  async getUserReactions(
    postId: string,
    userId: string
  ): Promise<{ hasLiked: boolean; hasRetweeted: boolean }> {
    const userReactions = await this.db.reaction.findMany({
      where: {
        postId: postId,
        authorId: userId,
      },
      select: {
        type: true,
      },
    });

    const hasLiked = userReactions.some((reaction) => reaction.type === "LIKE");
    const hasRetweeted = userReactions.some(
      (reaction) => reaction.type === "RETWEET"
    );

    return { hasLiked, hasRetweeted };
  }

  async getCommentsByPostIdWithReactions(
    userId: string,
    postId: string,
    options: CursorPagination
  ): Promise<ExtendedPostDTO[]> {
    // First, check if the user can access the parent post
    const parentPost = await this.getById(postId, userId);
    if (!parentPost) {
      return []; // If user can't access the parent post, return empty array
    }

    // Get comments with privacy filtering and include reactions
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
        AND: [
          // Add timestamp filtering for cursor pagination
          ...(options.after
            ? [{ createdAt: { lt: new Date(options.after) } }]
            : []),
          ...(options.before
            ? [{ createdAt: { gt: new Date(options.before) } }]
            : []),
          {
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
        ],
      },
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
        reactions: true,
      },
    });

    // Transform to ExtendedPostDTO with counter fields from database
    const extendedComments = await Promise.all(
      comments.map(async (comment) => {
        const userReactions = await this.getUserReactions(comment.id, userId);
        return new ExtendedPostDTO({
          ...comment,
          commentsCount: comment.commentsCount,
          likesCount: comment.likesCount,
          retweetsCount: comment.retweetsCount,
          hasLiked: userReactions.hasLiked,
          hasRetweeted: userReactions.hasRetweeted,
        });
      })
    );

    // Sort by total reactions using the correct property names
    return extendedComments.sort((a, b) => {
      const totalReactionsA = a.qtyLikes + a.qtyRetweets + a.qtyComments;
      const totalReactionsB = b.qtyLikes + b.qtyRetweets + b.qtyComments;
      return totalReactionsB - totalReactionsA;
    });
  }

  async getAllByDatePaginatedExtended(
    userId: string,
    options: CursorPagination
  ): Promise<ExtendedPostDTO[]> {
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
        AND: [
          // Add timestamp filtering for cursor pagination
          ...(options.after
            ? [{ createdAt: { lt: new Date(options.after) } }]
            : []),
          ...(options.before
            ? [{ createdAt: { gt: new Date(options.before) } }]
            : []),
          {
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
        ],
      },
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
        reactions: true,
      },
    });

    // Transform to ExtendedPostDTO with counter fields from database
    const extendedPosts = await Promise.all(
      posts.map(async (post) => {
        const userReactions = await this.getUserReactions(post.id, userId);
        return new ExtendedPostDTO({
          ...post,
          commentsCount: post.commentsCount,
          likesCount: post.likesCount,
          retweetsCount: post.retweetsCount,
          hasLiked: userReactions.hasLiked,
          hasRetweeted: userReactions.hasRetweeted,
        });
      })
    );

    return extendedPosts;
  }

  async incrementLikesCount(postId: string): Promise<void> {
    await this.db.post.update({
      where: { id: postId },
      data: {
        likesCount: {
          increment: 1,
        },
      },
    });
  }

  async decrementLikesCount(postId: string): Promise<void> {
    await this.db.post.update({
      where: { id: postId },
      data: {
        likesCount: {
          decrement: 1,
        },
      },
    });
  }

  async incrementRetweetsCount(postId: string): Promise<void> {
    await this.db.post.update({
      where: { id: postId },
      data: {
        retweetsCount: {
          increment: 1,
        },
      },
    });
  }

  async decrementRetweetsCount(postId: string): Promise<void> {
    await this.db.post.update({
      where: { id: postId },
      data: {
        retweetsCount: {
          decrement: 1,
        },
      },
    });
  }

  async incrementCommentsCount(postId: string): Promise<void> {
    await this.db.post.update({
      where: { id: postId },
      data: {
        commentsCount: {
          increment: 1,
        },
      },
    });
  }

  async decrementCommentsCount(postId: string): Promise<void> {
    await this.db.post.update({
      where: { id: postId },
      data: {
        commentsCount: {
          decrement: 1,
        },
      },
    });
  }

  async getCommentAuthorsByPostId(
    postId: string
  ): Promise<{ authorId: string; count: number }[]> {
    const comments = await this.db.post.findMany({
      where: {
        parentId: postId,
        deletedAt: null,
      },
      select: {
        authorId: true,
      },
    });

    const commentCounts = new Map<string, number>();
    comments.forEach((comment) => {
      const current = commentCounts.get(comment.authorId) || 0;
      commentCounts.set(comment.authorId, current + 1);
    });

    return Array.from(commentCounts.entries()).map(([authorId, count]) => ({
      authorId,
      count,
    }));
  }

  async getFollowingPostsPaginated(
    userId: string,
    options: CursorPagination
  ): Promise<ExtendedPostDTO[]> {
    // Get IDs of users this user follows
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

    // If user doesn't follow anyone, return empty array
    if (followedUserIds.length === 0) {
      return [];
    }

    // Get posts only from followed users
    const posts = await this.db.post.findMany({
      where: {
        parentId: null, // Only get posts, not comments
        authorId: {
          in: followedUserIds,
        },
        AND: [
          // Add timestamp filtering for cursor pagination
          ...(options.after
            ? [{ createdAt: { lt: new Date(options.after) } }]
            : []),
          ...(options.before
            ? [{ createdAt: { gt: new Date(options.before) } }]
            : []),
        ],
      },
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
        reactions: true,
      },
    });

    // Transform to ExtendedPostDTO with counter fields from database
    const extendedPosts = await Promise.all(
      posts.map(async (post) => {
        const userReactions = await this.getUserReactions(post.id, userId);
        return new ExtendedPostDTO({
          ...post,
          commentsCount: post.commentsCount,
          likesCount: post.likesCount,
          retweetsCount: post.retweetsCount,
          hasLiked: userReactions.hasLiked,
          hasRetweeted: userReactions.hasRetweeted,
        });
      })
    );

    return extendedPosts;
  }
}
