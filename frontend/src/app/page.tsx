import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { ProductGrid } from "@/components/products/ProductCard";
import { CategoryBar } from "@/components/layout/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function fetchFeatured() {
  try {
    const res = await fetch(`${API_URL}/products/featured`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products ?? [];
  } catch {
    return [];
  }
}

async function fetchCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.categories ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [featured, categories] = await Promise.all([fetchFeatured(), fetchCategories()]);

  return (
    <>
      <CategoryBar categories={categories} />

      <section className="relative bg-[#1a1f2e] text-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-brand text-sm font-semibold uppercase tracking-widest mb-3">
              India&apos;s trusted marketplace
            </p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Everything you need, delivered to your door
            </h1>
            <p className="text-gray-300 text-lg mb-8 max-w-lg">
              Shop from 24+ curated products across electronics, fashion, home, books, and fitness — with secure Stripe payments.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-md bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark transition-colors"
            >
              Browse all products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative h-64 md:h-80 rounded-xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80"
              alt="Shopping"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Truck, title: "Free Delivery", desc: "On orders above ₹999" },
            { icon: ShieldCheck, title: "Secure Payments", desc: "Powered by Stripe" },
            { icon: RotateCcw, title: "Easy Returns", desc: "7-day return policy" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
              <div className="rounded-full bg-brand/10 p-2.5">
                <Icon className="h-5 w-5 text-brand" />
              </div>
              <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <h2 className="text-xl font-bold mb-4">Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {categories.map((cat: { slug: string; name: string; imageUrl?: string; productCount?: number }) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="group relative rounded-lg overflow-hidden aspect-[4/3] border border-border"
              >
                {cat.imageUrl && (
                  <Image src={cat.imageUrl} alt={cat.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-3">
                  <span className="text-white font-semibold text-sm">{cat.name}</span>
                  {cat.productCount !== undefined && (
                    <span className="text-white/70 text-xs">{cat.productCount} products</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Top Rated Products</h2>
          <Link href="/products?sort=rating" className="text-sm text-brand hover:underline">
            View all →
          </Link>
        </div>
        <ProductGrid products={featured} />
      </section>
    </>
  );
}
