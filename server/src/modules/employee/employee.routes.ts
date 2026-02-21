import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/errors";

const router = Router();
router.use(requireAuth, requireRole("EMPLOYEE"));

router.get("/projects", async (req, res, next) => {
  try {
    const assignments = await prisma.projectAssignment.findMany({
      where: { employeeUserId: req.user!.id },
      include: {
        project: { include: { clientCompany: true } },
      },
      orderBy: { assignedAt: "desc" },
    });

    return res.json(assignments.map((item: (typeof assignments)[number]) => item.project));
  } catch (error) {
    return next(error);
  }
});

router.patch("/projects/:id/status", async (req, res, next) => {
  try {
    const body = z
      .object({ status: z.enum(["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED"]) })
      .parse(req.body);

    const assignment = await prisma.projectAssignment.findUnique({
      where: {
        projectId_employeeUserId: {
          projectId: req.params.id,
          employeeUserId: req.user!.id,
        },
      },
    });

    if (!assignment) {
      throw new ApiError(403, "You are not assigned to this project");
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { status: body.status },
    });

    return res.json(project);
  } catch (error) {
    return next(error);
  }
});

export { router as employeeRouter };
