import { FollowerServiceImpl } from "./follower.service.impl";
import { FollowerRepository } from "../repository";
import { ValidationException, NotFoundException } from "@utils/errors";

// Mock the utils
jest.mock("@utils/errors", () => ({
  ValidationException: jest.fn().mockImplementation((errors) => {
    const error = new Error("Validation Error");
    error.name = "ValidationException";
    (error as any).errors = errors;
    return error;
  }),
  NotFoundException: jest.fn().mockImplementation((message) => {
    const error = new Error(message);
    error.name = "NotFoundException";
    return error;
  }),
}));

describe("FollowerServiceImpl", () => {
  let followerService: FollowerServiceImpl;
  let mockFollowerRepository: jest.Mocked<FollowerRepository>;

  beforeEach(() => {
    mockFollowerRepository = {
      isFollowing: jest.fn(),
      followUser: jest.fn(),
      unfollowUser: jest.fn(),
    } as any;

    followerService = new FollowerServiceImpl(mockFollowerRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("followUser", () => {
    it("should successfully follow a user", async () => {
      const followerId = "user-123";
      const followedId = "user-456";

      mockFollowerRepository.isFollowing.mockResolvedValue(false);
      mockFollowerRepository.followUser.mockResolvedValue(undefined);

      await followerService.followUser(followerId, followedId);

      expect(mockFollowerRepository.isFollowing).toHaveBeenCalledWith(
        followerId,
        followedId
      );
      expect(mockFollowerRepository.followUser).toHaveBeenCalledWith(
        followerId,
        followedId
      );
    });

    it("should throw ValidationException when trying to follow themselves", async () => {
      const userId = "user-123";

      await expect(followerService.followUser(userId, userId)).rejects.toThrow(
        "Validation Error"
      );
      expect(ValidationException).toHaveBeenCalledWith([
        { field: "userId", message: "You cannot follow yourself" },
      ]);
    });

    it("should throw ValidationException when already following the user", async () => {
      const followerId = "user-123";
      const followedId = "user-456";

      mockFollowerRepository.isFollowing.mockResolvedValue(true);

      await expect(
        followerService.followUser(followerId, followedId)
      ).rejects.toThrow("Validation Error");
      expect(ValidationException).toHaveBeenCalledWith([
        { field: "userId", message: "You already follow this user" },
      ]);
    });
  });

  describe("unfollowUser", () => {
    it("should successfully unfollow a user", async () => {
      const followerId = "user-123";
      const followedId = "user-456";

      mockFollowerRepository.isFollowing.mockResolvedValue(true);
      mockFollowerRepository.unfollowUser.mockResolvedValue(undefined);

      await followerService.unfollowUser(followerId, followedId);

      expect(mockFollowerRepository.isFollowing).toHaveBeenCalledWith(
        followerId,
        followedId
      );
      expect(mockFollowerRepository.unfollowUser).toHaveBeenCalledWith(
        followerId,
        followedId
      );
    });

    it("should throw ValidationException when trying to unfollow themselves", async () => {
      const userId = "user-123";

      await expect(
        followerService.unfollowUser(userId, userId)
      ).rejects.toThrow("Validation Error");
      expect(ValidationException).toHaveBeenCalledWith([
        { field: "userId", message: "You cannot unfollow yourself" },
      ]);
    });

    it("should throw NotFoundException when not following the user", async () => {
      const followerId = "user-123";
      const followedId = "user-456";

      mockFollowerRepository.isFollowing.mockResolvedValue(false);

      await expect(
        followerService.unfollowUser(followerId, followedId)
      ).rejects.toThrow("You do not follow this user");
      expect(NotFoundException).toHaveBeenCalledWith(
        "You do not follow this user"
      );
    });
  });
});
