import { CursorPagination } from "@types";
import {
  CreatePostInputDTO,
  CreateCommentInputDTO,
  PostDTO,
  CommentDTO,
  ExtendedPostDTO,
} from "../dto";

export interface PostRepository {
  create: (userId: string, data: CreatePostInputDTO) => Promise<PostDTO>;
  createComment: (
    userId: string,
    postId: string,
    content: CreateCommentInputDTO
  ) => Promise<CommentDTO>;
  getAllByDatePaginated: (
    userId: string,
    options: CursorPagination
  ) => Promise<PostDTO[]>;
  getAllByDatePaginatedExtended: (
    userId: string,
    options: CursorPagination
  ) => Promise<ExtendedPostDTO[]>;
  getCommentsByPostIdWithReactions: (
    userId: string,
    postId: string,
    options: CursorPagination
  ) => Promise<ExtendedPostDTO[]>;
  delete: (postId: string) => Promise<void>;
  getById: (postId: string, userId: string) => Promise<ExtendedPostDTO | null>;
  getByAuthorId: (
    userId: string,
    authorId: string
  ) => Promise<ExtendedPostDTO[] | null>;
  getUserReactions: (
    postId: string,
    userId: string
  ) => Promise<{ hasLiked: boolean; hasRetweeted: boolean }>;
  incrementLikesCount: (postId: string) => Promise<void>;
  decrementLikesCount: (postId: string) => Promise<void>;
  incrementRetweetsCount: (postId: string) => Promise<void>;
  decrementRetweetsCount: (postId: string) => Promise<void>;
  incrementCommentsCount: (postId: string) => Promise<void>;
  decrementCommentsCount: (postId: string) => Promise<void>;
}
