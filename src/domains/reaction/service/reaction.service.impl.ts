import { ReactionInputDTO, ReactionOutputDTO } from "../dto";
import { ReactionRepository } from "../repository";
import { ReactionService } from "./reaction.service";
import { ReactionEnum } from "../enum/reaction.enum";
import {
  NotFoundException,
  ConflictException,
  ValidationException,
} from "@utils/errors";

export class ReactionServiceImpl implements ReactionService {
  constructor(private readonly repository: ReactionRepository) {}

  async createReaction(data: ReactionInputDTO): Promise<ReactionOutputDTO> {
    const response = await this.repository.findReactionByUserAndPostAndType(
      data.userId,
      data.postId,
      data.type
    );

    if (response) {
      // If reaction exists, throw conflict error
      throw new ConflictException("Reaction already exists");
    }

    // If reaction doesn't exist, create it
    return this.repository.createReaction(data);
  }

  async createReactionWithValidation(
    userId: string,
    postId: string,
    type: string
  ): Promise<ReactionOutputDTO> {
    // Validate reaction type
    if (
      !type ||
      (type !== ReactionEnum.LIKE && type !== ReactionEnum.RETWEET)
    ) {
      throw new ValidationException([
        {
          field: "type",
          message: "Invalid reaction type. Use 'like' or 'retweet'",
        },
      ]);
    }

    const reactionDto: ReactionInputDTO = {
      postId,
      userId,
      type,
    };

    return this.createReaction(reactionDto);
  }

  async getReactionById(id: string): Promise<ReactionOutputDTO | null> {
    const reaction = await this.repository.findReactionById(id);
    if (!reaction) {
      throw new NotFoundException("Reaction not found");
    }
    return reaction;
  }

  async deleteReaction(id: string): Promise<boolean> {
    const deleted = await this.repository.deleteReaction(id);
    if (!deleted) {
      throw new NotFoundException("Reaction not found");
    }
    return true;
  }
}
