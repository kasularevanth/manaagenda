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

router.get("/services", async (_req, res, next) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, description: true, createdAt: true },
    });
    return res.json(services);
  } catch (error) {
    return next(error);
  }
});

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
        projectName: z.string().min(2).max(120),
        projectDescription: z.string().min(5).max(1200),
        notes: z
          .string()
          .trim()
          .transform((value) => (value.length ? value : undefined))
          .optional(),
      })
      .parse(req.body);

    let defaultService = await prisma.service.findFirst({
      where: { name: "Client Requested Service" },
      select: { id: true },
    });

    if (!defaultService) {
      defaultService = await prisma.service.create({
        data: {
          name: "Client Requested Service",
          description: "Default service for client-initiated project requests.",
          isActive: true,
        },
        select: { id: true },
      });
    }

    const compiledNotes = [
      `Project Name: ${body.projectName}`,
      `Project Description: ${body.projectDescription}`,
      body.notes ? `Client Notes: ${body.notes}` : undefined,
    ]
      .filter(Boolean)
      .join("\n");

    const request = await prisma.serviceRequest.create({
      data: {
        clientCompanyId: companyId,
        serviceId: defaultService.id,
        notes: compiledNotes,
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
