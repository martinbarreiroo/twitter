import { ReactionInputDTO, ReactionOutputDTO } from "../dto";

export interface ReactionRepository {
  createReaction(data: ReactionInputDTO): Promise<ReactionOutputDTO>;
  findReactionById(id: string): Promise<ReactionOutputDTO | null>;
  findReactionByUserAndPostAndType(
    userId: string,
    postId: string,
    type: string
  ): Promise<ReactionOutputDTO | null>;
  deleteReaction(id: string): Promise<boolean>;
  toggleReaction(
    userId: string,
    postId: string,
    type: string
  ): Promise<ReactionOutputDTO | null>;
}
