import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

const router = Router();
router.use(requireAuth);

router.patch("/", async (req, res, next) => {
  try {
    const body = z
      .object({
        fullName: z.string().min(2).optional(),
        bio: z.string().max(500).optional(),
        phone: z.string().max(20).optional(),
      })
      .parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: body,
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

export { router as profileRouter };
