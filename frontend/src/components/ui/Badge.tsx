import clsx from "clsx";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "brand";
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-surface-muted text-muted": variant === "default",
          "bg-green-100 text-green-800": variant === "success",
          "bg-amber-100 text-amber-800": variant === "warning",
          "bg-red-100 text-red-800": variant === "danger",
          "bg-brand/10 text-brand": variant === "brand",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
