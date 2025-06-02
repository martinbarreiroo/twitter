import { AuthServiceImpl } from "./auth.service.impl";
import { UserRepository } from "@domains/user/repository";
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  checkPassword,
  encryptPassword,
  generateAccessToken,
} from "@utils";
import { LoginInputDTO, SignupInputDTO } from "../dto";

// Mock the utils
jest.mock("@utils", () => ({
  ConflictException: jest.fn().mockImplementation((message) => {
    const error = new Error(message);
    error.name = "ConflictException";
    return error;
  }),
  NotFoundException: jest.fn().mockImplementation((message) => {
    const error = new Error(message);
    error.name = "NotFoundException";
    return error;
  }),
  UnauthorizedException: jest.fn().mockImplementation((message) => {
    const error = new Error(message);
    error.name = "UnauthorizedException";
    return error;
  }),
  checkPassword: jest.fn(),
  encryptPassword: jest.fn(),
  generateAccessToken: jest.fn(),
}));

describe("AuthServiceImpl", () => {
  let authService: AuthServiceImpl;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      getByEmailOrUsername: jest.fn(),
      create: jest.fn(),
    } as any;

    authService = new AuthServiceImpl(mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("signup", () => {
    const signupData: SignupInputDTO = {
      email: "test@example.com",
      username: "testuser",
      password: "password123",
      name: "Test User",
    };

    it("should successfully create a new user and return a token", async () => {
      const encryptedPassword = "encrypted_password";
      const mockUser = {
        id: "user-123",
        name: signupData.name,
        username: signupData.username,
        profilePicture: null,
        likesCount: 0,
        retweetsCount: 0,
        commentsCount: 0,
        followsYou: false,
        isPrivate: signupData.isPrivate || false,
      };
      const mockToken = "jwt_token";

      mockUserRepository.getByEmailOrUsername.mockResolvedValue(null);
      (encryptPassword as jest.Mock).mockResolvedValue(encryptedPassword);
      mockUserRepository.create.mockResolvedValue(mockUser);
      (generateAccessToken as jest.Mock).mockReturnValue(mockToken);

      const result = await authService.signup(signupData);

      expect(mockUserRepository.getByEmailOrUsername).toHaveBeenCalledWith(
        signupData.email,
        signupData.username
      );
      expect(encryptPassword).toHaveBeenCalledWith(signupData.password);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...signupData,
        password: encryptedPassword,
      });
      expect(generateAccessToken).toHaveBeenCalledWith({ userId: mockUser.id });
      expect(result).toEqual({ token: mockToken });
    });

    it("should throw ConflictException when user already exists", async () => {
      const existingUser = {
        id: "existing-user",
        email: "test@example.com",
        username: "existinguser",
        name: "Existing User",
        password: "encrypted_password",
        createdAt: new Date(),
        isPrivate: false,
        profilePicture: null,
        likesCount: 0,
        retweetsCount: 0,
        commentsCount: 0,
      };
      mockUserRepository.getByEmailOrUsername.mockResolvedValue(existingUser);

      await expect(authService.signup(signupData)).rejects.toThrow(
        "USER_ALREADY_EXISTS"
      );
      expect(ConflictException).toHaveBeenCalledWith("USER_ALREADY_EXISTS");
    });
  });

  describe("login", () => {
    const loginData: LoginInputDTO = {
      email: "test@example.com",
      username: "testuser",
      password: "password123",
    };

    it("should successfully login and return a token", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        username: "testuser",
        name: "Test User",
        password: "encrypted_password",
        createdAt: new Date(),
        isPrivate: false,
        profilePicture: null,
        likesCount: 0,
        retweetsCount: 0,
        commentsCount: 0,
      };
      const mockToken = "jwt_token";

      mockUserRepository.getByEmailOrUsername.mockResolvedValue(mockUser);
      (checkPassword as jest.Mock).mockResolvedValue(true);
      (generateAccessToken as jest.Mock).mockReturnValue(mockToken);

      const result = await authService.login(loginData);

      expect(mockUserRepository.getByEmailOrUsername).toHaveBeenCalledWith(
        loginData.email,
        loginData.username
      );
      expect(checkPassword).toHaveBeenCalledWith(
        loginData.password,
        mockUser.password
      );
      expect(generateAccessToken).toHaveBeenCalledWith({ userId: mockUser.id });
      expect(result).toEqual({ token: mockToken });
    });

    it("should throw NotFoundException when user does not exist", async () => {
      mockUserRepository.getByEmailOrUsername.mockResolvedValue(null);

      await expect(authService.login(loginData)).rejects.toThrow("user");
      expect(NotFoundException).toHaveBeenCalledWith("user");
    });

    it("should throw UnauthorizedException when password is incorrect", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        username: "testuser",
        name: "Test User",
        password: "encrypted_password",
        createdAt: new Date(),
        isPrivate: false,
        profilePicture: null,
        likesCount: 0,
        retweetsCount: 0,
        commentsCount: 0,
      };

      mockUserRepository.getByEmailOrUsername.mockResolvedValue(mockUser);
      (checkPassword as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginData)).rejects.toThrow(
        "INCORRECT_PASSWORD"
      );
      expect(UnauthorizedException).toHaveBeenCalledWith("INCORRECT_PASSWORD");
    });
  });
});
