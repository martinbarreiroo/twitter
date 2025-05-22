import { PrismaClient } from "@prisma/client";
import { FollowerRepository } from "./follower.repository";

/**
 * Implementation of the follower repository
 */
export class FollowerRepositoryImpl implements FollowerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Follow a user
   * @param followerId - The ID of the follower user
   * @param followedId - The ID of the user to be followed
   * @returns Promise<void>
   */
  async followUser(followerId: string, followedId: string): Promise<void> {
    await this.prisma.follow.create({
      data: {
        followerId,
        followedId,
      },
    });
  }

  /**
   * Unfollow a user
   * @param followerId - The ID of the follower user
   * @param followedId - The ID of the user to be unfollowed
   * @returns Promise<void>
   */
  async unfollowUser(followerId: string, followedId: string): Promise<void> {
    await this.prisma.follow.deleteMany({
      where: {
        followerId,
        followedId,
        deletedAt: null,
      },
    });
  }

  /**
   * Check if a user follows another user
   * @param followerId - The ID of the follower user
   * @param followedId - The ID of the followed user
   * @returns Promise<boolean> - True if the user follows the other user, false otherwise
   */
  async isFollowing(followerId: string, followedId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findFirst({
      where: {
        followerId,
        followedId,
        deletedAt: null,
      },
    });

    return !!follow;
  }
}
