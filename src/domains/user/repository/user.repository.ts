import { SignupInputDTO } from "@domains/auth/dto";
import { OffsetPagination } from "@types";
import { ExtendedUserDTO, UserDTO } from "../dto";

export interface UserRepository {
  create: (data: SignupInputDTO) => Promise<UserDTO>;
  delete: (userId: string) => Promise<void>;
  getRecommendedUsersPaginated: (
    options: OffsetPagination
  ) => Promise<UserDTO[]>;
  getById: (userId: string) => Promise<UserDTO | null>;
  getByEmailOrUsername: (
    email?: string,
    username?: string
  ) => Promise<ExtendedUserDTO | null>;
  updatePrivacy: (userId: string, isPrivate: boolean) => Promise<void>;

  // New methods for user activity queries
  getUserLikes: (userId: string, options: OffsetPagination) => Promise<any[]>;
  getUserRetweets: (
    userId: string,
    options: OffsetPagination
  ) => Promise<any[]>;
  getUserComments: (
    userId: string,
    options: OffsetPagination
  ) => Promise<any[]>;

  // Counter update methods
  incrementLikesCount: (userId: string) => Promise<void>;
  decrementLikesCount: (userId: string) => Promise<void>;
  incrementRetweetsCount: (userId: string) => Promise<void>;
  decrementRetweetsCount: (userId: string) => Promise<void>;
  incrementCommentsCount: (userId: string) => Promise<void>;
  decrementCommentsCount: (userId: string) => Promise<void>;
}
