import { ChatServiceImpl } from "./chat.service.impl";
import { ChatRepository } from "../repository";
import { FollowerRepository } from "@domains/follower/repository";
import { UserRepository } from "@domains/user/repository";
import { ForbiddenException, ValidationException } from "@utils/errors";
import {
  SendMessageInputDTO,
  MarkAsReadInputDTO,
  MessageDTO,
  ConversationDTO,
} from "../dto";
import { CursorPagination } from "@types";

// Mock the utils
jest.mock("@utils/errors", () => ({
  ForbiddenException: jest.fn().mockImplementation(() => {
    const error = new Error(
      "Forbidden. You are not allowed to perform this action"
    );
    error.name = "ForbiddenException";
    return error;
  }),
  ValidationException: jest.fn().mockImplementation((errors) => {
    const error = new Error("Validation Error");
    error.name = "ValidationException";
    (error as any).errors = errors;
    return error;
  }),
}));

describe("ChatServiceImpl", () => {
  let chatService: ChatServiceImpl;
  let mockChatRepository: jest.Mocked<ChatRepository>;
  let mockFollowerRepository: jest.Mocked<FollowerRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockChatRepository = {
      createMessage: jest.fn(),
      getMessagesBetweenUsers: jest.fn(),
      getConversationsForUser: jest.fn(),
      markMessagesAsRead: jest.fn(),
      getUnreadMessageCount: jest.fn(),
    } as any;

    mockFollowerRepository = {
      isFollowing: jest.fn(),
    } as any;

    mockUserRepository = {
      getById: jest.fn(),
    } as any;

    chatService = new ChatServiceImpl(
      mockChatRepository,
      mockFollowerRepository,
      mockUserRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("sendMessage", () => {
    const senderId = "user-123";
    const receiverId = "user-456";
    const messageData: SendMessageInputDTO = {
      content: "Hello, how are you?",
    };

    it("should successfully send a message when users can chat", async () => {
      const mockMessage: MessageDTO = {
        id: "message-1",
        senderId,
        receiverId,
        content: messageData.content,
        createdAt: new Date(),
      } as MessageDTO;

      // Mock users exist and have public profiles
      mockUserRepository.getById
        .mockResolvedValueOnce({ id: senderId, isPrivate: false } as any)
        .mockResolvedValueOnce({ id: receiverId, isPrivate: false } as any);

      mockChatRepository.createMessage.mockResolvedValue(mockMessage);

      const result = await chatService.sendMessage(
        senderId,
        receiverId,
        messageData
      );

      expect(mockChatRepository.createMessage).toHaveBeenCalledWith(
        senderId,
        receiverId,
        messageData.content.trim()
      );
      expect(result).toEqual(mockMessage);
    });

    it("should throw ForbiddenException when users cannot chat", async () => {
      // Mock users with private profiles and no mutual follow
      mockUserRepository.getById
        .mockResolvedValueOnce({ id: senderId, isPrivate: true } as any)
        .mockResolvedValueOnce({ id: receiverId, isPrivate: true } as any);

      mockFollowerRepository.isFollowing
        .mockResolvedValueOnce(false) // sender doesn't follow receiver
        .mockResolvedValueOnce(false); // receiver doesn't follow sender

      await expect(
        chatService.sendMessage(senderId, receiverId, messageData)
      ).rejects.toThrow(
        "Forbidden. You are not allowed to perform this action"
      );
    });

    it("should throw ValidationException for empty message content", async () => {
      const emptyMessageData: SendMessageInputDTO = { content: "   " };

      // Mock users can chat
      mockUserRepository.getById
        .mockResolvedValueOnce({ id: senderId, isPrivate: false } as any)
        .mockResolvedValueOnce({ id: receiverId, isPrivate: false } as any);

      await expect(
        chatService.sendMessage(senderId, receiverId, emptyMessageData)
      ).rejects.toThrow("Validation Error");
      expect(ValidationException).toHaveBeenCalledWith([
        { field: "content", message: "Message content cannot be empty" },
      ]);
    });

    it("should throw ValidationException for message content exceeding 500 characters", async () => {
      const longMessageData: SendMessageInputDTO = { content: "a".repeat(501) };

      // Mock users can chat
      mockUserRepository.getById
        .mockResolvedValueOnce({ id: senderId, isPrivate: false } as any)
        .mockResolvedValueOnce({ id: receiverId, isPrivate: false } as any);

      await expect(
        chatService.sendMessage(senderId, receiverId, longMessageData)
      ).rejects.toThrow("Validation Error");
      expect(ValidationException).toHaveBeenCalledWith([
        {
          field: "content",
          message: "Message content cannot exceed 500 characters",
        },
      ]);
    });
  });

  describe("getConversation", () => {
    const userId = "user-123";
    const partnerId = "user-456";
    const options: CursorPagination = {
      limit: 20,
      before: undefined,
      after: undefined,
    };

    it("should return conversation messages when users can chat", async () => {
      const mockMessages: MessageDTO[] = [
        {
          id: "msg-1",
          senderId: userId,
          receiverId: partnerId,
          content: "Hi",
        } as MessageDTO,
        {
          id: "msg-2",
          senderId: partnerId,
          receiverId: userId,
          content: "Hello",
        } as MessageDTO,
      ];

      // Mock users can chat
      mockUserRepository.getById
        .mockResolvedValueOnce({ id: userId, isPrivate: false } as any)
        .mockResolvedValueOnce({ id: partnerId, isPrivate: false } as any);

      mockChatRepository.getMessagesBetweenUsers.mockResolvedValue(
        mockMessages
      );

      const result = await chatService.getConversation(
        userId,
        partnerId,
        options
      );

      expect(mockChatRepository.getMessagesBetweenUsers).toHaveBeenCalledWith(
        userId,
        partnerId,
        options
      );
      expect(result).toEqual(mockMessages);
    });

    it("should throw ForbiddenException when users cannot chat", async () => {
      // Mock users cannot chat
      mockUserRepository.getById
        .mockResolvedValueOnce({ id: userId, isPrivate: true } as any)
        .mockResolvedValueOnce({ id: partnerId, isPrivate: true } as any);

      mockFollowerRepository.isFollowing
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);

      await expect(
        chatService.getConversation(userId, partnerId, options)
      ).rejects.toThrow(
        "Forbidden. You are not allowed to perform this action"
      );
    });
  });

  describe("canUsersChat", () => {
    const userId1 = "user-123";
    const userId2 = "user-456";

    it("should return false when users try to chat with themselves", async () => {
      const result = await chatService.canUsersChat(userId1, userId1);
      expect(result).toBe(false);
    });

    it("should return false when one user does not exist", async () => {
      mockUserRepository.getById
        .mockResolvedValueOnce({ id: userId1 } as any)
        .mockResolvedValueOnce(null);

      const result = await chatService.canUsersChat(userId1, userId2);
      expect(result).toBe(false);
    });

    it("should return true when both users have public accounts", async () => {
      mockUserRepository.getById
        .mockResolvedValueOnce({ id: userId1, isPrivate: false } as any)
        .mockResolvedValueOnce({ id: userId2, isPrivate: false } as any);

      const result = await chatService.canUsersChat(userId1, userId2);
      expect(result).toBe(true);
    });

    it("should return true when users have mutual follow (private accounts)", async () => {
      mockUserRepository.getById
        .mockResolvedValueOnce({ id: userId1, isPrivate: true } as any)
        .mockResolvedValueOnce({ id: userId2, isPrivate: true } as any);

      mockFollowerRepository.isFollowing
        .mockResolvedValueOnce(true) // user1 follows user2
        .mockResolvedValueOnce(true); // user2 follows user1

      const result = await chatService.canUsersChat(userId1, userId2);
      expect(result).toBe(true);
    });

    it("should return false when users do not have mutual follow (private accounts)", async () => {
      mockUserRepository.getById
        .mockResolvedValueOnce({ id: userId1, isPrivate: true } as any)
        .mockResolvedValueOnce({ id: userId2, isPrivate: true } as any);

      mockFollowerRepository.isFollowing
        .mockResolvedValueOnce(true) // user1 follows user2
        .mockResolvedValueOnce(false); // user2 doesn't follow user1

      const result = await chatService.canUsersChat(userId1, userId2);
      expect(result).toBe(false);
    });
  });

  describe("markAsRead", () => {
    it("should mark messages as read when users can chat", async () => {
      const userId = "user-123";
      const data: MarkAsReadInputDTO = { conversationPartnerId: "user-456" };

      // Mock users can chat
      mockUserRepository.getById
        .mockResolvedValueOnce({ id: userId, isPrivate: false } as any)
        .mockResolvedValueOnce({
          id: data.conversationPartnerId,
          isPrivate: false,
        } as any);

      mockChatRepository.markMessagesAsRead.mockResolvedValue(undefined);

      await chatService.markAsRead(userId, data);

      expect(mockChatRepository.markMessagesAsRead).toHaveBeenCalledWith(
        data.conversationPartnerId,
        userId
      );
    });
  });

  describe("getUnreadCount", () => {
    it("should return unread message count", async () => {
      const userId = "user-123";
      const unreadCount = 5;

      mockChatRepository.getUnreadMessageCount.mockResolvedValue(unreadCount);

      const result = await chatService.getUnreadCount(userId);

      expect(mockChatRepository.getUnreadMessageCount).toHaveBeenCalledWith(
        userId
      );
      expect(result).toBe(unreadCount);
    });
  });
});
