import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center font-medium transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed",
        {
          "bg-brand text-white hover:bg-brand-dark": variant === "primary",
          "bg-surface-elevated text-foreground hover:bg-border": variant === "secondary",
          "border border-border bg-transparent hover:bg-surface-muted": variant === "outline",
          "bg-transparent hover:bg-surface-muted": variant === "ghost",
          "bg-red-600 text-white hover:bg-red-700": variant === "danger",
          "px-3 py-1.5 text-sm": size === "sm",
          "px-4 py-2 text-sm": size === "md",
          "px-6 py-3 text-base": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
