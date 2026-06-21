"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ProductGrid } from "@/components/products/ProductCard";
import { CategoryBar } from "@/components/layout/Header";
import { api } from "@/lib/api";
import type { Category, Product } from "@/lib/types";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const category = searchParams.get("category") ?? "";
  const search = searchParams.get("search") ?? "";
  const sort = searchParams.get("sort") ?? "";
  const page = Number(searchParams.get("page") ?? 1);

  useEffect(() => {
    api.categories.list().then(({ categories }) => setCategories(categories)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.products
      .list({ category, search, sort, page, limit: 12 })
      .then(({ products, pagination }) => {
        setProducts(products);
        setPagination(pagination);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category, search, sort, page]);

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    const query = params.toString();
    router.push(query ? `/products?${query}` : "/products");
  }

  return (
    <>
      <CategoryBar categories={categories} />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {search ? `Results for "${search}"` : category ? categories.find((c) => c.slug === category)?.name ?? "Products" : "All Products"}
            </h1>
            {!loading && (
              <p className="text-sm text-muted mt-1">{pagination.total} products found</p>
            )}
          </div>
          <Select
            label=""
            value={sort}
            onChange={(e) => updateParams("sort", e.target.value)}
            options={[
              { value: "", label: "Sort: Featured" },
              { value: "newest", label: "Newest" },
              { value: "price_asc", label: "Price: Low to High" },
              { value: "price_desc", label: "Price: High to Low" },
              { value: "rating", label: "Top Rated" },
            ]}
            className="w-48"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface animate-pulse aspect-[3/4]" />
            ))}
          </div>
        ) : (
          <ProductGrid products={products} />
        )}

        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? "primary" : "outline"}
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("page", String(p));
                  router.push(`/products?${params.toString()}`);
                }}
              >
                {p}
              </Button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">Loading products...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
