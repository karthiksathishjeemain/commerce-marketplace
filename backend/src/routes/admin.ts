import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { AuthRequest, authenticate, requireRole } from "../middleware/auth";
import {
  createProductSchema,
  updateProductSchema,
  updateOrderStatusSchema,
  updateUserRoleSchema,
  productQuerySchema,
} from "../schemas";
import { slugify, formatProduct, formatOrder, param } from "../utils/helpers";
import { Prisma } from "@prisma/client";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [totalOrders, totalProducts, totalUsers, revenueResult, recentOrders] =
      await Promise.all([
        prisma.order.count({ where: { status: { not: "CANCELLED" } } }),
        prisma.product.count({ where: { isActive: true } }),
        prisma.user.count({ where: { role: "USER" } }),
        prisma.order.aggregate({
          where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
          _sum: { total: true },
        }),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        }),
      ]);

    res.json({
      stats: {
        totalOrders,
        totalProducts,
        totalUsers,
        totalRevenue: Number(revenueResult._sum.total ?? 0),
        recentOrders: recentOrders.map((o) => ({
          ...formatOrder(o),
          user: o.user,
        })),
      },
    });
  })
);

router.get(
  "/products",
  asyncHandler(async (req, res) => {
    const query = productQuerySchema.parse(req.query);
    const { page, limit, category, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};
    if (category) where.category = { slug: category };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products: products.map(formatProduct),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  })
);

router.post(
  "/products",
  asyncHandler(async (req, res) => {
    const data = createProductSchema.parse(req.body);
    const slug = slugify(data.name);

    const existing = await prisma.product.findFirst({
      where: { OR: [{ slug }, { sku: data.sku }] },
    });
    if (existing) {
      throw new AppError(409, "Product with this name or SKU already exists");
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        slug,
        images: data.images ?? [],
      },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    res.status(201).json({ product: formatProduct(product) });
  })
);

router.put(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const data = updateProductSchema.parse(req.body);

    const updateData: Prisma.ProductUpdateInput = { ...data };
    if (data.name) {
      updateData.slug = slugify(data.name);
    }

    const product = await prisma.product.update({
      where: { id: param(req.params.id) },
      data: updateData,
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    res.json({ product: formatProduct(product) });
  })
);

router.delete(
  "/products/:id",
  asyncHandler(async (req, res) => {
    await prisma.product.update({
      where: { id: param(req.params.id) },
      data: { isActive: false },
    });
    res.status(204).send();
  })
);

router.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const status = req.query.status as string | undefined;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status as Prisma.EnumOrderStatusFilter;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          address: true,
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders: orders.map((o) => ({ ...formatOrder(o), user: o.user })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  })
);

router.patch(
  "/orders/:id/status",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status } = updateOrderStatusSchema.parse(req.body);

    const order = await prisma.order.update({
      where: { id: param(req.params.id) },
      data: { status },
      include: { items: true, address: true },
    });

    res.json({ order: formatOrder(order) });
  })
);

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count(),
    ]);

    res.json({
      users: users.map((u) => ({
        ...u,
        orderCount: u._count.orders,
        _count: undefined,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  })
);

router.patch(
  "/users/:id/role",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { role } = updateUserRoleSchema.parse(req.body);

    if (param(req.params.id) === req.user!.userId) {
      throw new AppError(400, "Cannot change your own role");
    }

    const user = await prisma.user.update({
      where: { id: param(req.params.id) },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({ user });
  })
);

router.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
    res.json({ categories });
  })
);

export default router;
