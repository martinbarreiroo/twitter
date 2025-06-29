import { PrismaClient } from "@prisma/client";
import { CursorPagination } from "@types";
import { ConversationDTO, MessageDTO } from "../dto";
import { ChatRepository } from "./chat.repository";

export class ChatRepositoryImpl implements ChatRepository {
  constructor(private readonly db: PrismaClient) {}

  async createMessage(
    senderId: string,
    receiverId: string,
    content: string
  ): Promise<MessageDTO> {
    const message = await this.db.message.create({
      data: {
        senderId,
        receiverId,
        content,
      },
    });

    return new MessageDTO(message);
  }

  async getMessagesBetweenUsers(
    userId1: string,
    userId2: string,
    options: CursorPagination
  ): Promise<MessageDTO[]> {
    // Build the where clause with timestamp filtering
    const whereClause: any = {
      OR: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    };

    // Add timestamp filtering based on cursor
    if (options.before) {
      whereClause.createdAt = {
        lt: new Date(options.before),
      };
    } else if (options.after) {
      whereClause.createdAt = {
        gt: new Date(options.after),
      };
    }

    const messages = await this.db.message.findMany({
      where: whereClause,
      take: options.limit || 20, // Default limit
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],
    });

    return messages.map((message) => new MessageDTO(message));
  }

  async getConversationsForUser(userId: string): Promise<ConversationDTO[]> {
    // Get all unique conversation partners
    const conversations = await this.db.$queryRaw<any[]>`
      SELECT DISTINCT
        CASE 
          WHEN m."senderId" = ${userId}::uuid THEN m."receiverId"
          ELSE m."senderId"
        END as "participantId",
        u.name as "participantName",
        u.username as "participantUsername",
        u."profilePicture" as "participantProfilePicture"
      FROM "Message" m
      JOIN "User" u ON (
        CASE 
          WHEN m."senderId" = ${userId}::uuid THEN m."receiverId" = u.id
          ELSE m."senderId" = u.id
        END
      )
      WHERE m."senderId" = ${userId}::uuid OR m."receiverId" = ${userId}::uuid
    `;

    // Get last message and unread count for each conversation
    const conversationDTOs: ConversationDTO[] = [];

    for (const conv of conversations) {
      // Get last message
      const lastMessage = await this.db.message.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: conv.participantId },
            { senderId: conv.participantId, receiverId: userId },
          ],
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Get unread count
      const unreadCount = await this.getUnreadCountForConversation(
        userId,
        conv.participantId
      );

      conversationDTOs.push(
        new ConversationDTO({
          participantId: conv.participantId,
          participantName: conv.participantName,
          participantUsername: conv.participantUsername,
          participantProfilePicture: conv.participantProfilePicture,
          lastMessage: lastMessage ? new MessageDTO(lastMessage) : undefined,
          unreadCount,
        })
      );
    }

    // Sort by last message timestamp
    return conversationDTOs.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return (
        b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()
      );
    });
  }

  async markMessagesAsRead(
    senderId: string,
    receiverId: string
  ): Promise<void> {
    await this.db.message.updateMany({
      where: {
        senderId,
        receiverId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    return await this.db.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });
  }

  async getUnreadCountForConversation(
    userId: string,
    partnerId: string
  ): Promise<number> {
    return await this.db.message.count({
      where: {
        senderId: partnerId,
        receiverId: userId,
        isRead: false,
      },
    });
  }

  async getUserById(
    userId: string
  ): Promise<{ id: string; isPrivate: boolean } | null> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isPrivate: true,
      },
    });

    return user;
  }
}
