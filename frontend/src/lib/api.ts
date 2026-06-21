import type {
  Address,
  AdminStats,
  Cart,
  Category,
  Order,
  Pagination,
  Product,
  User,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? "Request failed", data.code);
  }

  return data as T;
}

export const api = {
  auth: {
    register: (body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    }) => request<{ user: User; token: string }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),

    login: (body: { email: string; password: string }) =>
      request<{ user: User; token: string }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),

    me: () => request<{ user: User }>("/auth/me"),
  },

  products: {
    list: (params?: Record<string, string | number | undefined>) => {
      const qs = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== "") qs.set(k, String(v));
        });
      }
      const query = qs.toString();
      return request<{ products: Product[]; pagination: Pagination }>(
        `/products${query ? `?${query}` : ""}`
      );
    },
    featured: () => request<{ products: Product[] }>("/products/featured"),
    get: (slug: string) =>
      request<{ product: Product; related: Product[] }>(`/products/${slug}`),
  },

  categories: {
    list: () => request<{ categories: Category[] }>("/categories"),
    get: (slug: string) => request<{ category: Category }>(`/categories/${slug}`),
  },

  cart: {
    get: () => request<{ cart: Cart }>("/cart"),
    addItem: (productId: string, quantity: number) =>
      request<{ cart: Cart }>("/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, quantity }),
      }),
    updateItem: (itemId: string, quantity: number) =>
      request<{ cart: Cart }>(`/cart/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      }),
    removeItem: (itemId: string) =>
      request<{ cart: Cart }>(`/cart/items/${itemId}`, { method: "DELETE" }),
    clear: () => request<{ cart: Cart }>("/cart", { method: "DELETE" }),
  },

  orders: {
    list: () => request<{ orders: Order[] }>("/orders"),
    get: (id: string) => request<{ order: Order }>(`/orders/${id}`),
    confirmPayment: (id: string, sessionId?: string) =>
      request<{ order: Order }>(`/orders/${id}/confirm-payment`, {
        method: "POST",
        body: JSON.stringify({ sessionId }),
      }),
    checkout: (addressId: string) =>
      request<{ order: Order; checkoutUrl: string }>("/orders/checkout", {
        method: "POST",
        body: JSON.stringify({ addressId }),
      }),
  },

  addresses: {
    list: () => request<{ addresses: Address[] }>("/addresses"),
    create: (body: Omit<Address, "id" | "isDefault"> & { isDefault?: boolean }) =>
      request<{ address: Address }>("/addresses", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Address>) =>
      request<{ address: Address }>(`/addresses/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) => request<void>(`/addresses/${id}`, { method: "DELETE" }),
  },

  admin: {
    stats: () => request<{ stats: AdminStats }>("/admin/stats"),
    products: {
      list: (params?: Record<string, string | number>) => {
        const qs = new URLSearchParams();
        if (params) Object.entries(params).forEach(([k, v]) => qs.set(k, String(v)));
        return request<{ products: Product[]; pagination: Pagination }>(
          `/admin/products?${qs.toString()}`
        );
      },
      create: (body: Record<string, unknown>) =>
        request<{ product: Product }>("/admin/products", { method: "POST", body: JSON.stringify(body) }),
      update: (id: string, body: Record<string, unknown>) =>
        request<{ product: Product }>(`/admin/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
      delete: (id: string) => request<void>(`/admin/products/${id}`, { method: "DELETE" }),
    },
    orders: {
      list: (params?: Record<string, string | number>) => {
        const qs = new URLSearchParams();
        if (params) Object.entries(params).forEach(([k, v]) => qs.set(k, String(v)));
        return request<{ orders: Order[]; pagination: Pagination }>(
          `/admin/orders?${qs.toString()}`
        );
      },
      updateStatus: (id: string, status: string) =>
        request<{ order: Order }>(`/admin/orders/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }),
    },
    users: {
      list: (page = 1) =>
        request<{ users: (User & { orderCount: number })[]; pagination: Pagination }>(
          `/admin/users?page=${page}`
        ),
      updateRole: (id: string, role: string) =>
        request<{ user: User }>(`/admin/users/${id}/role`, {
          method: "PATCH",
          body: JSON.stringify({ role }),
        }),
    },
    categories: () => request<{ categories: Category[] }>("/admin/categories"),
  },
};

export { ApiError };
