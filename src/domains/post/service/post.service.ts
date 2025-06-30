import { CursorPagination } from "@types";
import {
  CommentDTO,
  CreateCommentInputDTO,
  CreatePostInputDTO,
  ExtendedPostDTO,
  PostDTO,
  PostImageUploadInputDTO,
  PostImageUploadResponseDTO,
} from "../dto";

export interface PostService {
  createPost: (userId: string, body: CreatePostInputDTO) => Promise<PostDTO>;
  createComment: (
    userId: string,
    postId: string,
    data: CreateCommentInputDTO
  ) => Promise<CommentDTO>;
  deletePost: (userId: string, postId: string) => Promise<void>;
  getPost: (userId: string, postId: string) => Promise<ExtendedPostDTO>;
  getLatestPosts: (
    userId: string,
    options: CursorPagination
  ) => Promise<ExtendedPostDTO[]>;
  getPostsByAuthor: (
    userId: any,
    authorId: string,
    options: CursorPagination
  ) => Promise<ExtendedPostDTO[]>;
  getCommentsByPostId: (
    userId: string,
    postId: string,
    options: CursorPagination
  ) => Promise<ExtendedPostDTO[]>;

  getCommentsByPostIdWithReactions: (
    userId: string,
    postId: string,
    options: CursorPagination
  ) => Promise<ExtendedPostDTO[]>;

  generatePostImageUploadUrls: (
    userId: string,
    request: PostImageUploadInputDTO
  ) => Promise<PostImageUploadResponseDTO>;
  getFollowingPosts: (
    userId: string,
    options: CursorPagination
  ) => Promise<ExtendedPostDTO[]>;
}
