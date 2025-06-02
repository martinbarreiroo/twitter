import jwt from "jsonwebtoken";
import { Socket } from "socket.io";
import { Constants } from "@utils";

export interface AuthenticatedSocket extends Socket {
  userId: string;
}

export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    // Try to get token from multiple sources
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.split(" ")[1] ||
      (socket.handshake.query.token as string);

    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    jwt.verify(token, Constants.TOKEN_SECRET, (err: any, decoded: any) => {
      if (err) {
        return next(new Error("Invalid authentication token"));
      }

      (socket as AuthenticatedSocket).userId = decoded.userId;
      next();
    });
  } catch (error) {
    next(new Error("Authentication failed"));
  }
};
