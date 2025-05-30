import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
} from "class-validator";

export class MessageDTO {
  id!: string;
  content!: string;
  senderId!: string;
  receiverId!: string;
  isRead!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(message: MessageDTO) {
    this.id = message.id;
    this.content = message.content;
    this.senderId = message.senderId;
    this.receiverId = message.receiverId;
    this.isRead = message.isRead;
    this.createdAt = message.createdAt;
    this.updatedAt = message.updatedAt;
  }
}

export class SendMessageInputDTO {
  @IsString()
  @IsNotEmpty()
  content!: string;

  constructor(content: string, receiverId: string) {
    this.content = content;
  }
}

export class ConversationDTO {
  participantId!: string;
  participantName!: string;
  participantUsername!: string;
  participantProfilePicture?: string;
  lastMessage?: MessageDTO;
  unreadCount!: number;

  constructor(conversation: ConversationDTO) {
    this.participantId = conversation.participantId;
    this.participantName = conversation.participantName;
    this.participantUsername = conversation.participantUsername;
    this.participantProfilePicture = conversation.participantProfilePicture;
    this.lastMessage = conversation.lastMessage;
    this.unreadCount = conversation.unreadCount;
  }
}

export class MarkAsReadInputDTO {
  @IsUUID()
  @IsNotEmpty()
  conversationPartnerId!: string;

  constructor(conversationPartnerId: string) {
    this.conversationPartnerId = conversationPartnerId;
  }
}
