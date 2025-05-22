import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
} from "class-validator";

export class TokenDTO {
  token!: string;
}

export class SignupInputDTO {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  constructor(
    email: string,
    username: string,
    name: string,
    password: string,
    isPrivate?: boolean
  ) {
    this.email = email;
    this.password = password;
    this.username = username;
    this.name = name;
    this.isPrivate = isPrivate;
  }
}

export class LoginInputDTO {
  @IsOptional()
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  username?: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  password!: string;
}
