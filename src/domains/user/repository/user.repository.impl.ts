import { SignupInputDTO } from "@domains/auth/dto";
import { PrismaClient } from "@prisma/client";
import { OffsetPagination } from "@types";
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

  async getById(userId: any): Promise<UserViewDTO | null> {
    const user = await this.db.user.findUnique({
      where: {
        id: userId,
      },
    });
    return user ? new UserViewDTO(user as any) : null;
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
  ): Promise<any[]> {
    const likes = await this.db.reaction.findMany({
      where: {
        authorId: userId,
        type: "LIKE",
      },
      include: {
        post: {
          include: {
            author: true,
          },
        },
      },
      take: options.limit ? options.limit : undefined,
      skip: options.skip ? options.skip : undefined,
      orderBy: {
        createdAt: "desc",
      },
    });
    return likes.map((like) => like.post);
  }

  async getUserRetweets(
    userId: string,
    options: OffsetPagination
  ): Promise<any[]> {
    const retweets = await this.db.reaction.findMany({
      where: {
        authorId: userId,
        type: "RETWEET",
      },
      include: {
        post: {
          include: {
            author: true,
          },
        },
      },
      take: options.limit ? options.limit : undefined,
      skip: options.skip ? options.skip : undefined,
      orderBy: {
        createdAt: "desc",
      },
    });
    return retweets.map((retweet) => retweet.post);
  }

  async getUserComments(
    userId: string,
    options: OffsetPagination
  ): Promise<any[]> {
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
    return comments;
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
}
