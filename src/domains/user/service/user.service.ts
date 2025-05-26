import { OffsetPagination } from "@types";
import { UserDTO } from "../dto";

export interface UserService {
  deleteUser: (userId: string) => Promise<void>;
  getUser: (userId: string) => Promise<UserDTO>;
  getUserRecommendations: (
    userId: string,
    options: OffsetPagination
  ) => Promise<UserDTO[]>;
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
}
