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
}

export class PostDTO {
  constructor(post: PostDTO) {
    this.id = post.id;
    this.authorId = post.authorId;
    this.content = post.content;
    this.images = post.images;
    this.createdAt = post.createdAt;
  }

  id: string;
  authorId: string;
  content: string;
  images: string[];
  createdAt: Date;
}

export class ExtendedPostDTO extends PostDTO {
  constructor(post: ExtendedPostDTO) {
    super(post);
    this.author = post.author;
    this.qtyComments = post.qtyComments;
    this.qtyLikes = post.qtyLikes;
    this.qtyRetweets = post.qtyRetweets;
  }

  author!: ExtendedUserDTO;
  qtyComments!: number;
  qtyLikes!: number;
  qtyRetweets!: number;
}
