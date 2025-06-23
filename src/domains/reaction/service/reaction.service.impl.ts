import { PostRepository } from "@domains/post/repository";
import { UserRepository } from "@domains/user/repository";
import {
  ConflictException,
  NotFoundException,
  ValidationException,
} from "@utils/errors";
import { ReactionInputDTO, ReactionOutputDTO } from "../dto";
import { ReactionEnum } from "../enum/reaction.enum";
import { ReactionRepository } from "../repository";
import { ReactionService } from "./reaction.service";

export class ReactionServiceImpl implements ReactionService {
  constructor(
    private readonly repository: ReactionRepository,
    private readonly userRepository: UserRepository,
    private readonly postRepository: PostRepository
  ) {}

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

    // Create the reaction
    const reaction = await this.repository.createReaction(data);

    // Update user counters
    if (data.type === ReactionEnum.LIKE) {
      await this.userRepository.incrementLikesCount(data.userId);
      await this.postRepository.incrementLikesCount(data.postId);
    } else if (data.type === ReactionEnum.RETWEET) {
      await this.userRepository.incrementRetweetsCount(data.userId);
      await this.postRepository.incrementRetweetsCount(data.postId);
    }

    return reaction;
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
    // Get the reaction before deleting to know its type and user
    const reaction = await this.repository.findReactionById(id);
    if (!reaction) {
      throw new NotFoundException("Reaction not found");
    }

    const deleted = await this.repository.deleteReaction(id);
    if (!deleted) {
      throw new NotFoundException("Reaction not found");
    }

    // Update user counters
    if (reaction.type === ReactionEnum.LIKE) {
      await this.userRepository.decrementLikesCount(reaction.userId);
      await this.postRepository.decrementLikesCount(reaction.postId);
    } else if (reaction.type === ReactionEnum.RETWEET) {
      await this.userRepository.decrementRetweetsCount(reaction.userId);
      await this.postRepository.decrementRetweetsCount(reaction.postId);
    }

    return true;
  }

  async deleteReactionByPostAndType(
    userId: string,
    postId: string,
    type: string
  ): Promise<boolean> {
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

    // Get the reaction before deleting to know its type for counter updates
    const reaction = await this.repository.deleteReactionByUserAndPostAndType(
      userId,
      postId,
      type
    );
    if (!reaction) {
      throw new NotFoundException("Reaction not found");
    }

    // Update user counters
    if (reaction.type === ReactionEnum.LIKE) {
      await this.userRepository.decrementLikesCount(reaction.userId);
      await this.postRepository.decrementLikesCount(reaction.postId);
    } else if (reaction.type === ReactionEnum.RETWEET) {
      await this.userRepository.decrementRetweetsCount(reaction.userId);
      await this.postRepository.decrementRetweetsCount(reaction.postId);
    }

    return true;
  }
}
