import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/errors";

const router = Router();
router.use(requireAuth, requireRole("CLIENT"));

const getClientCompanyId = async (userId: string) => {
  const company = await prisma.clientCompany.findFirst({
    where: { contactUserId: userId },
  });
  return company?.id;
};

router.get("/projects", async (req, res, next) => {
  try {
    const companyId = await getClientCompanyId(req.user!.id);
    if (!companyId) {
      throw new ApiError(404, "Client company not found");
    }

    const projects = await prisma.project.findMany({
      where: { clientCompanyId: companyId },
      include: {
        assignments: {
          include: { employee: { select: { id: true, fullName: true, email: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(projects);
  } catch (error) {
    return next(error);
  }
});

router.post("/service-requests", async (req, res, next) => {
  try {
    const companyId = await getClientCompanyId(req.user!.id);
    if (!companyId) {
      throw new ApiError(404, "Client company not found");
    }

    const body = z
      .object({
        serviceId: z.string().uuid(),
        notes: z.string().min(3).optional(),
      })
      .parse(req.body);

    const request = await prisma.serviceRequest.create({
      data: {
        clientCompanyId: companyId,
        serviceId: body.serviceId,
        notes: body.notes,
      },
      include: { service: true },
    });

    return res.status(201).json(request);
  } catch (error) {
    return next(error);
  }
});

router.get("/service-requests", async (req, res, next) => {
  try {
    const companyId = await getClientCompanyId(req.user!.id);
    if (!companyId) {
      throw new ApiError(404, "Client company not found");
    }

    const requests = await prisma.serviceRequest.findMany({
      where: { clientCompanyId: companyId },
      include: { service: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json(requests);
  } catch (error) {
    return next(error);
  }
});

export { router as clientRouter };
