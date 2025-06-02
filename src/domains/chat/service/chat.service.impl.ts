import { ChatRepository } from "../repository";
import { FollowerRepository } from "@domains/follower/repository";
import { UserRepository } from "@domains/user/repository";
import {
  MessageDTO,
  ConversationDTO,
  SendMessageInputDTO,
  MarkAsReadInputDTO,
} from "../dto";
import { CursorPagination } from "@types";
import { ChatService } from "./chat.service";
import { ForbiddenException, ValidationException } from "@utils/errors";

export class ChatServiceImpl implements ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly followerRepository: FollowerRepository,
    private readonly userRepository: UserRepository
  ) {}

  async sendMessage(
    senderId: string,
    receiverId: string,
    data: SendMessageInputDTO
  ): Promise<MessageDTO> {
    // Validate that users can chat (mutual follow)
    const canChat = await this.canUsersChat(senderId, receiverId);
    if (!canChat) {
      throw new ForbiddenException();
    }

    // Validate message content
    if (data.content.trim().length === 0) {
      throw new ValidationException([
        { field: "content", message: "Message content cannot be empty" },
      ]);
    }

    if (data.content.length > 500) {
      throw new ValidationException([
        {
          field: "content",
          message: "Message content cannot exceed 500 characters",
        },
      ]);
    }

    return await this.chatRepository.createMessage(
      senderId,
      receiverId,
      data.content.trim()
    );
  }

  async getConversation(
    userId: string,
    partnerId: string,
    options: CursorPagination
  ): Promise<MessageDTO[]> {
    // Validate that users can chat
    const canChat = await this.canUsersChat(userId, partnerId);
    if (!canChat) {
      throw new ForbiddenException();
    }

    return await this.chatRepository.getMessagesBetweenUsers(
      userId,
      partnerId,
      options
    );
  }

  async getConversations(userId: string): Promise<ConversationDTO[]> {
    const conversations = await this.chatRepository.getConversationsForUser(
      userId
    );

    // Filter conversations to only include mutual follows
    const filteredConversations: ConversationDTO[] = [];

    for (const conversation of conversations) {
      const canChat = await this.canUsersChat(
        userId,
        conversation.participantId
      );
      if (canChat) {
        filteredConversations.push(conversation);
      }
    }

    return filteredConversations;
  }

  async markAsRead(userId: string, data: MarkAsReadInputDTO): Promise<void> {
    // Validate that users can chat
    const canChat = await this.canUsersChat(userId, data.conversationPartnerId);
    if (!canChat) {
      throw new ForbiddenException();
    }

    await this.chatRepository.markMessagesAsRead(
      data.conversationPartnerId,
      userId
    );
  }

  async canUsersChat(userId1: string, userId2: string): Promise<boolean> {
    if (userId1 === userId2) {
      console.log("Chat validation failed: Users cannot chat with themselves");
      return false; // Users cannot chat with themselves
    }

    // Get both users' privacy settings
    const [user1, user2] = await Promise.all([
      this.userRepository.getById(userId1),
      this.userRepository.getById(userId2),
    ]);

    if (!user1 || !user2) {
      console.log("Chat validation failed: One or both users do not exist", {
        user1: !!user1,
        user2: !!user2,
      });
      return false; // One or both users don't exist
    }

    console.log("Users found:", {
      user1: {
        id: user1.id,
        username: user1.username,
        isPrivate: user1.isPrivate,
      },
      user2: {
        id: user2.id,
        username: user2.username,
        isPrivate: user2.isPrivate,
      },
    });

    // If both users have public accounts, they can chat
    if (!user1.isPrivate && !user2.isPrivate) {
      console.log("Chat allowed: Both users have public accounts");
      return true;
    }

    console.log(
      "At least one user has private account, checking mutual follows..."
    );

    // If at least one user has a private account, require mutual follow
    const [user1FollowsUser2, user2FollowsUser1] = await Promise.all([
      this.followerRepository.isFollowing(userId1, userId2),
      this.followerRepository.isFollowing(userId2, userId1),
    ]);

    console.log("Follow status:", {
      user1FollowsUser2,
      user2FollowsUser1,
      mutualFollow: user1FollowsUser2 && user2FollowsUser1,
    });

    return user1FollowsUser2 && user2FollowsUser1;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.chatRepository.getUnreadMessageCount(userId);
  }
}
