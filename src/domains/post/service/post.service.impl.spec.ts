import { UserRepository } from "@domains/user/repository";
import { CursorPagination } from "@types";
import { NotFoundException } from "@utils";
import { validate } from "class-validator";
import {
  CommentDTO,
  CreateCommentInputDTO,
  CreatePostInputDTO,
  ExtendedPostDTO,
  PostDTO,
} from "../dto";
import { PostRepository } from "../repository";
import { PostServiceImpl } from "./post.service.impl";

// Mock the dependencies
jest.mock("class-validator", () => ({
  validate: jest.fn(),
  IsString: () => () => {},
  IsNotEmpty: () => () => {},
  IsOptional: () => () => {},
  IsArray: () => () => {},
  IsEnum: () => () => {},
  MaxLength: () => () => {},
  ArrayMaxSize: () => () => {},
  ValidateNested: () => () => {},
}));

jest.mock("class-transformer", () => ({
  Type: () => () => {},
}));

jest.mock("@utils", () => ({
  ForbiddenException: jest.fn().mockImplementation((message) => {
    const error = new Error(message || "Forbidden");
    error.name = "ForbiddenException";
    return error;
  }),
  NotFoundException: jest.fn().mockImplementation((message) => {
    const error = new Error(message);
    error.name = "NotFoundException";
    return error;
  }),
  s3Service: {},
}));

describe("PostServiceImpl", () => {
  let postService: PostServiceImpl;
  let mockPostRepository: jest.Mocked<PostRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockPostRepository = {
      create: jest.fn(),
      createComment: jest.fn(),
      getById: jest.fn(),
      getAllByDatePaginatedExtended: jest.fn(),
      getByAuthorId: jest.fn(),
      getCommentsByPostIdWithReactions: jest.fn(),
      delete: jest.fn(),
      incrementCommentsCount: jest.fn(),
      decrementCommentsCount: jest.fn(),
    } as any;

    mockUserRepository = {
      incrementCommentsCount: jest.fn(),
      decrementCommentsCount: jest.fn(),
    } as any;

    postService = new PostServiceImpl(mockPostRepository, mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createPost", () => {
    it("should successfully create a post", async () => {
      const userId = "user-123";
      const postData: CreatePostInputDTO = {
        content: "This is a test post",
        images: [],
      };
      const mockPost: PostDTO = {
        id: "post-123",
        content: postData.content,
        authorId: userId,
        createdAt: new Date(),
      } as PostDTO;

      (validate as jest.Mock).mockResolvedValue([]);
      mockPostRepository.create.mockResolvedValue(mockPost);

      const result = await postService.createPost(userId, postData);

      expect(validate).toHaveBeenCalledWith(postData);
      expect(mockPostRepository.create).toHaveBeenCalledWith(userId, postData);
      expect(result).toEqual(mockPost);
    });
  });

  describe("createComment", () => {
    it("should successfully create a comment", async () => {
      const userId = "user-123";
      const postId = "post-456";
      const commentData: CreateCommentInputDTO = {
        content: "This is a comment",
      };
      const mockParentPost: ExtendedPostDTO = {
        id: postId,
        authorId: "author-123",
        content: "Parent post",
        images: [],
        createdAt: new Date(),
        parentId: undefined,
        author: {
          id: "author-123",
          name: "Author",
          username: "author",
          profilePicture: null,
          likesCount: 0,
          retweetsCount: 0,
          commentsCount: 0,
        },
        qtyComments: 0,
        qtyLikes: 0,
        qtyRetweets: 0,
      } as ExtendedPostDTO;
      const mockComment: CommentDTO = {
        id: "comment-123",
        content: commentData.content,
        authorId: userId,
        parentId: postId,
        createdAt: new Date(),
      } as CommentDTO;

      (validate as jest.Mock).mockResolvedValue([]);
      mockPostRepository.getById.mockResolvedValue(mockParentPost);
      mockPostRepository.createComment.mockResolvedValue(mockComment);
      mockUserRepository.incrementCommentsCount.mockResolvedValue(undefined);
      mockPostRepository.incrementCommentsCount.mockResolvedValue(undefined);

      const result = await postService.createComment(
        userId,
        postId,
        commentData
      );

      expect(validate).toHaveBeenCalledWith(commentData);
      expect(mockPostRepository.getById).toHaveBeenCalledWith(postId, userId);
      expect(mockPostRepository.createComment).toHaveBeenCalledWith(
        userId,
        postId,
        commentData
      );
      expect(mockUserRepository.incrementCommentsCount).toHaveBeenCalledWith(
        userId
      );
      expect(mockPostRepository.incrementCommentsCount).toHaveBeenCalledWith(
        postId
      );
      expect(result).toEqual(mockComment);
    });

    it("should throw NotFoundException when parent post does not exist", async () => {
      const userId = "user-123";
      const postId = "non-existent-post";
      const commentData: CreateCommentInputDTO = {
        content: "This is a comment",
      };

      (validate as jest.Mock).mockResolvedValue([]);
      mockPostRepository.getById.mockResolvedValue(null);

      await expect(
        postService.createComment(userId, postId, commentData)
      ).rejects.toThrow("parent post");
      expect(NotFoundException).toHaveBeenCalledWith("parent post");
    });
  });

  describe("deletePost", () => {
    it("should successfully delete a post", async () => {
      const userId = "user-123";
      const postId = "post-456";
      const mockPost: ExtendedPostDTO = {
        id: postId,
        authorId: userId,
        content: "Test post",
        images: [],
        createdAt: new Date(),
        parentId: undefined,
        author: {
          id: userId,
          name: "User",
          username: "user",
          profilePicture: null,
          likesCount: 0,
          retweetsCount: 0,
          commentsCount: 0,
        },
        qtyComments: 0,
        qtyLikes: 0,
        qtyRetweets: 0,
      } as ExtendedPostDTO;

      mockPostRepository.getById.mockResolvedValue(mockPost);
      mockPostRepository.delete.mockResolvedValue(undefined);

      await postService.deletePost(userId, postId);

      expect(mockPostRepository.getById).toHaveBeenCalledWith(postId, userId);
      expect(mockPostRepository.delete).toHaveBeenCalledWith(postId);
    });

    it("should delete a comment and decrement counters", async () => {
      const userId = "user-123";
      const commentId = "comment-456";
      const parentPostId = "post-789";
      const mockComment: ExtendedPostDTO = {
        id: commentId,
        authorId: userId,
        content: "Test comment",
        images: [],
        createdAt: new Date(),
        parentId: parentPostId,
        author: {
          id: userId,
          name: "User",
          username: "user",
          profilePicture: null,
          likesCount: 0,
          retweetsCount: 0,
          commentsCount: 0,
        },
        qtyComments: 0,
        qtyLikes: 0,
        qtyRetweets: 0,
      } as ExtendedPostDTO;

      mockPostRepository.getById.mockResolvedValue(mockComment);
      mockUserRepository.decrementCommentsCount.mockResolvedValue(undefined);
      mockPostRepository.decrementCommentsCount.mockResolvedValue(undefined);
      mockPostRepository.delete.mockResolvedValue(undefined);

      await postService.deletePost(userId, commentId);

      expect(mockUserRepository.decrementCommentsCount).toHaveBeenCalledWith(
        userId
      );
      expect(mockPostRepository.decrementCommentsCount).toHaveBeenCalledWith(
        parentPostId
      );
      expect(mockPostRepository.delete).toHaveBeenCalledWith(commentId);
    });

    it("should throw NotFoundException when post does not exist", async () => {
      const userId = "user-123";
      const postId = "non-existent-post";

      mockPostRepository.getById.mockResolvedValue(null);

      await expect(postService.deletePost(userId, postId)).rejects.toThrow(
        "post"
      );
      expect(NotFoundException).toHaveBeenCalledWith("post");
    });

    it("should throw ForbiddenException when user is not the author", async () => {
      const userId = "user-123";
      const postId = "post-456";
      const mockPost: ExtendedPostDTO = {
        id: postId,
        authorId: "different-user",
        content: "Test post",
        images: [],
        createdAt: new Date(),
        parentId: undefined,
        author: {
          id: "different-user",
          name: "Different User",
          username: "different",
          profilePicture: null,
          likesCount: 0,
          retweetsCount: 0,
          commentsCount: 0,
        },
        qtyComments: 0,
        qtyLikes: 0,
        qtyRetweets: 0,
      } as ExtendedPostDTO;

      mockPostRepository.getById.mockResolvedValue(mockPost);

      await expect(postService.deletePost(userId, postId)).rejects.toThrow(
        "Forbidden"
      );
    });
  });

  describe("getPost", () => {
    it("should return post when found", async () => {
      const userId = "user-123";
      const postId = "post-456";
      const mockPost: ExtendedPostDTO = {
        id: postId,
        authorId: "author-123",
        content: "Test post",
        images: [],
        createdAt: new Date(),
        parentId: undefined,
        author: {
          id: "author-123",
          name: "Author",
          username: "author",
          profilePicture: null,
          likesCount: 0,
          retweetsCount: 0,
          commentsCount: 0,
        },
        qtyComments: 0,
        qtyLikes: 0,
        qtyRetweets: 0,
      } as ExtendedPostDTO;

      mockPostRepository.getById.mockResolvedValue(mockPost);

      const result = await postService.getPost(userId, postId);

      expect(mockPostRepository.getById).toHaveBeenCalledWith(postId, userId);
      expect(result).toEqual(mockPost);
    });

    it("should throw NotFoundException when post not found", async () => {
      const userId = "user-123";
      const postId = "non-existent-post";

      mockPostRepository.getById.mockResolvedValue(null);

      await expect(postService.getPost(userId, postId)).rejects.toThrow("post");
      expect(NotFoundException).toHaveBeenCalledWith("post");
    });
  });

  describe("getLatestPosts", () => {
    it("should return latest posts", async () => {
      const userId = "user-123";
      const options: CursorPagination = { limit: 10 };
      const mockPosts: ExtendedPostDTO[] = [
        {
          id: "post-1",
          content: "Post 1",
          authorId: "author-1",
          images: [],
          createdAt: new Date(),
          parentId: undefined,
          author: {
            id: "author-1",
            name: "Author 1",
            username: "author1",
            profilePicture: null,
            likesCount: 0,
            retweetsCount: 0,
            commentsCount: 0,
          },
          qtyComments: 0,
          qtyLikes: 0,
          qtyRetweets: 0,
        } as ExtendedPostDTO,
        {
          id: "post-2",
          content: "Post 2",
          authorId: "author-2",
          images: [],
          createdAt: new Date(),
          parentId: undefined,
          author: {
            id: "author-2",
            name: "Author 2",
            username: "author2",
            profilePicture: null,
            likesCount: 0,
            retweetsCount: 0,
            commentsCount: 0,
          },
          qtyComments: 0,
          qtyLikes: 0,
          qtyRetweets: 0,
        } as ExtendedPostDTO,
      ];

      mockPostRepository.getAllByDatePaginatedExtended.mockResolvedValue(
        mockPosts
      );

      const result = await postService.getLatestPosts(userId, options);

      expect(
        mockPostRepository.getAllByDatePaginatedExtended
      ).toHaveBeenCalledWith(userId, options);
      expect(result).toEqual(mockPosts);
    });
  });

  describe("getPostsByAuthor", () => {
    it("should return posts by author", async () => {
      const userId = "user-123";
      const authorId = "author-456";
      const mockPosts: ExtendedPostDTO[] = [
        {
          id: "post-1",
          authorId,
          content: "Post 1",
          images: [],
          createdAt: new Date(),
          parentId: undefined,
          author: {
            id: authorId,
            name: "Author",
            username: "author",
            profilePicture: null,
            likesCount: 0,
            retweetsCount: 0,
            commentsCount: 0,
          },
          qtyComments: 0,
          qtyLikes: 0,
          qtyRetweets: 0,
        } as ExtendedPostDTO,
        {
          id: "post-2",
          authorId,
          content: "Post 2",
          images: [],
          createdAt: new Date(),
          parentId: undefined,
          author: {
            id: authorId,
            name: "Author",
            username: "author",
            profilePicture: null,
            likesCount: 0,
            retweetsCount: 0,
            commentsCount: 0,
          },
          qtyComments: 0,
          qtyLikes: 0,
          qtyRetweets: 0,
        } as ExtendedPostDTO,
      ];

      mockPostRepository.getByAuthorId.mockResolvedValue(mockPosts);

      const result = await postService.getPostsByAuthor(userId, authorId);

      expect(mockPostRepository.getByAuthorId).toHaveBeenCalledWith(
        userId,
        authorId
      );
      expect(result).toEqual(mockPosts);
    });

    it("should throw NotFoundException when no posts found", async () => {
      const userId = "user-123";
      const authorId = "author-456";

      mockPostRepository.getByAuthorId.mockResolvedValue(null);

      await expect(
        postService.getPostsByAuthor(userId, authorId)
      ).rejects.toThrow("post");
      expect(NotFoundException).toHaveBeenCalledWith("post");
    });
  });

  describe("getCommentsByPostId", () => {
    it("should return comments for a post", async () => {
      const userId = "user-123";
      const postId = "post-456";
      const options: CursorPagination = { limit: 10 };
      const mockComments: ExtendedPostDTO[] = [
        {
          id: "comment-1",
          parentId: postId,
          content: "Comment 1",
          authorId: "user-1",
          images: [],
          createdAt: new Date(),
          author: {
            id: "user-1",
            name: "User 1",
            username: "user1",
            profilePicture: null,
            likesCount: 0,
            retweetsCount: 0,
            commentsCount: 0,
          },
          qtyComments: 0,
          qtyLikes: 0,
          qtyRetweets: 0,
        } as ExtendedPostDTO,
        {
          id: "comment-2",
          parentId: postId,
          content: "Comment 2",
          authorId: "user-2",
          images: [],
          createdAt: new Date(),
          author: {
            id: "user-2",
            name: "User 2",
            username: "user2",
            profilePicture: null,
            likesCount: 0,
            retweetsCount: 0,
            commentsCount: 0,
          },
          qtyComments: 0,
          qtyLikes: 0,
          qtyRetweets: 0,
        } as ExtendedPostDTO,
      ];

      mockPostRepository.getCommentsByPostIdWithReactions.mockResolvedValue(
        mockComments
      );

      const result = await postService.getCommentsByPostId(
        userId,
        postId,
        options
      );

      expect(
        mockPostRepository.getCommentsByPostIdWithReactions
      ).toHaveBeenCalledWith(userId, postId, options);
      expect(result).toEqual(mockComments);
    });
  });
});
