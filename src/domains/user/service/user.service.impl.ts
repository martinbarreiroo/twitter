import { CursorPagination, OffsetPagination } from "@types";
import { s3Service } from "@utils";
import { NotFoundException } from "@utils/errors";
import {
  ImageUploadRequestDTO,
  ImageUploadResponseDTO,
  UserViewDTO,
} from "../dto";
import { UserRepository } from "../repository";
import { UserService } from "./user.service";

export class UserServiceImpl implements UserService {
  constructor(private readonly repository: UserRepository) {}

  async getUserById(userId: string): Promise<UserViewDTO> {
    const user: UserViewDTO | null = await this.repository.getById(userId);
    if (!user) throw new NotFoundException("user");
    return user;
  }

  async getUserWithFollowInfo(
    userId: string,
    targetUserId: string
  ): Promise<UserViewDTO> {
    const user: UserViewDTO | null =
      await this.repository.getByIdWithFollowInfo(userId, targetUserId);
    if (!user) throw new NotFoundException("user");
    return user;
  }

  async getUsersByUsername(
    username: string,
    options: CursorPagination
  ): Promise<UserViewDTO[]> {
    return await this.repository.getUsersByUsername(username, options);
  }

  async deleteUser(userId: string): Promise<void> {
    await this.repository.delete(userId);
  }

  async updatePrivacy(userId: string, isPrivate: boolean): Promise<void> {
    await this.repository.updatePrivacy(userId, isPrivate);
  }

  async getUserLikes(
    userId: string,
    options: OffsetPagination
  ): Promise<any[]> {
    return await this.repository.getUserLikes(userId, options);
  }

  async getUserRetweets(
    userId: string,
    options: OffsetPagination
  ): Promise<any[]> {
    return await this.repository.getUserRetweets(userId, options);
  }

  async getUserComments(
    userId: string,
    options: OffsetPagination
  ): Promise<any[]> {
    return await this.repository.getUserComments(userId, options);
  }

  async generateProfilePictureUploadUrl(
    userId: string,
    request: ImageUploadRequestDTO
  ): Promise<ImageUploadResponseDTO> {
    // Validate file extension
    if (!s3Service.isValidImageExtension(request.fileExtension)) {
      throw new Error(
        "Invalid file extension. Only jpg, jpeg, png, gif, and webp are allowed."
      );
    }

    // Generate unique S3 key for the profile picture
    const imageKey = s3Service.generateProfilePictureKey(
      userId,
      request.fileExtension
    );

    // Generate pre-signed upload URL
    const uploadUrl = await s3Service.generateUploadUrl(
      imageKey,
      request.contentType
    );

    return new ImageUploadResponseDTO(uploadUrl, imageKey);
  }

  async updateUserProfilePicture(
    userId: string,
    profilePictureKey: string
  ): Promise<void> {
    await this.repository.updateProfilePicture(userId, profilePictureKey);
  }
}
