"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Order } from "@/lib/types";
import { formatPrice, formatDate, orderStatusLabel } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

function statusVariant(status: string): "default" | "success" | "warning" | "danger" | "brand" {
  switch (status) {
    case "DELIVERED": return "success";
    case "PAID":
    case "PROCESSING":
    case "SHIPPED": return "brand";
    case "CANCELLED":
    case "REFUNDED": return "danger";
    default: return "warning";
  }
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    api.orders.list()
      .then(({ orders }) => setOrders(orders))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-muted">Loading orders...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted mb-4">You haven&apos;t placed any orders yet</p>
          <Link href="/products" className="text-brand hover:underline">Start shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-lg border border-border bg-surface p-4 hover:border-brand/30 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <p className="font-semibold text-sm">{order.orderNumber}</p>
                  <p className="text-xs text-muted">{formatDate(order.createdAt)}</p>
                </div>
                <Badge variant={statusVariant(order.status)}>{orderStatusLabel(order.status)}</Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {order.items?.slice(0, 3).map((item) => (
                    <div key={item.id} className="relative h-10 w-10 rounded-md overflow-hidden border-2 border-surface bg-surface-muted">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted">
                  {order.items?.length} item{order.items && order.items.length > 1 ? "s" : ""}
                </p>
                <p className="ml-auto font-semibold">{formatPrice(order.total)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
