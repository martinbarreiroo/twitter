import { ReactionServiceImpl } from "./reaction.service.impl";
import { ReactionRepository } from "../repository";
import { UserRepository } from "@domains/user/repository";
import { PostRepository } from "@domains/post/repository";
import { ReactionInputDTO, ReactionOutputDTO } from "../dto";
import { ReactionEnum } from "../enum/reaction.enum";
import {
  NotFoundException,
  ConflictException,
  ValidationException,
} from "@utils/errors";

// Mock the utils
jest.mock("@utils/errors", () => ({
  NotFoundException: jest.fn().mockImplementation((message) => {
    const error = new Error(message);
    error.name = "NotFoundException";
    return error;
  }),
  ConflictException: jest.fn().mockImplementation((message) => {
    const error = new Error(message);
    error.name = "ConflictException";
    return error;
  }),
  ValidationException: jest.fn().mockImplementation((errors) => {
    const error = new Error("Validation Error");
    error.name = "ValidationException";
    (error as any).errors = errors;
    return error;
  }),
}));

describe("ReactionServiceImpl", () => {
  let reactionService: ReactionServiceImpl;
  let mockReactionRepository: jest.Mocked<ReactionRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockPostRepository: jest.Mocked<PostRepository>;

  beforeEach(() => {
    mockReactionRepository = {
      findReactionByUserAndPostAndType: jest.fn(),
      createReaction: jest.fn(),
      findReactionById: jest.fn(),
      deleteReaction: jest.fn(),
    } as any;

    mockUserRepository = {
      incrementLikesCount: jest.fn(),
      incrementRetweetsCount: jest.fn(),
      decrementLikesCount: jest.fn(),
      decrementRetweetsCount: jest.fn(),
    } as any;

    mockPostRepository = {
      incrementLikesCount: jest.fn(),
      incrementRetweetsCount: jest.fn(),
      decrementLikesCount: jest.fn(),
      decrementRetweetsCount: jest.fn(),
    } as any;

    reactionService = new ReactionServiceImpl(
      mockReactionRepository,
      mockUserRepository,
      mockPostRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createReaction", () => {
    const reactionData: ReactionInputDTO = {
      userId: "user-123",
      postId: "post-456",
      type: ReactionEnum.LIKE,
    };

    it("should successfully create a like reaction", async () => {
      const mockReaction: ReactionOutputDTO = {
        id: "reaction-123",
        ...reactionData,
        createdAt: new Date(),
      } as ReactionOutputDTO;

      mockReactionRepository.findReactionByUserAndPostAndType.mockResolvedValue(
        null
      );
      mockReactionRepository.createReaction.mockResolvedValue(mockReaction);
      mockUserRepository.incrementLikesCount.mockResolvedValue(undefined);
      mockPostRepository.incrementLikesCount.mockResolvedValue(undefined);

      const result = await reactionService.createReaction(reactionData);

      expect(
        mockReactionRepository.findReactionByUserAndPostAndType
      ).toHaveBeenCalledWith(
        reactionData.userId,
        reactionData.postId,
        reactionData.type
      );
      expect(mockReactionRepository.createReaction).toHaveBeenCalledWith(
        reactionData
      );
      expect(mockUserRepository.incrementLikesCount).toHaveBeenCalledWith(
        reactionData.userId
      );
      expect(mockPostRepository.incrementLikesCount).toHaveBeenCalledWith(
        reactionData.postId
      );
      expect(result).toEqual(mockReaction);
    });

    it("should successfully create a retweet reaction", async () => {
      const retweetData: ReactionInputDTO = {
        ...reactionData,
        type: ReactionEnum.RETWEET,
      };
      const mockReaction: ReactionOutputDTO = {
        id: "reaction-123",
        ...retweetData,
        createdAt: new Date(),
      } as ReactionOutputDTO;

      mockReactionRepository.findReactionByUserAndPostAndType.mockResolvedValue(
        null
      );
      mockReactionRepository.createReaction.mockResolvedValue(mockReaction);
      mockUserRepository.incrementRetweetsCount.mockResolvedValue(undefined);
      mockPostRepository.incrementRetweetsCount.mockResolvedValue(undefined);

      const result = await reactionService.createReaction(retweetData);

      expect(mockUserRepository.incrementRetweetsCount).toHaveBeenCalledWith(
        retweetData.userId
      );
      expect(mockPostRepository.incrementRetweetsCount).toHaveBeenCalledWith(
        retweetData.postId
      );
      expect(result).toEqual(mockReaction);
    });

    it("should throw ConflictException when reaction already exists", async () => {
      const existingReaction: ReactionOutputDTO = {
        id: "existing-reaction",
        ...reactionData,
      } as ReactionOutputDTO;

      mockReactionRepository.findReactionByUserAndPostAndType.mockResolvedValue(
        existingReaction
      );

      await expect(
        reactionService.createReaction(reactionData)
      ).rejects.toThrow("Reaction already exists");
      expect(ConflictException).toHaveBeenCalledWith("Reaction already exists");
    });
  });

  describe("createReactionWithValidation", () => {
    const userId = "user-123";
    const postId = "post-456";

    it("should create reaction with valid type", async () => {
      const type = ReactionEnum.LIKE;
      const mockReaction: ReactionOutputDTO = {
        id: "reaction-123",
        userId,
        postId,
        type,
      } as ReactionOutputDTO;

      mockReactionRepository.findReactionByUserAndPostAndType.mockResolvedValue(
        null
      );
      mockReactionRepository.createReaction.mockResolvedValue(mockReaction);
      mockUserRepository.incrementLikesCount.mockResolvedValue(undefined);
      mockPostRepository.incrementLikesCount.mockResolvedValue(undefined);

      const result = await reactionService.createReactionWithValidation(
        userId,
        postId,
        type
      );

      expect(result).toEqual(mockReaction);
    });

    it("should throw ValidationException for invalid reaction type", async () => {
      const invalidType = "invalid_type";

      await expect(
        reactionService.createReactionWithValidation(
          userId,
          postId,
          invalidType
        )
      ).rejects.toThrow("Validation Error");

      expect(ValidationException).toHaveBeenCalledWith([
        {
          field: "type",
          message: "Invalid reaction type. Use 'like' or 'retweet'",
        },
      ]);
    });

    it("should throw ValidationException for empty type", async () => {
      const emptyType = "";

      await expect(
        reactionService.createReactionWithValidation(userId, postId, emptyType)
      ).rejects.toThrow("Validation Error");
    });
  });

  describe("getReactionById", () => {
    it("should return reaction when found", async () => {
      const reactionId = "reaction-123";
      const mockReaction: ReactionOutputDTO = {
        id: reactionId,
        userId: "user-123",
        postId: "post-456",
        type: ReactionEnum.LIKE,
      } as ReactionOutputDTO;

      mockReactionRepository.findReactionById.mockResolvedValue(mockReaction);

      const result = await reactionService.getReactionById(reactionId);

      expect(mockReactionRepository.findReactionById).toHaveBeenCalledWith(
        reactionId
      );
      expect(result).toEqual(mockReaction);
    });

    it("should throw NotFoundException when reaction not found", async () => {
      const reactionId = "non-existent";
      mockReactionRepository.findReactionById.mockResolvedValue(null);

      await expect(reactionService.getReactionById(reactionId)).rejects.toThrow(
        "Reaction not found"
      );
      expect(NotFoundException).toHaveBeenCalledWith("Reaction not found");
    });
  });

  describe("deleteReaction", () => {
    it("should successfully delete a like reaction and decrement counters", async () => {
      const reactionId = "reaction-123";
      const mockReaction: ReactionOutputDTO = {
        id: reactionId,
        userId: "user-123",
        postId: "post-456",
        type: ReactionEnum.LIKE,
      } as ReactionOutputDTO;

      mockReactionRepository.findReactionById.mockResolvedValue(mockReaction);
      mockReactionRepository.deleteReaction.mockResolvedValue(true);
      mockUserRepository.decrementLikesCount.mockResolvedValue(undefined);
      mockPostRepository.decrementLikesCount.mockResolvedValue(undefined);

      const result = await reactionService.deleteReaction(reactionId);

      expect(mockReactionRepository.findReactionById).toHaveBeenCalledWith(
        reactionId
      );
      expect(mockReactionRepository.deleteReaction).toHaveBeenCalledWith(
        reactionId
      );
      expect(mockUserRepository.decrementLikesCount).toHaveBeenCalledWith(
        mockReaction.userId
      );
      expect(mockPostRepository.decrementLikesCount).toHaveBeenCalledWith(
        mockReaction.postId
      );
      expect(result).toBe(true);
    });

    it("should successfully delete a retweet reaction and decrement counters", async () => {
      const reactionId = "reaction-123";
      const mockReaction: ReactionOutputDTO = {
        id: reactionId,
        userId: "user-123",
        postId: "post-456",
        type: ReactionEnum.RETWEET,
      } as ReactionOutputDTO;

      mockReactionRepository.findReactionById.mockResolvedValue(mockReaction);
      mockReactionRepository.deleteReaction.mockResolvedValue(true);
      mockUserRepository.decrementRetweetsCount.mockResolvedValue(undefined);
      mockPostRepository.decrementRetweetsCount.mockResolvedValue(undefined);

      const result = await reactionService.deleteReaction(reactionId);

      expect(mockUserRepository.decrementRetweetsCount).toHaveBeenCalledWith(
        mockReaction.userId
      );
      expect(mockPostRepository.decrementRetweetsCount).toHaveBeenCalledWith(
        mockReaction.postId
      );
      expect(result).toBe(true);
    });

    it("should throw NotFoundException when reaction not found (first check)", async () => {
      const reactionId = "non-existent";
      mockReactionRepository.findReactionById.mockResolvedValue(null);

      await expect(reactionService.deleteReaction(reactionId)).rejects.toThrow(
        "Reaction not found"
      );
      expect(NotFoundException).toHaveBeenCalledWith("Reaction not found");
    });

    it("should throw NotFoundException when deletion fails", async () => {
      const reactionId = "reaction-123";
      const mockReaction: ReactionOutputDTO = {
        id: reactionId,
        userId: "user-123",
        postId: "post-456",
        type: ReactionEnum.LIKE,
      } as ReactionOutputDTO;

      mockReactionRepository.findReactionById.mockResolvedValue(mockReaction);
      mockReactionRepository.deleteReaction.mockResolvedValue(false);

      await expect(reactionService.deleteReaction(reactionId)).rejects.toThrow(
        "Reaction not found"
      );
      expect(NotFoundException).toHaveBeenCalledWith("Reaction not found");
    });
  });
});
