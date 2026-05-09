/**
 * KeyAssist logomark — globe with a shopping cart (Lucide icons).
 * The globe represents global reach; the cart represents commerce.
 *
 * Usage:
 *   <KeyAssistMark size={36} />          — icon only (rounded square)
 *   <KeyAssistWordmark className="h-7" /> — full horizontal wordmark
 */

import { Globe, ShoppingCart } from "lucide-react";

const PURPLE = "#5C4AE6";
const ICON = "text-white";

export function KeyAssistMark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const pad = Math.round(size * 0.08);
  const inner = size - pad * 2;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden ${className ?? ""}`}
      style={{ width: size, height: size, borderRadius: "25%", background: PURPLE }}
      aria-hidden
    >
      <Globe
        size={Math.round(inner * 0.6)}
        className={ICON}
        style={{ position: "absolute", top: pad, left: "50%", transform: "translateX(-50%)" }}
        strokeWidth={1.8}
      />
      <ShoppingCart
        size={Math.round(inner * 0.5)}
        className={ICON}
        style={{ position: "absolute", bottom: Math.round(size * 0.08), left: "50%", transform: "translateX(-50%)" }}
        strokeWidth={1.8}
      />
    </span>
  );
}

export function KeyAssistWordmark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`} aria-label="Key Assist">
      <KeyAssistMark size={36} />
      <span className="text-sm font-extrabold text-gray-900" style={{ letterSpacing: "-0.3px" }}>
        key assist
      </span>
    </span>
  );
}
