"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { Address } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function AccountPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: "Home", line1: "", line2: "", city: "", state: "", postalCode: "", country: "IN" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    api.addresses.list().then(({ addresses }) => setAddresses(addresses)).catch(() => {});
  }, [user, authLoading, router]);

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { address } = await api.addresses.create({ ...form, isDefault: addresses.length === 0 });
      setAddresses((prev) => [...prev, address]);
      setShowForm(false);
      setForm({ label: "Home", line1: "", line2: "", city: "", state: "", postalCode: "", country: "IN" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this address?")) return;
    await api.addresses.delete(id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  if (authLoading || !user) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-muted">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>

      <section className="rounded-lg border border-border bg-surface p-6 mb-6">
        <h2 className="font-semibold mb-3">Profile</h2>
        <div className="text-sm space-y-1">
          <p><span className="text-muted">Name:</span> {user.firstName} {user.lastName}</p>
          <p><span className="text-muted">Email:</span> {user.email}</p>
          <p><span className="text-muted">Role:</span> {user.role}</p>
        </div>
        <div className="flex gap-3 mt-4">
          <Link href="/orders"><Button variant="outline" size="sm">View Orders</Button></Link>
          <Button variant="ghost" size="sm" onClick={() => { logout(); router.push("/"); }}>Sign out</Button>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-surface p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Saved Addresses</h2>
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ Add Address"}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleAddAddress} className="mb-4 space-y-3 border-b border-border pb-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
              <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
              <Input label="Address Line 1" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} required className="sm:col-span-2" />
              <Input label="Line 2" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
              <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
              <Input label="Postal Code" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" size="sm">Save</Button>
          </form>
        )}

        {addresses.length === 0 ? (
          <p className="text-sm text-muted">No saved addresses</p>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className="flex justify-between items-start rounded-md border border-border p-4">
                <div>
                  <p className="font-medium text-sm">{addr.label}{addr.isDefault && " (Default)"}</p>
                  <p className="text-sm text-muted mt-0.5">
                    {addr.line1}{addr.line2 && `, ${addr.line2}`}<br />
                    {addr.city}, {addr.state} {addr.postalCode}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(addr.id)} className="text-red-600">Delete</Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
