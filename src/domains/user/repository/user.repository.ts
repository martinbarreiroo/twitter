import { SignupInputDTO } from "@domains/auth/dto";
import { OffsetPagination } from "@types";
import { ExtendedUserDTO, UserViewDTO } from "../dto";
import { ExtendedPostDTO } from "@domains/post/dto";

export interface UserRepository {
  create: (data: SignupInputDTO) => Promise<UserViewDTO>;
  delete: (userId: string) => Promise<void>;
  getById: (userId: string) => Promise<UserViewDTO | null>;
  getByIdWithFollowInfo: (
    userId: string,
    targetUserId: string
  ) => Promise<UserViewDTO | null>;
  getByEmailOrUsername: (
    email?: string,
    username?: string
  ) => Promise<ExtendedUserDTO | null>;
  getUsersByUsername: (
    username: string,
    options: OffsetPagination
  ) => Promise<UserViewDTO[]>;
  updatePrivacy: (userId: string, isPrivate: boolean) => Promise<void>;
  getUserLikes: (
    userId: string,
    options: OffsetPagination
  ) => Promise<ExtendedPostDTO[]>;
  getUserRetweets: (
    userId: string,
    options: OffsetPagination
  ) => Promise<ExtendedPostDTO[]>;
  getUserComments: (
    userId: string,
    options: OffsetPagination
  ) => Promise<ExtendedPostDTO[]>;

  // Counter update methods
  incrementLikesCount: (userId: string) => Promise<void>;
  decrementLikesCount: (userId: string) => Promise<void>;
  incrementRetweetsCount: (userId: string) => Promise<void>;
  decrementRetweetsCount: (userId: string) => Promise<void>;
  incrementCommentsCount: (userId: string) => Promise<void>;
  decrementCommentsCount: (userId: string) => Promise<void>;

  // Profile picture update method
  updateProfilePicture: (
    userId: string,
    profilePictureKey: string
  ) => Promise<void>;
}
