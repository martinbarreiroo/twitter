import { CursorPagination } from "@types";
import {
  CommentDTO,
  CreateCommentInputDTO,
  CreatePostInputDTO,
  ExtendedPostDTO,
  PostDTO,
} from "../dto";

export interface PostRepository {
  create: (userId: string, data: CreatePostInputDTO) => Promise<PostDTO>;
  createComment: (
    userId: string,
    postId: string,
    data: CreateCommentInputDTO
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
    authorId: string,
    options: CursorPagination
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
  getCommentAuthorsByPostId: (
    postId: string
  ) => Promise<{ authorId: string; count: number }[]>;
  getFollowingPostsPaginated: (
    userId: string,
    options: CursorPagination
  ) => Promise<ExtendedPostDTO[]>;
}
