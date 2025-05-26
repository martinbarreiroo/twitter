export class UserDTO {
  constructor(user: UserDTO) {
    this.id = user.id;
    this.name = user.name;
    this.createdAt = user.createdAt;
    this.isPrivate = user.isPrivate || false;
    this.likesCount = user.likesCount || 0;
    this.retweetsCount = user.retweetsCount || 0;
    this.commentsCount = user.commentsCount || 0;
  }

  id: string;
  name: string | null;
  createdAt: Date;
  isPrivate: boolean;
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
  }

  id: string;
  name: string;
  username: string;
  profilePicture: string | null;
}
