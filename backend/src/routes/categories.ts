import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/errorHandler";
import { param } from "../utils/helpers";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: { where: { isActive: true } } } } },
      orderBy: { name: "asc" },
    });

    res.json({
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        imageUrl: c.imageUrl,
        productCount: c._count.products,
      })),
    });
  })
);

router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const category = await prisma.category.findUnique({
      where: { slug: param(req.params.slug) },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });

    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    res.json({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: category.imageUrl,
        productCount: category._count.products,
      },
    });
  })
);

export default router;
