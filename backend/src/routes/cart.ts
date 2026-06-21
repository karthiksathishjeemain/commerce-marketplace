import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { AuthRequest, authenticate } from "../middleware/auth";
import { cartItemSchema, updateCartItemSchema } from "../schemas";
import { formatProduct, param } from "../utils/helpers";

const router = Router();

router.use(authenticate);

async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: { category: { select: { id: true, name: true, slug: true } } },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { category: { select: { id: true, name: true, slug: true } } },
            },
          },
        },
      },
    });
  }

  return cart;
}

function formatCart(cart: Awaited<ReturnType<typeof getOrCreateCart>>) {
  const items = cart.items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    product: formatProduct(item.product),
    lineTotal: Number(item.product.price) * item.quantity,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { id: cart.id, items, subtotal, itemCount };
}

router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const cart = await getOrCreateCart(req.user!.userId);
    res.json({ cart: formatCart(cart) });
  })
);

router.post(
  "/items",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId, quantity } = cartItemSchema.parse(req.body);
    const userId = req.user!.userId;

    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
    });
    if (!product) {
      throw new AppError(404, "Product not found");
    }
    if (product.stock < quantity) {
      throw new AppError(400, `Only ${product.stock} items available`, "INSUFFICIENT_STOCK");
    }

    const cart = await getOrCreateCart(userId);

    const existing = cart.items.find((i) => i.productId === productId);
    const newQty = (existing?.quantity ?? 0) + quantity;

    if (newQty > product.stock) {
      throw new AppError(400, `Only ${product.stock} items available`, "INSUFFICIENT_STOCK");
    }

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
      });
    }

    const updated = await getOrCreateCart(userId);
    res.json({ cart: formatCart(updated) });
  })
);

router.patch(
  "/items/:itemId",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { quantity } = updateCartItemSchema.parse(req.body);
    const userId = req.user!.userId;
    const cart = await getOrCreateCart(userId);

    const item = cart.items.find((i) => i.id === param(req.params.itemId));
    if (!item) {
      throw new AppError(404, "Cart item not found");
    }

    if (quantity === 0) {
      await prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      if (quantity > item.product.stock) {
        throw new AppError(400, `Only ${item.product.stock} items available`, "INSUFFICIENT_STOCK");
      }
      await prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity },
      });
    }

    const updated = await getOrCreateCart(userId);
    res.json({ cart: formatCart(updated) });
  })
);

router.delete(
  "/items/:itemId",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const cart = await getOrCreateCart(userId);

    const item = cart.items.find((i) => i.id === param(req.params.itemId));
    if (!item) {
      throw new AppError(404, "Cart item not found");
    }

    await prisma.cartItem.delete({ where: { id: item.id } });
    const updated = await getOrCreateCart(userId);
    res.json({ cart: formatCart(updated) });
  })
);

router.delete(
  "/",
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const cart = await getOrCreateCart(userId);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    const updated = await getOrCreateCart(userId);
    res.json({ cart: formatCart(updated) });
  })
);

export default router;
