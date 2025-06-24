import { UserAuthorDTO } from "@domains/user/dto";
import { Post, Reaction, User } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";

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
  hasLiked?: boolean;
  hasRetweeted?: boolean;
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

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  images?: string[];
}

export class PostDTO {
  constructor(post: Post) {
    this.id = post.id;
    this.authorId = post.authorId;
    this.content = post.content;
    this.images = this.transformImageKeys(post.images);
    this.createdAt = post.createdAt;
    this.parentId = post.parentId || undefined;
  }

  private transformImageKeys(imageKeys: string[]): string[] {
    const S3_BASE_URL = process.env.S3_BASE_URL;
    return imageKeys.map((key) => {
      // If the key already contains a full URL, return as is
      if (key.startsWith("http://") || key.startsWith("https://")) {
        return key;
      }
      // Otherwise, prepend the S3 base URL
      return `${S3_BASE_URL}${key}`;
    });
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
    this.images = this.transformImageKeys(comment.images);
    this.createdAt = comment.createdAt;
    this.parentId = comment.parentId || undefined;
  }

  private transformImageKeys(imageKeys: string[]): string[] {
    const S3_BASE_URL = process.env.S3_BASE_URL;
    return imageKeys.map((key) => {
      // If the key already contains a full URL, return as is
      if (key.startsWith("http://") || key.startsWith("https://")) {
        return key;
      }
      // Otherwise, prepend the S3 base URL
      return `${S3_BASE_URL}${key}`;
    });
  }

  id: string;
  authorId: string;
  content: string;
  images: string[];
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
    // Set user reaction status
    this.hasLiked = post.hasLiked ?? false;
    this.hasRetweeted = post.hasRetweeted ?? false;
  }

  author!: UserAuthorDTO;
  qtyComments!: number;
  qtyLikes!: number;
  qtyRetweets!: number;
  hasLiked!: boolean;
  hasRetweeted!: boolean;
}

export class PostImageUploadRequestDTO {
  @IsString()
  @IsEnum(["jpg", "jpeg", "png", "gif", "webp"])
  fileExtension!: string;

  @IsString()
  @IsEnum(["image/jpeg", "image/png", "image/gif", "image/webp"])
  contentType!: string;
}

export class PostImageUploadInputDTO {
  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => PostImageUploadRequestDTO)
  images!: PostImageUploadRequestDTO[];
}

export class PostImageUploadResultDTO {
  constructor(uploadUrl: string, imageKey: string) {
    this.uploadUrl = uploadUrl;
    this.imageKey = imageKey;
  }

  uploadUrl: string;
  imageKey: string;
}

export class PostImageUploadResponseDTO {
  constructor(uploads: PostImageUploadResultDTO[]) {
    this.uploads = uploads;
  }

  uploads: PostImageUploadResultDTO[];
}
