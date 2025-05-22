/**
 * Interface for the follower service
 */
export interface FollowerService {
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
}
