import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/errorHandler";
import { productQuerySchema } from "../schemas";
import { formatProduct, param } from "../utils/helpers";
import { Prisma } from "@prisma/client";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = productQuerySchema.parse(req.query);
    const { page, limit, category, search, sort, minPrice, maxPrice } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (category) {
      where.category = { slug: category };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    switch (sort) {
      case "price_asc":
        orderBy = { price: "asc" };
        break;
      case "price_desc":
        orderBy = { price: "desc" };
        break;
      case "rating":
        orderBy = { rating: "desc" };
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products: products.map(formatProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

router.get(
  "/featured",
  asyncHandler(async (_req, res) => {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
      take: 8,
    });

    res.json({ products: products.map(formatProduct) });
  })
);

router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { slug: param(req.params.slug) },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    if (!product || !product.isActive) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const related = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        isActive: true,
        id: { not: product.id },
      },
      take: 4,
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    res.json({
      product: formatProduct(product),
      related: related.map(formatProduct),
    });
  })
);

export default router;
