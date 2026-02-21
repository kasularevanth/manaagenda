import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

type TokenPayload = {
  userId: string;
  role: "ADMIN" | "EMPLOYEE" | "CLIENT";
};

export const hashPassword = (password: string) => argon2.hash(password);

export const verifyPassword = (hash: string, password: string) =>
  argon2.verify(hash, password);

export const signAccessToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"],
  });

export const signRefreshToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL as jwt.SignOptions["expiresIn"],
  });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
