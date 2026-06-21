"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Order } from "@/lib/types";
import { formatPrice, formatDate, orderStatusLabel } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";

const statuses = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    api.admin.orders.list(filter ? { status: filter } : {})
      .then(({ orders }) => setOrders(orders))
      .finally(() => setLoading(false));
  }, [filter]);

  async function updateStatus(id: string, status: string) {
    await api.admin.orders.updateStatus(id, status);
    setLoading(true);
    api.admin.orders.list(filter ? { status: filter } : {})
      .then(({ orders }) => setOrders(orders))
      .finally(() => setLoading(false));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          options={[{ value: "", label: "All statuses" }, ...statuses.map((s) => ({ value: s, label: orderStatusLabel(s) }))]}
          className="w-44"
        />
      </div>

      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : (
        <div className="rounded-lg border border-border bg-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted bg-surface-muted/50">
                <th className="p-3 font-medium">Order</th>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Total</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Update</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium">{order.orderNumber}</td>
                  <td className="p-3 text-muted">{order.user?.email}</td>
                  <td className="p-3 text-muted">{formatDate(order.createdAt)}</td>
                  <td className="p-3">{formatPrice(order.total)}</td>
                  <td className="p-3"><Badge>{orderStatusLabel(order.status)}</Badge></td>
                  <td className="p-3">
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="rounded border border-border px-2 py-1 text-xs"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>{orderStatusLabel(s)}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
