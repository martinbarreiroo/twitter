import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ArrayMaxSize,
  IsArray,
} from "class-validator";
import { ExtendedUserDTO } from "@domains/user/dto";

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

  @IsString()
  @IsNotEmpty()
  parentId!: string; // Required parent post ID for comments
}

export class PostDTO {
  constructor(post: any) {
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
  parentId?: string; // Parent post ID for comments (null for posts)
}

export class ExtendedPostDTO extends PostDTO {
  constructor(post: any) {
    super(post);
    this.author = post.author ? new ExtendedUserDTO(post.author) : post.author;
    this.qtyComments = post.qtyComments || 0;
    this.qtyLikes = post.qtyLikes || 0;
    this.qtyRetweets = post.qtyRetweets || 0;
  }

  author!: ExtendedUserDTO;
  qtyComments!: number;
  qtyLikes!: number;
  qtyRetweets!: number;
}

export class PostImageUploadRequestDTO {
  constructor(images: Array<{ fileExtension: string; contentType: string }>) {
    this.images = images;
  }

  images: Array<{ fileExtension: string; contentType: string }>;
}

export class PostImageUploadResponseDTO {
  constructor(uploads: Array<{ uploadUrl: string; imageKey: string }>) {
    this.uploads = uploads;
  }

  uploads: Array<{ uploadUrl: string; imageKey: string }>;
}
