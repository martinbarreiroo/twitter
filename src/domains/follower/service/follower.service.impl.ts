import { FollowerRepository } from "../repository";
import { FollowerService } from "./follower.service";
import { ValidationException, NotFoundException } from "@utils/errors";

/**
 * Implementation of the follower service
 */
export class FollowerServiceImpl implements FollowerService {
  constructor(private readonly repository: FollowerRepository) {}

  /**
   * Follow a user
   * @param followerId - The ID of the follower user
   * @param followedId - The ID of the user to be followed
   * @returns Promise<void>
   * @throws ValidationException if the user is trying to follow themselves or already follows the user
   */
  async followUser(followerId: string, followedId: string): Promise<void> {
    // Check if the user is trying to follow themselves
    if (followerId === followedId) {
      throw new ValidationException([
        { field: "userId", message: "You cannot follow yourself" },
      ]);
    }

    // Check if the user already follows the other user
    const isFollowing = await this.repository.isFollowing(
      followerId,
      followedId
    );
    if (isFollowing) {
      throw new ValidationException([
        { field: "userId", message: "You already follow this user" },
      ]);
    }

    await this.repository.followUser(followerId, followedId);
  }

  /**
   * Unfollow a user
   * @param followerId - The ID of the follower user
   * @param followedId - The ID of the user to be unfollowed
   * @returns Promise<void>
   * @throws ValidationException if the user is trying to unfollow themselves
   * @throws NotFoundException if the user does not follow the other user
   */
  async unfollowUser(followerId: string, followedId: string): Promise<void> {
    // Check if the user is trying to unfollow themselves
    if (followerId === followedId) {
      throw new ValidationException([
        { field: "userId", message: "You cannot unfollow yourself" },
      ]);
    }

    // Check if the user follows the other user
    const isFollowing = await this.repository.isFollowing(
      followerId,
      followedId
    );
    if (!isFollowing) {
      throw new NotFoundException("You do not follow this user");
    }

    await this.repository.unfollowUser(followerId, followedId);
  }
}
