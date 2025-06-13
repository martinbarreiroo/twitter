import { CursorPagination, OffsetPagination } from "@types";
import {
  ImageUploadRequestDTO,
  ImageUploadResponseDTO,
  UserViewDTO,
} from "../dto";

export interface UserService {
  deleteUser: (userId: string) => Promise<void>;
  getUserById: (userId: string) => Promise<UserViewDTO>;
  getUserWithFollowInfo: (
    userId: string,
    targetUserId: string
  ) => Promise<UserViewDTO>;
  getUsersByUsername: (
    username: string,
    options: CursorPagination,
    userId?: string
  ) => Promise<UserViewDTO[]>;

  getRecommendedUsers: (
    userId: string,
    options: OffsetPagination
  ) => Promise<UserViewDTO[]>;
  updatePrivacy: (userId: string, isPrivate: boolean) => Promise<void>;

  // New methods for user activity
  getUserLikes: (userId: string, options: OffsetPagination) => Promise<any[]>;
  getUserRetweets: (
    userId: string,
    options: OffsetPagination
  ) => Promise<any[]>;
  getUserComments: (
    userId: string,
    options: OffsetPagination
  ) => Promise<any[]>;

  // S3 profile picture methods
  generateProfilePictureUploadUrl: (
    userId: string,
    request: ImageUploadRequestDTO
  ) => Promise<ImageUploadResponseDTO>;
  updateUserProfilePicture: (
    userId: string,
    profilePictureKey: string
  ) => Promise<void>;
}
