import { Star } from "lucide-react";
import clsx from "clsx";

export function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={clsx(
              "h-3.5 w-3.5",
              i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-border"
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted">
        {rating.toFixed(1)}
        {count !== undefined && ` (${count.toLocaleString()})`}
      </span>
    </div>
  );
}
