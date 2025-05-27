import { NotFoundException } from "@utils/errors";
import { s3Service } from "@utils";
import { OffsetPagination } from "types";
import {
  UserViewDTO,
  ImageUploadRequestDTO,
  ImageUploadResponseDTO,
} from "../dto";
import { UserRepository } from "../repository";
import { UserService } from "./user.service";

export class UserServiceImpl implements UserService {
  constructor(private readonly repository: UserRepository) {}

  async getUser(userId: string): Promise<UserViewDTO> {
    const user = await this.repository.getById(userId);
    if (!user) throw new NotFoundException("user");
    return user;
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
