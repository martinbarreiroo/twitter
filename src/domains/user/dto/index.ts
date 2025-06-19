export class UserDTO {
  constructor(user: UserDTO) {
    this.id = user.id;
    this.name = user.name;
    this.createdAt = user.createdAt;
    this.isPrivate = user.isPrivate || false;
    this.profilePicture = user.profilePicture || null;
    this.likesCount = user.likesCount || 0;
    this.retweetsCount = user.retweetsCount || 0;
    this.commentsCount = user.commentsCount || 0;
  }

  id: string;
  name: string | null;
  createdAt: Date;
  isPrivate: boolean;
  profilePicture: string | null;
  likesCount: number;
  retweetsCount: number;
  commentsCount: number;
}

export class ExtendedUserDTO extends UserDTO {
  constructor(user: ExtendedUserDTO) {
    super(user);
    this.email = user.email;
    this.name = user.name;
    this.password = user.password;
  }

  email!: string;
  username!: string;
  password!: string;
}
export class UserViewDTO {
  constructor(user: UserViewDTO) {
    this.id = user.id;
    this.name = user.name;
    this.username = user.username;
    this.profilePicture = user.profilePicture;
    this.likesCount = user.likesCount || 0;
    this.retweetsCount = user.retweetsCount || 0;
    this.commentsCount = user.commentsCount || 0;
    this.followsYou = user.followsYou || false;
    this.following = user.following || false;
    this.isPrivate = user.isPrivate || false;
  }

  id: string;
  name: string;
  username: string;
  profilePicture: string | null;
  likesCount: number;
  retweetsCount: number;
  commentsCount: number;
  followsYou: boolean;
  following: boolean;
  isPrivate: boolean;
}

export class UserAuthorDTO {
  constructor(user: UserAuthorDTO) {
    this.id = user.id;
    this.name = user.name;
    this.username = user.username;
    this.profilePicture = user.profilePicture;
    this.likesCount = user.likesCount || 0;
    this.retweetsCount = user.retweetsCount || 0;
    this.commentsCount = user.commentsCount || 0;
  }

  id: string;
  name: string;
  username: string;
  profilePicture: string | null;
  likesCount: number;
  retweetsCount: number;
  commentsCount: number;
}

export class ImageUploadRequestDTO {
  constructor(fileExtension: string, contentType: string) {
    this.fileExtension = fileExtension;
    this.contentType = contentType;
  }

  fileExtension: string;
  contentType: string;
}

export class ImageUploadResponseDTO {
  constructor(uploadUrl: string, imageKey: string) {
    this.uploadUrl = uploadUrl;
    this.imageKey = imageKey;
  }

  uploadUrl: string;
  imageKey: string;
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
