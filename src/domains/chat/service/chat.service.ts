import {
  MessageDTO,
  ConversationDTO,
  SendMessageInputDTO,
  MarkAsReadInputDTO,
} from "../dto";
import { CursorPagination } from "@types";

export interface ChatService {
  /**
   * Send a message between users (validates mutual follow relationship)
   */
  sendMessage(
    senderId: string,
    receiverId: string,
    data: SendMessageInputDTO
  ): Promise<MessageDTO>;

  /**
   * Get messages between two users with pagination
   */
  getConversation(
    userId: string,
    partnerId: string,
    options: CursorPagination
  ): Promise<MessageDTO[]>;

  /**
   * Get all conversations for a user
   */
  getConversations(userId: string): Promise<ConversationDTO[]>;

  /**
   * Mark messages as read in a conversation
   */
  markAsRead(userId: string, data: MarkAsReadInputDTO): Promise<void>;

  /**
   * Check if two users can chat (mutual follow validation)
   */
  canUsersChat(userId1: string, userId2: string): Promise<boolean>;

  /**
   * Get unread message count for a user
   */
  getUnreadCount(userId: string): Promise<number>;
}
