"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Product } from "@/lib/types";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { StarRating } from "@/components/ui/StarRating";
import { Button } from "@/components/ui/Button";
import { ProductGrid } from "@/components/products/ProductCard";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    api.products
      .get(slug)
      .then(({ product, related }) => {
        setProduct(product);
        setRelated(related);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleAddToCart() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!product) return;

    setAdding(true);
    setError("");
    try {
      await api.cart.addItem(product.id, quantity);
      window.dispatchEvent(new Event("cart-updated"));
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-muted">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-lg text-muted">Product not found</p>
        <Link href="/products" className="text-brand hover:underline mt-2 inline-block">
          Back to products
        </Link>
      </div>
    );
  }

  const images = [product.imageUrl, ...product.images].filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-brand">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-brand">Products</Link>
        {product.category && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-brand">
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <div className="relative aspect-square rounded-lg overflow-hidden border border-border bg-surface-muted">
            <Image
              src={images[selectedImage]}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative h-16 w-16 rounded-md overflow-hidden border-2 ${selectedImage === i ? "border-brand" : "border-border"}`}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-muted uppercase tracking-wide">{product.brand}</p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">{product.name}</h1>
          <div className="mt-2">
            <StarRating rating={product.rating} count={product.reviewCount} />
          </div>
          <div className="mt-4">
            <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
          </div>

          <p className="mt-2 text-sm">
            {product.stock > 0 ? (
              <span className="text-green-700 font-medium">In stock ({product.stock} available)</span>
            ) : (
              <span className="text-red-600 font-medium">Out of stock</span>
            )}
          </p>

          <p className="mt-6 text-sm text-muted leading-relaxed">{product.description}</p>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center border border-border rounded-md">
              <button
                className="p-2 hover:bg-surface-muted disabled:opacity-50"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-4 py-2 text-sm font-medium min-w-[3rem] text-center">{quantity}</span>
              <button
                className="p-2 hover:bg-surface-muted disabled:opacity-50"
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || adding}
              className="flex-1 gap-2"
              size="lg"
            >
              {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
              {added ? "Added!" : "Add to Cart"}
            </Button>
          </div>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          <div className="mt-6 text-xs text-muted space-y-1">
            <p>SKU: {product.sku}</p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold mb-4">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
