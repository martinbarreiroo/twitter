import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ArrayMaxSize,
  IsArray,
} from "class-validator";
import { UserAuthorDTO } from "@domains/user/dto";
import { User, Post, Reaction } from "@prisma/client";

type PostWithAuthor = Post & {
  author: User;
};

type PostWithAuthorAndReactions = PostWithAuthor & {
  author: User;
  reactions: Reaction[];
  comments?: Post[];
  _count?: {
    comments: number;
    reactions?: number;
  };
  commentCount?: number;
  likeCount?: number;
  retweetCount?: number;
  likesCount?: number;
  retweetsCount?: number;
  commentsCount?: number;
};

export class CreatePostInputDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  content!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  images?: string[];

  @IsOptional()
  @IsString()
  parentId?: string; // Optional parent post ID for comments
}

export class CreateCommentInputDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  content!: string;
}

export class PostDTO {
  constructor(post: Post) {
    this.id = post.id;
    this.authorId = post.authorId;
    this.content = post.content;
    this.images = post.images;
    this.createdAt = post.createdAt;
    this.parentId = post.parentId || undefined;
  }

  id: string;
  authorId: string;
  content: string;
  images: string[];
  createdAt: Date;
  parentId?: string;
}

export class CommentDTO {
  constructor(comment: Post) {
    this.id = comment.id;
    this.authorId = comment.authorId;
    this.content = comment.content;
    this.createdAt = comment.createdAt;
    this.parentId = comment.parentId || undefined;
  }

  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
  parentId?: string;
}

export class ExtendedPostDTO extends PostDTO {
  constructor(post: PostWithAuthorAndReactions) {
    super(post);
    // Create UserAuthorDTO without followsYou field
    this.author = new UserAuthorDTO({
      ...post.author,
      name: post.author.name || "", // Convert null to empty string
    });
    // Prioritize database counter fields over calculated values
    this.qtyComments =
      post.commentsCount ??
      post.commentCount ??
      post._count?.comments ??
      post.comments?.length ??
      0;
    this.qtyLikes =
      post.likesCount ??
      post.likeCount ??
      post.reactions?.filter((r) => r.type === "LIKE").length ??
      0;
    this.qtyRetweets =
      post.retweetsCount ??
      post.retweetCount ??
      post.reactions?.filter((r) => r.type === "RETWEET").length ??
      0;
  }

  author!: UserAuthorDTO;
  qtyComments!: number;
  qtyLikes!: number;
  qtyRetweets!: number;
}
