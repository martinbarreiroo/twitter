import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || "us-east-1";
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || "";

    if (!this.bucketName) {
      throw new Error("AWS_S3_BUCKET_NAME environment variable is required");
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }

  /**
   * Generate a pre-signed URL for uploading an image to S3
   * @param key - The S3 object key (file path)
   * @param contentType - The MIME type of the file
   * @param expiresIn - URL expiration time in seconds (default: 900 = 15 minutes)
   * @returns Pre-signed URL for uploading
   */
  async generateUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 900
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Generate a pre-signed URL for downloading/viewing an image from S3
   * @param key - The S3 object key (file path)
   * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
   * @returns Pre-signed URL for downloading
   */
  async generateDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Generate a unique key for storing user profile pictures
   * @param userId - The user ID
   * @param fileExtension - The file extension (e.g., 'jpg', 'png')
   * @returns S3 key for the profile picture
   */
  generateProfilePictureKey(userId: string, fileExtension: string): string {
    const timestamp = Date.now();
    return `profile-pictures/${userId}/${timestamp}.${fileExtension}`;
  }

  /**
   * Generate a unique key for storing post images
   * @param userId - The user ID who is posting
   * @param postId - The post ID
   * @param imageIndex - The index of the image in the post (for multiple images)
   * @param fileExtension - The file extension (e.g., 'jpg', 'png')
   * @returns S3 key for the post image
   */
  generatePostImageKey(
    userId: string,
    postId: string,
    imageIndex: number,
    fileExtension: string
  ): string {
    const timestamp = Date.now();
    return `post-images/${userId}/${postId}/${imageIndex}-${timestamp}.${fileExtension}`;
  }

  /**
   * Generate a unique key for storing post images with actual post ID
   * @param userId - The user ID who is posting
   * @param postId - The actual post ID (after post creation)
   * @param imageIndex - The index of the image in the post (for multiple images)
   * @param fileExtension - The file extension (e.g., 'jpg', 'png')
   * @returns S3 key for the post image
   */
  generatePostImageKeyWithPostId(
    userId: string,
    postId: string,
    imageIndex: number,
    fileExtension: string
  ): string {
    return `post-images/${userId}/${postId}/${imageIndex}.${fileExtension}`;
  }

  /**
   * Move/copy an image from temporary location to final location
   * This would be used after post creation to move images to their final location
   * @param tempKey - The temporary S3 key
   * @param finalKey - The final S3 key
   */
  async moveImage(tempKey: string, finalKey: string): Promise<void> {
    // Implementation would use S3 copy and delete operations
    // This is a placeholder for the actual implementation
    console.log(`Moving image from ${tempKey} to ${finalKey}`);
  }

  /**
   * Get the public URL for an S3 object (for public buckets)
   * @param key - The S3 object key
   * @returns Public URL for the object
   */
  getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Validate file extension for images
   * @param fileExtension - The file extension to validate
   * @returns true if valid image extension
   */
  isValidImageExtension(fileExtension: string): boolean {
    const validExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
    return validExtensions.includes(fileExtension.toLowerCase());
  }

  /**
   * Get content type from file extension
   * @param fileExtension - The file extension
   * @returns MIME content type
   */
  getContentType(fileExtension: string): string {
    const contentTypes: { [key: string]: string } = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };

    return (
      contentTypes[fileExtension.toLowerCase()] || "application/octet-stream"
    );
  }
}

export const s3Service = new S3Service();
