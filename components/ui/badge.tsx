import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "neutral";

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-black/10 bg-white text-black dark:border-white/10 dark:bg-neutral-950 dark:text-white",
  neutral: "border-black/10 bg-black/5 text-black/80 dark:border-white/10 dark:bg-white/5 dark:text-white/80",
  success: "border-shop-accent/25 bg-shop-accent-soft text-shop-ink",
  warning:
    "border-amber-600/20 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-950/30 dark:text-amber-300",
  danger:
    "border-rose-600/20 bg-rose-50 text-rose-800 dark:border-rose-400/20 dark:bg-rose-950/30 dark:text-rose-300",
};

export function Badge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${variantClasses[variant]}`}
    >
      {children}
    </span>
  );
}

