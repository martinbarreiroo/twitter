// filepath: /Users/martinbarreiro/Developer/twitter/src/domains/post/repository/post.repository.impl.ts
import { PrismaClient } from "@prisma/client";

import { CursorPagination } from "@types";

import { PostRepository } from ".";
import { CreatePostInputDTO, PostDTO } from "../dto";

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

    // Get posts from public accounts OR accounts the user follows
    const posts = await this.db.post.findMany({
      where: {
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

  async getByAuthorId(userId: string, authorId: string): Promise<PostDTO[]> {
    // Get the author
    const author = await this.db.user.findUnique({
      where: {
        id: authorId,
      },
    });

    // If author doesn't exist, return empty array
    if (!author) {
      return [];
    }

    // If the user is requesting their own posts
    if (userId === authorId) {
      const posts = await this.db.post.findMany({
        where: {
          authorId,
        },
      });
      return posts.map((post) => new PostDTO(post));
    }

    // If the author has a public profile, return all posts
    if (!author.isPrivate) {
      const posts = await this.db.post.findMany({
        where: {
          authorId,
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

    // If the user doesn't follow the private author, return empty array
    if (!follows) {
      return [];
    }

    // If the user follows the author, return all posts
    const posts = await this.db.post.findMany({
      where: {
        authorId,
      },
    });
    return posts.map((post) => new PostDTO(post));
  }
}
