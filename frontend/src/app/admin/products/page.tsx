"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Product, Category } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", price: "", compareAtPrice: "", stock: "", sku: "",
    brand: "", imageUrl: "", categoryId: "", isActive: true,
  });

  function load() {
    Promise.all([api.admin.products.list({ limit: 50 }), api.admin.categories()])
      .then(([prodRes, catRes]) => {
        setProducts(prodRes.products);
        setCategories(catRes.categories);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", description: "", price: "", compareAtPrice: "", stock: "", sku: "", brand: "", imageUrl: "", categoryId: categories[0]?.id ?? "", isActive: true });
    setShowForm(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name, description: product.description, price: String(product.price),
      compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
      stock: String(product.stock), sku: product.sku, brand: product.brand,
      imageUrl: product.imageUrl, categoryId: product.categoryId, isActive: product.isActive,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const body = {
      name: form.name, description: form.description,
      price: parseFloat(form.price), stock: parseInt(form.stock),
      sku: form.sku, brand: form.brand, imageUrl: form.imageUrl,
      categoryId: form.categoryId, isActive: form.isActive,
      ...(form.compareAtPrice && { compareAtPrice: parseFloat(form.compareAtPrice) }),
    };
    try {
      if (editing) {
        await api.admin.products.update(editing.id, body);
      } else {
        await api.admin.products.create(body);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deactivate this product?")) return;
    await api.admin.products.delete(id);
    load();
  }

  if (loading) return <div className="text-muted">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={openCreate}>+ Add Product</Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-surface p-6 mb-6 space-y-4">
          <h2 className="font-semibold">{editing ? "Edit Product" : "New Product"}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required />
            <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
            <Input label="Price (INR)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <Input label="Compare at Price" type="number" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} />
            <Input label="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
            <Input label="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} required className="sm:col-span-2" />
            <Select label="Category" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              options={categories.map((c) => ({ value: c.id, label: c.name }))} />
          </div>
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={4} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit">{editing ? "Update" : "Create"}</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="rounded-lg border border-border bg-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted bg-surface-muted/50">
              <th className="p-3 font-medium">Product</th>
              <th className="p-3 font-medium">SKU</th>
              <th className="p-3 font-medium">Price</th>
              <th className="p-3 font-medium">Stock</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 text-muted">{p.sku}</td>
                <td className="p-3">{formatPrice(p.price)}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3"><Badge variant={p.isActive ? "success" : "danger"}>{p.isActive ? "Active" : "Inactive"}</Badge></td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(p)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-red-600">Deactivate</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
