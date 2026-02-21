import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/errors";

type AllowedRole = "ADMIN" | "EMPLOYEE" | "CLIENT";

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Missing authorization token"));
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user || !user.isActive) {
      return next(new ApiError(401, "Invalid authentication"));
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    return next();
  } catch {
    return next(new ApiError(401, "Invalid or expired token"));
  }
};

export const requireRole =
  (...roles: AllowedRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "Forbidden"));
    }

    return next();
  };
