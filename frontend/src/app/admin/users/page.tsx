"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<(User & { orderCount: number })[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api.admin.users.list().then(({ users }) => setUsers(users)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function toggleRole(user: User & { orderCount: number }) {
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    if (!confirm(`Change ${user.email} to ${newRole}?`)) return;
    await api.admin.users.updateRole(user.id, newRole);
    load();
  }

  if (loading) return <div className="text-muted">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Users</h1>
      <div className="rounded-lg border border-border bg-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted bg-surface-muted/50">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Orders</th>
              <th className="p-3 font-medium">Joined</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium">{user.firstName} {user.lastName}</td>
                <td className="p-3 text-muted">{user.email}</td>
                <td className="p-3"><Badge variant={user.role === "ADMIN" ? "brand" : "default"}>{user.role}</Badge></td>
                <td className="p-3">{user.orderCount}</td>
                <td className="p-3 text-muted">{formatDate(user.createdAt)}</td>
                <td className="p-3">
                  <Button variant="outline" size="sm" onClick={() => toggleRole(user)}>
                    Make {user.role === "ADMIN" ? "User" : "Admin"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
