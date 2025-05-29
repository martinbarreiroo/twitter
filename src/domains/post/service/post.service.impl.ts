import {
  CreatePostInputDTO,
  CreateCommentInputDTO,
  PostDTO,
  CommentDTO,
  ExtendedPostDTO,
} from "../dto";
import { PostRepository } from "../repository";
import { UserRepository } from "@domains/user/repository";
import { PostService } from ".";
import { validate } from "class-validator";
import { ForbiddenException, NotFoundException } from "@utils";
import { CursorPagination } from "@types";
import { s3Service } from "@utils";

export class PostServiceImpl implements PostService {
  constructor(
    private readonly repository: PostRepository,
    private readonly userRepository: UserRepository
  ) {}

  async createPost(userId: string, data: CreatePostInputDTO): Promise<PostDTO> {
    await validate(data);
    return await this.repository.create(userId, data);
  }

  async createComment(
    userId: string,
    postId: string,
    content: CreateCommentInputDTO
  ): Promise<CommentDTO> {
    await validate(content);

    // Verify that the parent post exists and user can access it
    const parentPost = await this.repository.getById(postId, userId);
    if (!parentPost) {
      throw new NotFoundException("parent post");
    }

    const comment = await this.repository.createComment(
      userId,
      postId,
      content
    );

    // Update user comment counter
    await this.userRepository.incrementCommentsCount(userId);

    // Update parent post comment counter
    await this.repository.incrementCommentsCount(postId);

    return comment;
  }

  async deletePost(userId: string, postId: string): Promise<void> {
    const post = await this.repository.getById(postId, userId);
    if (!post) throw new NotFoundException("post");
    if (post.authorId !== userId) throw new ForbiddenException();

    // If it's a comment, decrement the user's comment counter and parent post's comment counter
    if (post.parentId) {
      await this.userRepository.decrementCommentsCount(userId);
      await this.repository.decrementCommentsCount(post.parentId);
    }

    await this.repository.delete(postId);
  }

  async getPost(userId: string, postId: string): Promise<ExtendedPostDTO> {
    const post = await this.repository.getById(postId, userId);
    if (!post) throw new NotFoundException("post");
    return post;
  }

  async getLatestPosts(
    userId: string,
    options: CursorPagination
  ): Promise<ExtendedPostDTO[]> {
    return await this.repository.getAllByDatePaginatedExtended(userId, options);
  }

  async getPostsByAuthor(
    userId: string,
    authorId: string
  ): Promise<ExtendedPostDTO[]> {
    const posts = await this.repository.getByAuthorId(userId, authorId);
    if (!posts) throw new NotFoundException("post");
    return posts;
  }

  async getCommentsByPostId(
    userId: string,
    postId: string,
    options: CursorPagination
  ): Promise<ExtendedPostDTO[]> {
    return await this.repository.getCommentsByPostIdWithReactions(
      userId,
      postId,
      options
    );
  }

  async getCommentsByPostIdWithReactions(
    userId: string,
    postId: string,
    options: CursorPagination
  ): Promise<ExtendedPostDTO[]> {
    return await this.repository.getCommentsByPostIdWithReactions(
      userId,
      postId,
      options
    );
  }
}
