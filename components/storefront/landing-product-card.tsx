import Link from "next/link";
import Image from "next/image";
import { Heart, Plus, Star } from "lucide-react";

export type LandingProduct = {
  title: string;
  store: string;
  rating: string;
  ratingCount: string;
  price: string;
  comparePrice?: string;
  imageBg: string;
  imageUrl: string;
};

export function LandingProductCard({ product }: { product: LandingProduct }) {
  const { title, store, rating, ratingCount, price, comparePrice, imageBg, imageUrl } = product;

  return (
    <div className="group relative flex w-full flex-col overflow-hidden rounded-[18px] border border-shop-border bg-white">
      <Link href="/shop" className="absolute inset-0 z-0" aria-label={title} />

      <div className="relative h-[200px] w-full" style={{ background: imageBg }}>
        <Image src={imageUrl} alt={title} fill sizes="280px" className="object-cover" />

        <span className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1.5">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--shop-primary)" }} aria-hidden />
          <span className="text-[11px] font-semibold text-shop-ink">{store}</span>
        </span>

        <button
          type="button"
          aria-label="Save"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-shop-muted transition hover:text-shop-ink"
        >
          <Heart className="h-[15px] w-[15px]" aria-hidden />
        </button>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-1">
          <Star className="h-[13px] w-[13px]" style={{ color: "var(--shop-star)" }} aria-hidden />
          <span className="text-xs font-semibold text-shop-ink">{rating}</span>
          <span className="text-xs text-shop-muted">{ratingCount}</span>
        </div>

        <p className="line-clamp-2 text-[15px] font-semibold leading-[1.35] text-shop-ink">{title}</p>

        <div className="flex items-center justify-between pt-1.5">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-shop-ink">{price}</span>
            {comparePrice && <span className="text-[13px] text-shop-muted line-through">{comparePrice}</span>}
          </div>
          <span
            className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: "var(--shop-primary)" }}
            aria-hidden
          >
            <Plus className="h-[18px] w-[18px] text-white" aria-hidden />
          </span>
        </div>
      </div>
    </div>
  );
}
