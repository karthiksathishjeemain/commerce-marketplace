import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { StarRating } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/Badge";

export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock === 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col rounded-lg border border-border bg-surface overflow-hidden hover:shadow-md hover:border-brand/30 transition-all"
    >
      <div className="relative aspect-square bg-surface-muted overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Badge variant="danger">Out of Stock</Badge>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1 gap-1.5">
        <p className="text-xs text-muted uppercase tracking-wide">{product.brand}</p>
        <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug group-hover:text-brand">
          {product.name}
        </h3>
        <StarRating rating={product.rating} count={product.reviewCount} />
        <PriceDisplay price={product.price} compareAtPrice={product.compareAtPrice} size="sm" />
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-muted">
        <p className="text-lg">No products found</p>
        <p className="text-sm mt-1">Try adjusting your filters or search terms</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
