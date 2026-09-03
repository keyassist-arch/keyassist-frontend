"use client";

import { Minus, Plus } from "lucide-react";

const SIZES = {
  md: { btn: 42, cell: 48, radius: "rounded-xl", icon: "h-4 w-4", text: "text-[15px]" },
  sm: { btn: 36, cell: 40, radius: "rounded-[10px]", icon: "h-[15px] w-[15px]", text: "text-sm" },
} as const;

export function ProductQuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  disabled,
  size = "md",
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => {
    const cap = max != null ? Math.min(max, value + 1) : value + 1;
    onChange(cap);
  };
  const s = SIZES[size];

  return (
    <div
      className={`inline-flex items-center overflow-hidden border border-shop-border ${s.radius} ${size === "sm" ? "bg-(--background)" : "bg-white"}`}
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        className="flex items-center justify-center text-shop-ink transition hover:bg-black/5 disabled:opacity-40"
        style={{ height: s.btn, width: s.btn }}
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className={s.icon} aria-hidden />
      </button>
      <span
        className={`flex items-center justify-center border-x border-shop-border font-semibold tabular-nums text-shop-ink ${s.text}`}
        style={{ height: s.btn, width: s.cell }}
      >
        {value}
      </span>
      <button
        type="button"
        className="flex items-center justify-center text-shop-ink transition hover:bg-black/5 disabled:opacity-40"
        style={{ height: s.btn, width: s.btn }}
        onClick={inc}
        disabled={disabled || (max != null && value >= max)}
        aria-label="Increase quantity"
      >
        <Plus className={s.icon} aria-hidden />
      </button>
    </div>
  );
}
