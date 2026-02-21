import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/errors";
import { hashPassword } from "../../lib/auth";
import { toTitleCase } from "../../lib/text";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/dashboard", async (_req, res, next) => {
  try {
    const [employees, clients, approvedRequests, assignedProjects] = await Promise.all([
      prisma.user.count({ where: { role: "EMPLOYEE", isActive: true } }),
      prisma.user.count({ where: { role: "CLIENT", isActive: true } }),
      prisma.serviceRequest.count({ where: { status: "APPROVED" } }),
      prisma.project.count({ where: { assignments: { some: {} } } }),
    ]);

    return res.json({
      employees,
      clients,
      totalUsers: employees + clients,
      approvedRequests,
      assignedProjects,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/users", async (req, res, next) => {
  try {
    const body = z
      .object({
        fullName: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
        role: z.enum(["EMPLOYEE", "CLIENT"]),
      })
      .parse(req.body);

    const user = await prisma.user.create({
      data: {
        fullName: toTitleCase(body.fullName),
        email: body.email.toLowerCase(),
        role: body.role,
        passwordHash: await hashPassword(body.password),
      },
      select: { id: true, fullName: true, email: true, role: true, createdAt: true },
    });

    return res.status(201).json(user);
  } catch (error) {
    return next(error);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const role = req.query.role as "EMPLOYEE" | "CLIENT" | undefined;
    const users = await prisma.user.findMany({
      where: role ? { role } : { role: { in: ["EMPLOYEE", "CLIENT"] } },
      select: { id: true, fullName: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(users);
  } catch (error) {
    return next(error);
  }
});

router.delete("/employees/:id", async (req, res, next) => {
  try {
    const employee = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!employee || employee.role !== "EMPLOYEE") {
      throw new ApiError(404, "Employee not found");
    }

    await prisma.user.update({
      where: { id: employee.id },
      data: { isActive: false },
    });

    return res.json({ message: "Employee removed" });
  } catch (error) {
    return next(error);
  }
});

router.post("/clients", async (req, res, next) => {
  try {
    const body = z
      .object({
        companyName: z.string().min(2),
        contactUserId: z.string().uuid(),
      })
      .parse(req.body);

    const contact = await prisma.user.findUnique({ where: { id: body.contactUserId } });
    if (!contact || contact.role !== "CLIENT") {
      throw new ApiError(400, "Contact user must be a client user");
    }

    const company = await prisma.clientCompany.create({
      data: body,
      include: { contactUser: { select: { id: true, fullName: true, email: true } } },
    });

    return res.status(201).json(company);
  } catch (error) {
    return next(error);
  }
});

router.get("/clients", async (_req, res, next) => {
  try {
    const companies = await prisma.clientCompany.findMany({
      include: { contactUser: { select: { id: true, fullName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json(companies);
  } catch (error) {
    return next(error);
  }
});

router.post("/services", async (req, res, next) => {
  try {
    const body = z.object({ name: z.string().min(2), description: z.string().min(5) }).parse(req.body);
    const service = await prisma.service.create({ data: body });
    return res.status(201).json(service);
  } catch (error) {
    return next(error);
  }
});

router.get("/services", async (_req, res, next) => {
  try {
    const services = await prisma.service.findMany({ orderBy: { createdAt: "desc" } });
    return res.json(services);
  } catch (error) {
    return next(error);
  }
});

router.get("/service-requests", async (_req, res, next) => {
  try {
    const requests = await prisma.serviceRequest.findMany({
      include: {
        service: true,
        clientCompany: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(requests);
  } catch (error) {
    return next(error);
  }
});

router.post("/service-requests/:id/approve", async (req, res, next) => {
  try {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: req.params.id },
      include: { service: true, clientCompany: true },
    });
    if (!request || request.status !== "PENDING") {
      throw new ApiError(404, "Pending request not found");
    }

    const approved = await prisma.serviceRequest.update({
      where: { id: request.id },
      data: {
        status: "APPROVED",
        approvedById: req.user!.id,
        approvedAt: new Date(),
      },
    });

    const project = await prisma.project.create({
      data: {
        name: `${request.clientCompany.companyName} - ${request.service.name}`,
        description: request.notes || `${request.service.name} implementation`,
        clientCompanyId: request.clientCompanyId,
        serviceRequestId: request.id,
        status: "PLANNING",
      },
    });

    return res.json({ approved, project });
  } catch (error) {
    return next(error);
  }
});

router.post("/projects", async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().min(2),
        description: z.string().min(5),
        clientCompanyId: z.string().uuid(),
      })
      .parse(req.body);
    const project = await prisma.project.create({ data: body });
    return res.status(201).json(project);
  } catch (error) {
    return next(error);
  }
});

router.get("/projects", async (_req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        clientCompany: true,
        assignments: { include: { employee: { select: { id: true, fullName: true, email: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(projects);
  } catch (error) {
    return next(error);
  }
});

router.patch("/projects/:id", async (req, res, next) => {
  try {
    const body = z
      .object({
        name: z.string().min(2).optional(),
        description: z.string().min(5).optional(),
        status: z.enum(["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED"]).optional(),
      })
      .parse(req.body);

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: body,
    });
    return res.json(project);
  } catch (error) {
    return next(error);
  }
});

router.post("/projects/:id/assignments", async (req, res, next) => {
  try {
    const body = z.object({ employeeUserId: z.string().uuid() }).parse(req.body);
    const employee = await prisma.user.findUnique({ where: { id: body.employeeUserId } });
    if (!employee || employee.role !== "EMPLOYEE") {
      throw new ApiError(400, "Invalid employee");
    }

    const assignment = await prisma.projectAssignment.create({
      data: {
        projectId: req.params.id,
        employeeUserId: body.employeeUserId,
        assignedById: req.user!.id,
      },
    });

    return res.status(201).json(assignment);
  } catch (error) {
    return next(error);
  }
});

router.delete("/projects/:id/assignments/:employeeUserId", async (req, res, next) => {
  try {
    await prisma.projectAssignment.delete({
      where: {
        projectId_employeeUserId: {
          projectId: req.params.id,
          employeeUserId: req.params.employeeUserId,
        },
      },
    });
    return res.json({ message: "Employee unassigned" });
  } catch (error) {
    return next(error);
  }
});

export { router as adminRouter };
