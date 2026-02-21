import { Router } from "express";
import { z } from "zod";
import { hashPassword, signAccessToken, signRefreshToken, verifyPassword, verifyRefreshToken } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/errors";
import { requireAuth } from "../../middleware/auth";
import { env } from "../../config/env";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "EMPLOYEE", "CLIENT"]),
});

const refreshCookieName = "refreshToken";

const cookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: "lax" as const,
  domain: env.COOKIE_DOMAIN || undefined,
  path: "/",
};

router.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (existingUser) {
      throw new ApiError(409, "Email already exists");
    }

    const user = await prisma.user.create({
      data: {
        fullName: body.fullName,
        email: body.email.toLowerCase(),
        passwordHash: await hashPassword(body.password),
        role: body.role,
      },
      select: { id: true, fullName: true, email: true, role: true },
    });

    return res.status(201).json(user);
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !(await verifyPassword(user.passwordHash, password))) {
      throw new ApiError(401, "Invalid credentials");
    }

    const payload = { userId: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    const refreshTokenHash = await hashPassword(refreshToken);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie(refreshCookieName, refreshToken, cookieOptions);

    return res.json({
      accessToken,
      user: {
        id: user.id,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const refreshToken = req.cookies[refreshCookieName] as string | undefined;
    if (!refreshToken) {
      throw new ApiError(401, "Missing refresh token");
    }

    const payload = verifyRefreshToken(refreshToken);
    const storedTokens = await prisma.refreshToken.findMany({
      where: {
        userId: payload.userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    const matchedToken = await Promise.all(
      storedTokens.map(async (item: (typeof storedTokens)[number]) => ({
        id: item.id,
        match: await verifyPassword(item.tokenHash, refreshToken),
      })),
    );

    const activeToken = matchedToken.find((item: { id: string; match: boolean }) => item.match);
    if (!activeToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    await prisma.refreshToken.update({
      where: { id: activeToken.id },
      data: { isRevoked: true },
    });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      throw new ApiError(401, "Invalid authentication");
    }

    const nextPayload = { userId: user.id, role: user.role };
    const nextAccessToken = signAccessToken(nextPayload);
    const nextRefreshToken = signRefreshToken(nextPayload);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: await hashPassword(nextRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie(refreshCookieName, nextRefreshToken, cookieOptions);

    return res.json({
      accessToken: nextAccessToken,
      user: {
        id: user.id,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const refreshToken = req.cookies[refreshCookieName] as string | undefined;
    if (refreshToken) {
      const tokens = await prisma.refreshToken.findMany({
        where: { isRevoked: false, expiresAt: { gt: new Date() } },
      });

      for (const token of tokens) {
        const isMatch = await verifyPassword(token.tokenHash, refreshToken);
        if (isMatch) {
          await prisma.refreshToken.update({
            where: { id: token.id },
            data: { isRevoked: true },
          });
          break;
        }
      }
    }

    res.clearCookie(refreshCookieName, cookieOptions);
    return res.json({ message: "Logged out" });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        bio: true,
        phone: true,
      },
    });

    return res.json(user);
  } catch (error) {
    return next(error);
  }
});

export { router as authRouter };
