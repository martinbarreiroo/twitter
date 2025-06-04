import { SignupInputDTO } from "@domains/auth/dto";
import { ExtendedPostDTO } from "@domains/post/dto";
import { PrismaClient } from "@prisma/client";
import { CursorPagination, OffsetPagination } from "@types";
import { ExtendedUserDTO, UserViewDTO } from "../dto";
import { UserRepository } from "./user.repository";

export class UserRepositoryImpl implements UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: SignupInputDTO): Promise<UserViewDTO> {
    const user = await this.db.user.create({
      data,
    });
    return new UserViewDTO(user as any);
  }

  async getById(userId: string): Promise<UserViewDTO | null> {
    const user = await this.db.user.findUnique({
      where: {
        id: userId,
      },
    });
    return user ? new UserViewDTO(user as any) : null;
  }

  async getByIdWithFollowInfo(
    userId: any,
    targetUserId: string
  ): Promise<UserViewDTO | null> {
    const user = await this.db.user.findUnique({
      where: {
        id: targetUserId,
      },
    });
    const isFollowing = await this.isFollowingYou(userId, targetUserId);

    if (user) {
      const userViewDto = new UserViewDTO(user as any);
      userViewDto.followsYou = isFollowing;
      return userViewDto;
    }

    return null;
  }

  async delete(userId: any): Promise<void> {
    await this.db.user.delete({
      where: {
        id: userId,
      },
    });
  }

  async getByEmailOrUsername(
    email?: string,
    username?: string
  ): Promise<ExtendedUserDTO | null> {
    const user = await this.db.user.findFirst({
      where: {
        OR: [
          {
            email,
          },
          {
            username,
          },
        ],
      },
    });
    return user ? new ExtendedUserDTO(user) : null;
  }

  async getUsersByUsername(
    username: string,
    options: CursorPagination
  ): Promise<UserViewDTO[]> {
    const whereClause: any = {
      username: {
        contains: username,
        mode: "insensitive",
      },
    };

    // Add cursor condition if provided
    if (options.after) {
      whereClause.createdAt = {
        gt: new Date(options.after),
      };
    } else if (options.before) {
      whereClause.createdAt = {
        lt: new Date(options.before),
      };
    }

    const users = await this.db.user.findMany({
      where: whereClause,
      take: options.limit ? options.limit + 1 : undefined,
      orderBy: [
        {
          createdAt: "desc", // Most recent users first
        },
        {
          id: "desc", // Secondary sort for tie-breaking
        },
      ],
    });

    // Check if there are more results and remove the extra item
    const hasMore = options.limit && users.length > options.limit;
    if (hasMore) {
      users.pop();
    }

    return users.map((user) => new UserViewDTO(user as any));
  }

  async updatePrivacy(userId: string, isPrivate: boolean): Promise<void> {
    await this.db.user.update({
      where: {
        id: userId,
      },
      data: {
        isPrivate: isPrivate,
      },
    });
  }

  async getUserLikes(
    userId: string,
    options: OffsetPagination
  ): Promise<ExtendedPostDTO[]> {
    const likes = await this.db.reaction.findMany({
      where: {
        authorId: userId,
        type: "LIKE",
      },
      include: {
        post: {
          include: {
            author: true,
            reactions: true,
          },
        },
      },
      take: options.limit ? options.limit : undefined,
      skip: options.skip ? options.skip : undefined,
      orderBy: {
        createdAt: "desc",
      },
    });
    return likes.map((like) => new ExtendedPostDTO(like.post as any));
  }

  async getUserRetweets(
    userId: string,
    options: OffsetPagination
  ): Promise<ExtendedPostDTO[]> {
    const retweets = await this.db.reaction.findMany({
      where: {
        authorId: userId,
        type: "RETWEET",
      },
      include: {
        post: {
          include: {
            author: true,
            reactions: true,
          },
        },
      },
      take: options.limit ? options.limit : undefined,
      skip: options.skip ? options.skip : undefined,
      orderBy: {
        createdAt: "desc",
      },
    });
    return retweets.map((retweet) => new ExtendedPostDTO(retweet.post as any));
  }

  async getUserComments(
    userId: string,
    options: OffsetPagination
  ): Promise<ExtendedPostDTO[]> {
    const comments = await this.db.post.findMany({
      where: {
        authorId: userId,
        parentId: {
          not: null,
        },
      },
      include: {
        author: true,
        parent: {
          include: {
            author: true,
          },
        },
        reactions: true,
      },
      take: options.limit ? options.limit : undefined,
      skip: options.skip ? options.skip : undefined,
      orderBy: {
        createdAt: "desc",
      },
    });
    return comments.map((comment) => new ExtendedPostDTO(comment as any));
  }

  async incrementLikesCount(userId: string): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: { likesCount: { increment: 1 } },
    });
  }

  async decrementLikesCount(userId: string): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: { likesCount: { decrement: 1 } },
    });
  }

  async incrementRetweetsCount(userId: string): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: { retweetsCount: { increment: 1 } },
    });
  }

  async decrementRetweetsCount(userId: string): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: { retweetsCount: { decrement: 1 } },
    });
  }

  async incrementCommentsCount(userId: string): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: { commentsCount: { increment: 1 } },
    });
  }

  async decrementCommentsCount(userId: string): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: { commentsCount: { decrement: 1 } },
    });
  }

  async updateProfilePicture(
    userId: string,
    profilePictureKey: string
  ): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: { profilePicture: profilePictureKey },
    });
  }

  private async isFollowingYou(
    userId: string,
    targetUserId: string
  ): Promise<boolean> {
    const follow = await this.db.follow.findFirst({
      where: {
        followerId: userId,
        followedId: targetUserId,
      },
    });
    return !!follow;
  }
}
