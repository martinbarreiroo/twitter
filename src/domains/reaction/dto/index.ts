import { IsEnum, IsUUID } from "class-validator";
import { ReactionEnum } from "../enum/reaction.enum";

export class ReactionInputDTO {
  constructor(reaction: ReactionInputDTO) {
    this.postId = reaction.postId;
    this.userId = reaction.userId;
    this.type = reaction.type;
  }

  @IsUUID()
  postId: string;

  @IsUUID()
  userId: string;

  @IsEnum(ReactionEnum, {
    message: "Type must be either 'like' or 'retweet'",
  })
  type: "like" | "retweet";
}

export class ReactionOutputDTO {
  constructor(reaction: ReactionOutputDTO) {
    this.id = reaction.id;
    this.postId = reaction.postId;
    this.userId = reaction.userId;
    this.type = reaction.type;
    this.createdAt = reaction.createdAt;
    this.updatedAt = reaction.updatedAt;
  }
  id: string;
  postId: string;
  userId: string;
  type: "like" | "retweet";
  createdAt: Date;
  updatedAt: Date;
}
