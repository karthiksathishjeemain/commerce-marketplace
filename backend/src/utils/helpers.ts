export function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export { slugify };

export function formatProduct(product: {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: { toString(): string } | number | string;
  compareAtPrice?: { toString(): string } | number | string | null;
  stock: number;
  sku: string;
  brand: string;
  imageUrl: string;
  images: string[];
  categoryId: string;
  rating: { toString(): string } | number | string;
  reviewCount: number;
  isActive: boolean;
  createdAt: Date;
  category?: { id: string; name: string; slug: string };
}) {
  return {
    ...product,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    rating: Number(product.rating),
  };
}

export function formatOrder(order: {
  id: string;
  orderNumber: string;
  userId: string;
  addressId: string;
  status: string;
  subtotal: { toString(): string };
  shippingCost: { toString(): string };
  tax: { toString(): string };
  total: { toString(): string };
  stripeSessionId?: string | null;
  stripePaymentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: Array<{
    id: string;
    quantity: number;
    unitPrice: { toString(): string };
    name: string;
    imageUrl: string;
    productId: string;
  }>;
  address?: unknown;
}) {
  return {
    ...order,
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shippingCost),
    tax: Number(order.tax),
    total: Number(order.total),
    items: order.items?.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
    })),
  };
}
