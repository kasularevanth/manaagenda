import { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/errors";

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return res.status(500).json({ message: "Internal server error" });
};
