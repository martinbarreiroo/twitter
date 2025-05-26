import { CreatePostInputDTO, CreateCommentInputDTO, PostDTO } from "../dto";
import { PostRepository } from "../repository";
import { PostService } from ".";
import { validate } from "class-validator";
import { ForbiddenException, NotFoundException } from "@utils";
import { CursorPagination } from "@types";

export class PostServiceImpl implements PostService {
  constructor(private readonly repository: PostRepository) {}

  async createPost(userId: string, data: CreatePostInputDTO): Promise<PostDTO> {
    await validate(data);
    return await this.repository.create(userId, data);
  }

  async createComment(
    userId: string,
    data: CreateCommentInputDTO
  ): Promise<PostDTO> {
    await validate(data);

    // Verify that the parent post exists and user can access it
    const parentPost = await this.repository.getById(data.parentId, userId);
    if (!parentPost) {
      throw new NotFoundException("parent post");
    }

    return await this.repository.createComment(userId, data);
  }

  async deletePost(userId: string, postId: string): Promise<void> {
    const post = await this.repository.getById(postId, userId);
    if (!post) throw new NotFoundException("post");
    if (post.authorId !== userId) throw new ForbiddenException();
    await this.repository.delete(postId);
  }

  async getPost(userId: string, postId: string): Promise<PostDTO> {
    const post = await this.repository.getById(postId, userId);
    if (!post) throw new NotFoundException("post");
    return post;
  }

  async getPostWithReactions(userId: string, postId: string): Promise<any> {
    const post = await this.getPost(userId, postId);

    try {
      const reactionCounts = await this.repository.getReactionCounts(postId);
      const userReactions = await this.repository.getUserReactions(
        postId,
        userId
      );

      return {
        ...post,
        reactions: {
          likeCount: reactionCounts.likeCount,
          retweetCount: reactionCounts.retweetCount,
          hasLiked: userReactions.hasLiked,
          hasRetweeted: userReactions.hasRetweeted,
        },
      };
    } catch (error) {
      console.error("Error fetching reactions:", error);
      // If there's an error with reactions, just return the post without reaction data
      return post;
    }
  }

  async getLatestPosts(
    userId: string,
    options: CursorPagination
  ): Promise<PostDTO[]> {
    return await this.repository.getAllByDatePaginated(userId, options);
  }

  async getPostsByAuthor(userId: string, authorId: string): Promise<PostDTO[]> {
    const posts = await this.repository.getByAuthorId(userId, authorId);
    if (!posts) throw new NotFoundException("post");
    return posts;
  }

  async getCommentsByPostId(
    userId: string,
    postId: string,
    options: CursorPagination
  ): Promise<PostDTO[]> {
    return await this.repository.getCommentsByPostId(userId, postId, options);
  }
}
