import Link from "next/link";
import { Check } from "lucide-react";

export function Steps({
  current,
  steps,
}: {
  current: number;
  steps: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav aria-label="Checkout steps" className="flex items-center">
      {steps.map((s, idx) => {
        const isActive = idx === current;
        const isDone = idx < current;

        const circle = (
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
            style={
              isActive || isDone
                ? { background: "var(--shop-primary)", color: "#FFFFFF" }
                : { background: "#FFFFFF", color: "var(--shop-muted)", border: "1.5px solid var(--shop-border)" }
            }
          >
            {isDone ? <Check className="h-3.5 w-3.5" aria-hidden /> : idx + 1}
          </span>
        );

        const label = (
          <span
            className="text-sm"
            style={
              isActive
                ? { color: "var(--shop-ink)", fontWeight: 700 }
                : isDone
                  ? { color: "var(--shop-ink)", fontWeight: 500 }
                  : { color: "var(--shop-muted)", fontWeight: 500 }
            }
          >
            {s.label}
          </span>
        );

        return (
          <span key={s.label} className="flex items-center">
            {s.href ? (
              <Link href={s.href} className="flex items-center gap-2.5">
                {circle}
                {label}
              </Link>
            ) : (
              <span className="flex items-center gap-2.5">
                {circle}
                {label}
              </span>
            )}
            {idx < steps.length - 1 && (
              <span
                className="mx-2.5 h-0.5 w-14 shrink-0"
                style={{ background: isDone ? "var(--shop-primary)" : "var(--shop-border)" }}
                aria-hidden
              />
            )}
          </span>
        );
      })}
    </nav>
  );
}
