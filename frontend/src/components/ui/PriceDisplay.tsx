import { formatPrice, discountPercent } from "@/lib/format";

export function PriceDisplay({
  price,
  compareAtPrice,
  size = "md",
}: {
  price: number;
  compareAtPrice?: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const discount = discountPercent(price, compareAtPrice ?? null);

  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span
        className={
          size === "lg"
            ? "text-2xl font-bold text-foreground"
            : size === "sm"
              ? "text-sm font-semibold"
              : "text-lg font-bold text-foreground"
        }
      >
        {formatPrice(price)}
      </span>
      {compareAtPrice && compareAtPrice > price && (
        <>
          <span className="text-sm text-muted line-through">{formatPrice(compareAtPrice)}</span>
          {discount && (
            <span className="text-xs font-medium text-green-700">{discount}% off</span>
          )}
        </>
      )}
    </div>
  );
}
