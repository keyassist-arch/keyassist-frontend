import { Star } from "lucide-react";

function RatingStar({ filled }: { filled: boolean }) {
  return (
    <Star
      size={16}
      style={{ color: "var(--shop-star)" }}
      fill={filled ? "currentColor" : "none"}
      strokeWidth={filled ? 0 : 1.5}
      aria-hidden
    />
  );
}

/** Star row (0–5). With no rating, stars render as outlines. */
export function ProductRatingStars({ rating = 0 }: { rating?: number }) {
  const r = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <div className="flex gap-[2px]" role="img" aria-label={r > 0 ? `${r} out of 5 stars` : "No rating yet"}>
      {Array.from({ length: 5 }, (_, i) => (
        <RatingStar key={i} filled={i < r} />
      ))}
    </div>
  );
}
