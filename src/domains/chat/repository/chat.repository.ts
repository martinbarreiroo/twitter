import { MessageDTO, ConversationDTO } from "../dto";
import { CursorPagination } from "@types";

export interface ChatRepository {
  /**
   * Create a new message
   */
  createMessage(
    senderId: string,
    receiverId: string,
    content: string
  ): Promise<MessageDTO>;

  /**
   * Get messages between two users with pagination
   */
  getMessagesBetweenUsers(
    userId1: string,
    userId2: string,
    options: CursorPagination
  ): Promise<MessageDTO[]>;

  /**
   * Get all conversations for a user
   */
  getConversationsForUser(userId: string): Promise<ConversationDTO[]>;

  /**
   * Mark messages as read between two users
   */
  markMessagesAsRead(senderId: string, receiverId: string): Promise<void>;

  /**
   * Get unread message count for a user
   */
  getUnreadMessageCount(userId: string): Promise<number>;

  /**
   * Get unread message count for a specific conversation
   */
  getUnreadCountForConversation(
    userId: string,
    partnerId: string
  ): Promise<number>;
}
