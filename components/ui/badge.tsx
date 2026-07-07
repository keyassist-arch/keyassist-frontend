import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "neutral";

/**
 * Light-mode-only palette on purpose: badges render inside white cards regardless of the
 * viewer's OS color-scheme preference, so `dark:` variants here would apply against a light
 * background and wash out to near-invisible text. Keep every variant self-contained.
 */
const variantClasses: Record<BadgeVariant, string> = {
  default: "border-black/10 bg-white text-black",
  neutral: "border-gray-200 bg-gray-100 text-gray-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info:    "border-blue-200 bg-blue-50 text-blue-800",
  danger:  "border-rose-200 bg-rose-50 text-rose-800",
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

