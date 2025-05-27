import { OffsetPagination } from "@types";
import { UserDTO, ImageUploadRequestDTO, ImageUploadResponseDTO } from "../dto";

export interface UserService {
  deleteUser: (userId: string) => Promise<void>;
  getUser: (userId: string) => Promise<UserDTO>;

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
