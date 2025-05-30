import { Request, Response, Router } from "express";
import { Server as SocketIOServer, Socket } from "socket.io";
import HttpStatus from "http-status";
import "express-async-errors";
import {
  db,
  BodyValidation,
  socketAuthMiddleware,
  AuthenticatedSocket,
} from "@utils";
import { ChatService, ChatServiceImpl } from "../service";
import { ChatRepositoryImpl } from "../repository";
import { FollowerRepositoryImpl } from "@domains/follower/repository";
import { UserRepositoryImpl } from "@domains/user/repository";
import { SendMessageInputDTO, MarkAsReadInputDTO } from "../dto";
import { CursorPagination } from "@types";

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Real-time chat functionality
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SendMessageInput:
 *       type: object
 *       required:
 *         - content
 *         - receiverId
 *       properties:
 *         content:
 *           type: string
 *           maxLength: 500
 *           description: Message content
 *         receiverId:
 *           type: string
 *           format: uuid
 *           description: ID of the message recipient
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         content:
 *           type: string
 *         senderId:
 *           type: string
 *           format: uuid
 *         receiverId:
 *           type: string
 *           format: uuid
 *         isRead:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Conversation:
 *       type: object
 *       properties:
 *         participantId:
 *           type: string
 *           format: uuid
 *         participantName:
 *           type: string
 *         participantUsername:
 *           type: string
 *         participantProfilePicture:
 *           type: string
 *         lastMessage:
 *           $ref: '#/components/schemas/Message'
 *         unreadCount:
 *           type: integer
 */

export const chatRouter = Router();

// Use dependency injection
const chatService: ChatService = new ChatServiceImpl(
  new ChatRepositoryImpl(db),
  new FollowerRepositoryImpl(db),
  new UserRepositoryImpl(db)
);

/**
 * @swagger
 * /api/chat/conversations:
 *   get:
 *     summary: Get all active conversations for the authenticated user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conversation'
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
chatRouter.get("/conversations", async (req: Request, res: Response) => {
  const { userId } = res.locals.context;

  const conversations = await chatService.getConversations(userId);

  return res.status(HttpStatus.OK).json(conversations);
});

/**
 * @swagger
 * /api/chat/conversation/{partnerId}:
 *   get:
 *     summary: Get messages with a specific user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the conversation partner
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of messages to return
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Cursor for pagination (before message ID)
 *       - in: query
 *         name: after
 *         schema:
 *           type: string
 *         description: Cursor for pagination (after message ID)
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Users don't mutually follow each other
 *       500:
 *         description: Server error
 */
chatRouter.get(
  "/conversation/:partnerId",
  async (req: Request, res: Response) => {
    const { userId } = res.locals.context;
    const { partnerId } = req.params;
    const { limit, before, after } = req.query as Record<string, string>;

    const options: CursorPagination = {
      limit: Number(limit) || 20,
      before,
      after,
    };

    const messages = await chatService.getConversation(
      userId,
      partnerId,
      options
    );

    return res.status(HttpStatus.OK).json(messages);
  }
);

/**
 * @swagger
 * /api/chat/send:
 *   post:
 *     summary: Send a message (HTTP endpoint)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendMessageInput'
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Users don't mutually follow each other
 *       500:
 *         description: Server error
 */
chatRouter.post(
  "/send/:receiverId",
  BodyValidation(SendMessageInputDTO),
  async (req: Request, res: Response) => {
    const { userId } = res.locals.context;
    const { receiverId } = req.params;
    const content = req.body;

    const message = await chatService.sendMessage(userId, receiverId, content);

    return res.status(HttpStatus.CREATED).json(message);
  }
);

/**
 * @swagger
 * /api/chat/mark-read:
 *   post:
 *     summary: Mark messages as read in a conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationPartnerId
 *             properties:
 *               conversationPartnerId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Messages marked as read
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Users don't mutually follow each other
 *       500:
 *         description: Server error
 */
chatRouter.post(
  "/mark-read",
  BodyValidation(MarkAsReadInputDTO),
  async (req: Request, res: Response) => {
    const { userId } = res.locals.context;
    const data = req.body;

    await chatService.markAsRead(userId, data);

    return res
      .status(HttpStatus.OK)
      .json({ message: "Messages marked as read" });
  }
);

/**
 * @swagger
 * /api/chat/unread-count:
 *   get:
 *     summary: Get unread message count for the authenticated user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread message count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
chatRouter.get("/unread-count", async (req: Request, res: Response) => {
  const { userId } = res.locals.context;

  const count = await chatService.getUnreadCount(userId);

  return res.status(HttpStatus.OK).json({ count });
});

/**
 * @swagger
 * /api/chat/can-chat/{partnerId}:
 *   get:
 *     summary: Check if two users can chat with each other (debug endpoint)
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the potential chat partner
 *     responses:
 *       200:
 *         description: Chat permission status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 canChat:
 *                   type: boolean
 *                 reason:
 *                   type: string
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
chatRouter.get("/can-chat/:partnerId", async (req: Request, res: Response) => {
  const { userId } = res.locals.context;
  const { partnerId } = req.params;

  const canChat = await chatService.canUsersChat(userId, partnerId);

  return res.status(HttpStatus.OK).json({
    canChat,
    userId,
    partnerId,
    reason: canChat
      ? "Users can chat"
      : "Users cannot chat - check mutual follow or privacy settings",
  });
});

// Socket.IO event handlers
export const setupChatSocketHandlers = (io: SocketIOServer) => {
  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  io.on("connection", (socket: Socket) => {
    const authenticatedSocket = socket as AuthenticatedSocket;
    const userId = authenticatedSocket.userId;

    console.log(`User ${userId} connected to chat`);

    // Join user to their personal room for receiving messages
    authenticatedSocket.join(`user:${userId}`);

    // Handle sending messages
    authenticatedSocket.on(
      "sendMessage",
      async (
        receiverId: string,
        content: SendMessageInputDTO,
        callback?: (response: any) => void
      ) => {
        try {
          const message = await chatService.sendMessage(
            userId,
            receiverId,
            content
          );

          // Send message to both sender and receiver
          io.to(`user:${userId}`).emit("messageReceived", message);
          io.to(`user:${receiverId}`).emit("messageReceived", message);

          // Send acknowledgment to sender
          if (callback) {
            callback({ success: true, message });
          }
        } catch (error: any) {
          console.error("Error sending message:", error);
          if (callback) {
            callback({ success: false, error: error.message });
          }
        }
      }
    );

    // Handle marking messages as read
    authenticatedSocket.on(
      "markAsRead",
      async (data: MarkAsReadInputDTO, callback?: (response: any) => void) => {
        try {
          await chatService.markAsRead(userId, data);

          // Notify the conversation partner that messages were read
          io.to(`user:${data.conversationPartnerId}`).emit(
            "messagesMarkedAsRead",
            {
              userId,
              conversationPartnerId: data.conversationPartnerId,
            }
          );

          if (callback) {
            callback({ success: true });
          }
        } catch (error: any) {
          console.error("Error marking messages as read:", error);
          if (callback) {
            callback({ success: false, error: error.message });
          }
        }
      }
    );

    // Handle user typing indicator
    authenticatedSocket.on(
      "typing",
      (data: { receiverId: string; isTyping: boolean }) => {
        io.to(`user:${data.receiverId}`).emit("userTyping", {
          userId,
          isTyping: data.isTyping,
        });
      }
    );

    // Handle disconnection
    authenticatedSocket.on("disconnect", () => {
      console.log(`User ${userId} disconnected from chat`);
    });
  });
};
