"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Order } from "@/lib/types";
import { formatPrice, formatDate, orderStatusLabel } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

function OrderDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const sessionId = searchParams.get("session_id");
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    async function loadOrder() {
      try {
        let fetchedOrder: Order;

        if (success === "true") {
          const { order } = await api.orders.confirmPayment(
            params.id as string,
            sessionId ?? undefined
          );
          fetchedOrder = order;
        } else {
          const { order } = await api.orders.get(params.id as string);
          fetchedOrder = order;

          if (order.status === "PENDING") {
            try {
              const { order: confirmedOrder } = await api.orders.confirmPayment(order.id);
              fetchedOrder = confirmedOrder;
            } catch {
              // Payment not completed yet — keep pending status
            }
          }
        }

        setOrder(fetchedOrder);
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [params.id, sessionId, success, user, authLoading, router]);

  if (authLoading || loading) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-muted">Loading...</div>;
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-muted">Order not found</p>
        <Link href="/orders" className="text-brand hover:underline mt-2 inline-block">Back to orders</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {(success || order.status === "PAID") && order.status === "PAID" && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="font-medium text-green-800">Payment successful!</p>
            <p className="text-sm text-green-700">Thank you for your order. We&apos;ll send you updates as it ships.</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-muted">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <Badge variant={order.status === "PAID" || order.status === "DELIVERED" ? "success" : "warning"}>
          {orderStatusLabel(order.status)}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex gap-4 rounded-lg border border-border bg-surface p-4">
              <div className="relative h-20 w-20 shrink-0 rounded-md overflow-hidden bg-surface-muted">
                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-sm text-muted">Qty: {item.quantity} × {formatPrice(item.unitPrice)}</p>
              </div>
              <p className="font-semibold text-sm">{formatPrice(item.unitPrice * item.quantity)}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {order.address && (
            <div className="rounded-lg border border-border bg-surface p-4">
              <h3 className="font-semibold text-sm mb-2">Delivery Address</h3>
              <p className="text-sm text-muted">
                {order.address.line1}<br />
                {order.address.line2 && <>{order.address.line2}<br /></>}
                {order.address.city}, {order.address.state} {order.address.postalCode}
              </p>
            </div>
          )}
          <div className="rounded-lg border border-border bg-surface p-4">
            <h3 className="font-semibold text-sm mb-3">Payment Summary</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Shipping</span><span>{order.shippingCost === 0 ? "FREE" : formatPrice(order.shippingCost)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Tax</span><span>{formatPrice(order.tax)}</span></div>
              <div className="flex justify-between font-bold pt-2 border-t border-border"><span>Total</span><span>{formatPrice(order.total)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">Loading...</div>}>
      <OrderDetailContent />
    </Suspense>
  );
}
