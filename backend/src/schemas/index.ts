import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const addressSchema = z.object({
  label: z.string().min(1).max(50),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2).default("IN"),
  isDefault: z.boolean().optional(),
});

export const cartItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1).max(99),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(99),
});

export const checkoutSchema = z.object({
  addressId: z.string().cuid(),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  category: z.preprocess(emptyToUndefined, z.string().optional()),
  search: z.preprocess(emptyToUndefined, z.string().optional()),
  sort: z.preprocess(
    emptyToUndefined,
    z.enum(["price_asc", "price_desc", "newest", "rating"]).optional()
  ),
  minPrice: z.preprocess(emptyToUndefined, z.coerce.number().min(0).optional()),
  maxPrice: z.preprocess(emptyToUndefined, z.coerce.number().min(0).optional()),
});

function emptyToUndefined(val: unknown) {
  if (val === "" || val === null || val === undefined) return undefined;
  return val;
}

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  stock: z.number().int().min(0),
  sku: z.string().min(1).max(50),
  brand: z.string().min(1).max(100),
  imageUrl: z.string().url(),
  images: z.array(z.string().url()).optional(),
  categoryId: z.string().cuid(),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});
