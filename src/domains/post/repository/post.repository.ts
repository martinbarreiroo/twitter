import { CursorPagination } from "@types";
import {
  CreatePostInputDTO,
  CreateCommentInputDTO,
  PostDTO,
  ExtendedPostDTO,
} from "../dto";

export interface PostRepository {
  create: (userId: string, data: CreatePostInputDTO) => Promise<PostDTO>;
  createComment: (
    userId: string,
    data: CreateCommentInputDTO
  ) => Promise<PostDTO>;
  getAllByDatePaginated: (
    userId: string,
    options: CursorPagination
  ) => Promise<PostDTO[]>;
  getCommentsByPostId: (
    userId: string,
    postId: string,
    options: CursorPagination
  ) => Promise<PostDTO[]>;
  getCommentsByPostIdWithReactions: (
    userId: string,
    postId: string,
    options: CursorPagination
  ) => Promise<ExtendedPostDTO[]>;
  delete: (postId: string) => Promise<void>;
  getById: (postId: string, userId: string) => Promise<PostDTO | null>;
  getByAuthorId: (
    userId: string,
    authorId: string
  ) => Promise<PostDTO[] | null>;
  getReactionCounts: (
    postId: string
  ) => Promise<{ likeCount: number; retweetCount: number }>;
  getUserReactions: (
    postId: string,
    userId: string
  ) => Promise<{ hasLiked: boolean; hasRetweeted: boolean }>;
}
