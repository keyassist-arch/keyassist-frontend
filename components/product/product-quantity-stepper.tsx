"use client";

export function ProductQuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => {
    const cap = max != null ? Math.min(max, value + 1) : value + 1;
    onChange(cap);
  };

  return (
    <div
      className="inline-flex items-stretch overflow-hidden rounded-xl border border-black/20 bg-white"
      role="group"
      aria-label="Quantity"
    >
      <button
        type="button"
        className="px-3 py-2.5 text-lg leading-none text-shop-ink transition hover:bg-black/5 disabled:opacity-40"
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="flex min-w-[3rem] items-center justify-center border-x border-black/20 px-2 text-sm font-medium tabular-nums text-shop-ink">
        {value}
      </span>
      <button
        type="button"
        className="px-3 py-2.5 text-lg leading-none text-shop-ink transition hover:bg-black/5 disabled:opacity-40"
        onClick={inc}
        disabled={disabled || (max != null && value >= max)}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
