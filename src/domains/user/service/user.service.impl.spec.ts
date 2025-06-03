import { CursorPagination } from "@types";
import { s3Service } from "@utils";
import { NotFoundException } from "@utils/errors";
import { ImageUploadRequestDTO, UserViewDTO } from "../dto";
import { UserRepository } from "../repository";
import { UserServiceImpl } from "./user.service.impl";

// Mock the utils/errors module specifically
jest.mock("@utils/errors", () => ({
  NotFoundException: jest.fn().mockImplementation((message) => {
    const error = new Error(message);
    error.name = "NotFoundException";
    return error;
  }),
}));

// Mock the s3Service from utils
jest.mock("@utils", () => ({
  s3Service: {
    isValidImageExtension: jest.fn(),
    generateProfilePictureKey: jest.fn(),
    generateUploadUrl: jest.fn(),
  },
}));

describe("UserServiceImpl", () => {
  let userService: UserServiceImpl;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      getById: jest.fn(),
      getByIdWithFollowInfo: jest.fn(),
      getUsersByUsername: jest.fn(),
      delete: jest.fn(),
      updatePrivacy: jest.fn(),
      getUserLikes: jest.fn(),
      getUserRetweets: jest.fn(),
      getUserComments: jest.fn(),
      updateProfilePicture: jest.fn(),
      incrementCommentsCount: jest.fn(),
    } as any;

    userService = new UserServiceImpl(mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserById", () => {
    it("should return user when found", async () => {
      const userId = "user-123";
      const mockUser: UserViewDTO = {
        id: userId,
        name: "Test User",
        username: "testuser",
        profilePicture: null,
        likesCount: 0,
        retweetsCount: 0,
        commentsCount: 0,
        followsYou: false,
        isPrivate: false,
      };

      mockUserRepository.getById.mockResolvedValue(mockUser);

      const result = await userService.getUserById(userId);

      expect(mockUserRepository.getById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it("should throw NotFoundException when user not found", async () => {
      const userId = "non-existent";
      mockUserRepository.getById.mockResolvedValue(null);

      await expect(userService.getUserById(userId)).rejects.toThrow("user");
      expect(NotFoundException).toHaveBeenCalledWith("user");
    });
  });

  describe("getUserWithFollowInfo", () => {
    it("should return user with follow info when found", async () => {
      const userId = "user-123";
      const targetUserId = "target-456";
      const mockUser: UserViewDTO = {
        id: targetUserId,
        name: "Target User",
        username: "targetuser",
        profilePicture: null,
        likesCount: 0,
        retweetsCount: 0,
        commentsCount: 0,
        followsYou: false,
        isPrivate: false,
      };

      mockUserRepository.getByIdWithFollowInfo.mockResolvedValue(mockUser);

      const result = await userService.getUserWithFollowInfo(
        userId,
        targetUserId
      );

      expect(mockUserRepository.getByIdWithFollowInfo).toHaveBeenCalledWith(
        userId,
        targetUserId
      );
      expect(result).toEqual(mockUser);
    });

    it("should throw NotFoundException when user not found", async () => {
      const userId = "user-123";
      const targetUserId = "non-existent";
      mockUserRepository.getByIdWithFollowInfo.mockResolvedValue(null);

      await expect(
        userService.getUserWithFollowInfo(userId, targetUserId)
      ).rejects.toThrow("user");
      expect(NotFoundException).toHaveBeenCalledWith("user");
    });
  });

  describe("getUsersByUsername", () => {
    it("should return users matching username", async () => {
      const username = "test";
      const options: CursorPagination = { limit: 10, after: "user-0" };
      const mockUsers: UserViewDTO[] = [
        {
          id: "user-1",
          name: "Test User 1",
          username: "testuser1",
          profilePicture: null,
          likesCount: 0,
          retweetsCount: 0,
          commentsCount: 0,
          followsYou: false,
          isPrivate: false,
        },
        {
          id: "user-2",
          name: "Test User 2",
          username: "testuser2",
          profilePicture: null,
          likesCount: 0,
          retweetsCount: 0,
          commentsCount: 0,
          followsYou: false,
          isPrivate: false,
        },
      ];

      mockUserRepository.getUsersByUsername.mockResolvedValue(mockUsers);

      const result = await userService.getUsersByUsername(username, options);

      expect(mockUserRepository.getUsersByUsername).toHaveBeenCalledWith(
        username,
        options
      );
      expect(result).toEqual(mockUsers);
    });
  });

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      const userId = "user-123";
      mockUserRepository.delete.mockResolvedValue(undefined);

      await userService.deleteUser(userId);

      expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
    });
  });

  describe("updatePrivacy", () => {
    it("should update user privacy successfully", async () => {
      const userId = "user-123";
      const isPrivate = true;
      mockUserRepository.updatePrivacy.mockResolvedValue(undefined);

      await userService.updatePrivacy(userId, isPrivate);

      expect(mockUserRepository.updatePrivacy).toHaveBeenCalledWith(
        userId,
        isPrivate
      );
    });
  });

  describe("generateProfilePictureUploadUrl", () => {
    it("should generate upload URL successfully", async () => {
      const userId = "user-123";
      const request: ImageUploadRequestDTO = {
        fileExtension: "jpg",
        contentType: "image/jpeg",
      };
      const imageKey = "profile-pictures/user-123.jpg";
      const uploadUrl = "https://s3.amazonaws.com/signed-url";

      (s3Service.isValidImageExtension as jest.Mock).mockReturnValue(true);
      (s3Service.generateProfilePictureKey as jest.Mock).mockReturnValue(
        imageKey
      );
      (s3Service.generateUploadUrl as jest.Mock).mockResolvedValue(uploadUrl);

      const result = await userService.generateProfilePictureUploadUrl(
        userId,
        request
      );

      expect(s3Service.isValidImageExtension).toHaveBeenCalledWith(
        request.fileExtension
      );
      expect(s3Service.generateProfilePictureKey).toHaveBeenCalledWith(
        userId,
        request.fileExtension
      );
      expect(s3Service.generateUploadUrl).toHaveBeenCalledWith(
        imageKey,
        request.contentType
      );
      expect(result.uploadUrl).toBe(uploadUrl);
      expect(result.imageKey).toBe(imageKey);
    });

    it("should throw error for invalid file extension", async () => {
      const userId = "user-123";
      const request: ImageUploadRequestDTO = {
        fileExtension: "txt",
        contentType: "text/plain",
      };

      (s3Service.isValidImageExtension as jest.Mock).mockReturnValue(false);

      await expect(
        userService.generateProfilePictureUploadUrl(userId, request)
      ).rejects.toThrow(
        "Invalid file extension. Only jpg, jpeg, png, gif, and webp are allowed."
      );
    });
  });

  describe("updateUserProfilePicture", () => {
    it("should update user profile picture successfully", async () => {
      const userId = "user-123";
      const profilePictureKey = "profile-pictures/user-123.jpg";
      mockUserRepository.updateProfilePicture.mockResolvedValue(undefined);

      await userService.updateUserProfilePicture(userId, profilePictureKey);

      expect(mockUserRepository.updateProfilePicture).toHaveBeenCalledWith(
        userId,
        profilePictureKey
      );
    });
  });
});
