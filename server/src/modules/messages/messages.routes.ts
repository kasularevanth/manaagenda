import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../lib/errors";

const router = Router();
router.use(requireAuth);

const canMessage = async (senderId: string, receiverId: string) => {
  const users = await prisma.user.findMany({
    where: { id: { in: [senderId, receiverId] } },
    select: { id: true, role: true },
  });

  if (users.length !== 2) {
    return false;
  }

  const sender = users.find((user: (typeof users)[number]) => user.id === senderId)!;
  const receiver = users.find((user: (typeof users)[number]) => user.id === receiverId)!;

  const isAdminPair =
    (sender.role === "ADMIN" && (receiver.role === "EMPLOYEE" || receiver.role === "CLIENT")) ||
    (receiver.role === "ADMIN" && (sender.role === "EMPLOYEE" || sender.role === "CLIENT"));

  if (isAdminPair) {
    return true;
  }

  if (
    (sender.role === "CLIENT" && receiver.role === "EMPLOYEE") ||
    (sender.role === "EMPLOYEE" && receiver.role === "CLIENT")
  ) {
    const clientCompany = await prisma.clientCompany.findFirst({
      where: { contactUserId: sender.role === "CLIENT" ? sender.id : receiver.id },
    });

    if (!clientCompany) {
      return false;
    }

    const assignment = await prisma.projectAssignment.findFirst({
      where: {
        employeeUserId: sender.role === "EMPLOYEE" ? sender.id : receiver.id,
        project: {
          clientCompanyId: clientCompany.id,
        },
      },
    });

    if (!assignment) {
      return false;
    }

    return true;
  }

  return false;
};

router.get("/conversations", async (req, res, next) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: req.user!.id }, { receiverId: req.user!.id }],
      },
      include: {
        sender: { select: { id: true, fullName: true, role: true } },
        receiver: { select: { id: true, fullName: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return res.json(messages);
  } catch (error) {
    return next(error);
  }
});

router.get("/recipients", async (req, res, next) => {
  try {
    const roleParam = req.query.role as string | undefined;
    const role = roleParam === "ADMIN" || roleParam === "EMPLOYEE" || roleParam === "CLIENT" ? roleParam : undefined;
    const currentUserId = req.user!.id;
    const currentRole = req.user!.role;

    const select = { id: true, fullName: true, role: true };

    if (currentRole === "ADMIN") {
      if (role === "EMPLOYEE") {
        const users = await prisma.user.findMany({
          where: { role: "EMPLOYEE", isActive: true },
          select,
          orderBy: { fullName: "asc" },
        });
        return res.json(users);
      }
      if (role === "CLIENT") {
        const companies = await prisma.clientCompany.findMany({
          include: { contactUser: { select } },
        });
        const users = companies.map((c) => c.contactUser).filter(Boolean);
        const deduped = Array.from(new Map(users.map((u) => [u.id, u])).values());
        deduped.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
        return res.json(deduped);
      }
    }

    if (currentRole === "CLIENT") {
      const company = await prisma.clientCompany.findFirst({
        where: { contactUserId: currentUserId },
      });
      if (!company) return res.json([]);
      if (role === "ADMIN") {
        const users = await prisma.user.findMany({
          where: { role: "ADMIN", isActive: true },
          select,
          orderBy: { fullName: "asc" },
        });
        return res.json(users);
      }
      if (role === "EMPLOYEE") {
        const assignments = await prisma.projectAssignment.findMany({
          where: { project: { clientCompanyId: company.id } },
          include: { employee: { select } },
        });
        const employees = Array.from(new Map(assignments.map((a) => [a.employee.id, a.employee])).values());
        employees.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
        return res.json(employees);
      }
    }

    if (currentRole === "EMPLOYEE") {
      if (role === "ADMIN") {
        const users = await prisma.user.findMany({
          where: { role: "ADMIN", isActive: true },
          select,
          orderBy: { fullName: "asc" },
        });
        return res.json(users);
      }
      if (role === "CLIENT") {
        const myAssignments = await prisma.projectAssignment.findMany({
          where: { employeeUserId: currentUserId },
          include: { project: { include: { clientCompany: { include: { contactUser: { select } } } } } },
        });
        const clients = myAssignments
          .map((a) => a.project.clientCompany.contactUser)
          .filter(Boolean) as { id: string; fullName: string; role: string }[];
        const deduped = Array.from(new Map(clients.map((u) => [u.id, u])).values());
        deduped.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
        return res.json(deduped);
      }
    }

    return res.json([]);
  } catch (error) {
    return next(error);
  }
});

router.post("/send", async (req, res, next) => {
  try {
    const body = z
      .object({
        receiverId: z.string().uuid(),
        content: z.string().min(1).max(1500),
        projectId: z.string().uuid().optional(),
      })
      .parse(req.body);

    const allowed = await canMessage(req.user!.id, body.receiverId);
    if (!allowed) {
      throw new ApiError(403, "Messaging not allowed for this user pair");
    }

    const message = await prisma.message.create({
      data: {
        senderId: req.user!.id,
        receiverId: body.receiverId,
        content: body.content,
        projectId: body.projectId,
      },
    });

    return res.status(201).json(message);
  } catch (error) {
    return next(error);
  }
});

router.get("/:otherUserId", async (req, res, next) => {
  try {
    const otherUserId = req.params.otherUserId;
    const allowed = await canMessage(req.user!.id, otherUserId);
    if (!allowed) {
      throw new ApiError(403, "Messaging not allowed for this user pair");
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user!.id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: req.user!.id },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    return res.json(messages);
  } catch (error) {
    return next(error);
  }
});

export { router as messagesRouter };
