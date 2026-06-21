import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/auth";
import { registerSchema, loginSchema } from "../schemas";

const router = Router();

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) {
      throw new AppError(409, "Email already registered", "EMAIL_EXISTS");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        cart: { create: {} },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({ user, token });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (!user) {
      throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    });
  })
);

router.get(
  "/me",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new AppError(401, "Authentication required");
    }

    const { verifyToken } = await import("../lib/jwt");
    const payload = verifyToken(header.slice(7));

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    res.json({ user });
  })
);

export default router;
