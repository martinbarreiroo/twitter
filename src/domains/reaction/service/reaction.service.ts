import { ReactionInputDTO, ReactionOutputDTO } from "../dto";

export interface ReactionService {
  createReaction(data: ReactionInputDTO): Promise<ReactionOutputDTO>;
  getReactionById(id: string): Promise<ReactionOutputDTO | null>;
  deleteReaction(id: string): Promise<boolean>;
  toggleReaction(
    userId: string,
    postId: string,
    type: string
  ): Promise<ReactionOutputDTO | null>;
}
