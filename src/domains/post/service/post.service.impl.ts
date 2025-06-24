import { UserRepository } from "@domains/user/repository";
import { CursorPagination } from "@types";
import { ForbiddenException, NotFoundException, s3Service } from "@utils";
import { validate } from "class-validator";
import { PostService } from ".";
import {
  CommentDTO,
  CreateCommentInputDTO,
  CreatePostInputDTO,
  ExtendedPostDTO,
  PostDTO,
  PostImageUploadInputDTO,
  PostImageUploadResponseDTO,
  PostImageUploadResultDTO,
} from "../dto";
import { PostRepository } from "../repository";

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
    data: CreateCommentInputDTO
  ): Promise<CommentDTO> {
    await validate(data);

    // Verify that the parent post exists and user can access it
    const parentPost = await this.repository.getById(postId, userId);
    if (!parentPost) {
      throw new NotFoundException("parent post");
    }

    const comment = await this.repository.createComment(userId, postId, data);

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

  async generatePostImageUploadUrls(
    userId: string,
    request: PostImageUploadInputDTO
  ): Promise<PostImageUploadResponseDTO> {
    await validate(request);

    const uploads: PostImageUploadResultDTO[] = [];

    for (let i = 0; i < request.images.length; i++) {
      const image = request.images[i];

      // Validate file extension
      if (!s3Service.isValidImageExtension(image.fileExtension)) {
        throw new Error(
          `Invalid file extension: ${image.fileExtension}. Only jpg, jpeg, png, gif, and webp are allowed.`
        );
      }

      // Generate unique S3 key for the post image
      // We'll use a temporary postId placeholder that the client should replace
      const tempPostId = `temp-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const imageKey = s3Service.generatePostImageKey(
        userId,
        tempPostId,
        i,
        image.fileExtension
      );

      // Generate pre-signed upload URL
      const uploadUrl = await s3Service.generateUploadUrl(
        imageKey,
        image.contentType
      );

      uploads.push(new PostImageUploadResultDTO(uploadUrl, imageKey));
    }

    return new PostImageUploadResponseDTO(uploads);
  }
}
