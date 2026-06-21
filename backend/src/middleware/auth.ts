import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../lib/jwt";
import { AppError } from "./errorHandler";
import { Role } from "@prisma/client";

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "Authentication required", "AUTH_REQUIRED");
  }

  const token = header.slice(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    throw new AppError(401, "Invalid or expired token", "INVALID_TOKEN");
  }
}

export function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      req.user = verifyToken(header.slice(7));
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, "Authentication required", "AUTH_REQUIRED");
    }
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, "Insufficient permissions", "FORBIDDEN");
    }
    next();
  };
}
