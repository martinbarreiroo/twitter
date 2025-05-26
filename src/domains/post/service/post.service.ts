import { CreatePostInputDTO, CreateCommentInputDTO, PostDTO } from "../dto";

export interface PostService {
  createPost: (userId: string, body: CreatePostInputDTO) => Promise<PostDTO>;
  createComment: (
    userId: string,
    body: CreateCommentInputDTO
  ) => Promise<PostDTO>;
  deletePost: (userId: string, postId: string) => Promise<void>;
  getPost: (userId: string, postId: string) => Promise<PostDTO>;
  getPostWithReactions: (userId: string, postId: string) => Promise<any>;
  getLatestPosts: (
    userId: string,
    options: { limit?: number; before?: string; after?: string }
  ) => Promise<PostDTO[]>;
  getPostsByAuthor: (userId: any, authorId: string) => Promise<PostDTO[]>;
  getCommentsByPostId: (
    userId: string,
    postId: string,
    options: { limit?: number; before?: string; after?: string }
  ) => Promise<PostDTO[]>;
}
