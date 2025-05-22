/**
 * Interface for the follower repository
 */
export interface FollowerRepository {
  /**
   * Follow a user
   * @param followerId - The ID of the follower user
   * @param followedId - The ID of the user to be followed
   * @returns Promise<void>
   */
  followUser(followerId: string, followedId: string): Promise<void>;

  /**
   * Unfollow a user
   * @param followerId - The ID of the follower user
   * @param followedId - The ID of the user to be unfollowed
   * @returns Promise<void>
   */
  unfollowUser(followerId: string, followedId: string): Promise<void>;

  /**
   * Check if a user follows another user
   * @param followerId - The ID of the follower user
   * @param followedId - The ID of the followed user
   * @returns Promise<boolean> - True if the user follows the other user, false otherwise
   */
  isFollowing(followerId: string, followedId: string): Promise<boolean>;
}
