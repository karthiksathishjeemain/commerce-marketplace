"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { AdminStats } from "@/lib/types";
import { formatPrice, formatDate, orderStatusLabel } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api.admin.stats().then(({ stats }) => setStats(stats)).catch(() => {});
  }, []);

  if (!stats) {
    return <div className="text-muted">Loading dashboard...</div>;
  }

  const cards = [
    { label: "Total Revenue", value: formatPrice(stats.totalRevenue) },
    { label: "Orders", value: stats.totalOrders.toString() },
    { label: "Products", value: stats.totalProducts.toString() },
    { label: "Users", value: stats.totalUsers.toString() },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-border bg-surface p-5">
            <p className="text-sm text-muted">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-brand hover:underline">View all</Link>
        </div>
        {stats.recentOrders.length === 0 ? (
          <p className="text-sm text-muted">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="pb-2 font-medium">Order</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <Link href={`/admin/orders?id=${order.id}`} className="text-brand hover:underline font-medium">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 text-muted">{order.user?.firstName} {order.user?.lastName}</td>
                    <td className="py-3 text-muted">{formatDate(order.createdAt)}</td>
                    <td className="py-3"><Badge>{orderStatusLabel(order.status)}</Badge></td>
                    <td className="py-3 text-right font-medium">{formatPrice(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
