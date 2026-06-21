export type Role = "USER" | "ADMIN";

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  productCount?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  sku: string;
  brand: string;
  imageUrl: string;
  images: string[];
  categoryId: string;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
  category?: { id: string; name: string; slug: string };
}

export interface CartItem {
  id: string;
  quantity: number;
  product: Product;
  lineTotal: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  name: string;
  imageUrl: string;
  productId: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  addressId: string;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  address?: Address;
  user?: Pick<User, "firstName" | "lastName" | "email">;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminStats {
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  totalRevenue: number;
  recentOrders: Order[];
}
