import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { AuthRequest, authenticate } from "../middleware/auth";
import { addressSchema } from "../schemas";
import { param } from "../utils/helpers";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    res.json({ addresses });
  })
);

router.post(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = addressSchema.parse(req.body);
    const userId = req.user!.userId;

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const count = await prisma.address.count({ where: { userId } });
    const address = await prisma.address.create({
      data: {
        ...data,
        userId,
        isDefault: data.isDefault ?? count === 0,
      },
    });

    res.status(201).json({ address });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = addressSchema.partial().parse(req.body);
    const userId = req.user!.userId;
    const id = param(req.params.id);

    const existing = await prisma.address.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new AppError(404, "Address not found");
    }

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data,
    });

    res.json({ address });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const id = param(req.params.id);
    const existing = await prisma.address.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new AppError(404, "Address not found");
    }

    await prisma.address.delete({ where: { id } });

    if (existing.isDefault) {
      const next = await prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      if (next) {
        await prisma.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    res.status(204).send();
  })
);

export default router;
