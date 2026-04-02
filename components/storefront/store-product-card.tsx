"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type MouseEvent } from "react";
import { ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/context/cart-context";
import type { Product, ProductVariant } from "@/types";
import { useAppSelector } from "@/store/hooks";
import { useAddCartItemMutation } from "@/store/routes/unified-commerce-api";
import { productDetailPath } from "@/lib/product-detail-path";
import { isUuid } from "@/lib/uuid";
import { getErrorMessage } from "@/lib/rtk-error";
import { formatApiMoney } from "@/lib/format-price";
import { getStorefrontActivitySignals } from "@/lib/storefront-activity";

function StarRow({ filled }: { filled: number }) {
  const n = Math.min(5, Math.max(0, Math.round(filled)));
  return (
    <span className="inline-flex items-center gap-px text-amber-400" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={13}
          fill={i < n ? "currentColor" : "none"}
          className={i < n ? "" : "text-black/22"}
          strokeWidth={i < n ? 0 : 1.2}
        />
      ))}
    </span>
  );
}

export function StoreProductCard({ product }: { product: Product }) {
  const { addItem, openCartDrawer } = useCart();
  const token = useAppSelector((s) => s.auth.accessToken);
  const [addCartItem, { isLoading: addingApi }] = useAddCartItemMutation();
  const [apiErr, setApiErr] = useState<string | null>(null);
  const img = product.images[0] ?? "/file.svg";
  const activity = getStorefrontActivitySignals(product.id);
  const onSale = product.discountPercent != null && product.discountPercent > 0 && product.compareAtPrice != null;

  const onAdd = async (e?: MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    setApiErr(null);
    const variantSelection = Object.fromEntries(product.variants.map((x) => [x.name, x.value]));
    if (token && isUuid(product.id)) {
      try {
        await addCartItem({
          productId: product.id,
          quantity: 1,
          ...(Object.keys(variantSelection).length ? { variantSelection } : {}),
        }).unwrap();
        openCartDrawer();
      } catch (err) {
        setApiErr(getErrorMessage(err));
      }
      return;
    }
    const selKey = product.variants
      .map((v) => `${v.name}:${v.value}`)
      .sort()
      .join("|");
    const cartVariant: ProductVariant = {
      id: selKey || "default",
      name: "Selection",
      value: product.variants.map((v) => `${v.name}: ${v.value}`).join(", "),
    };
    addItem(product, 1, cartVariant);
    openCartDrawer();
  };

  const brandLine = product.seller?.trim() || product.marketplace;
  const pdpHref = productDetailPath(product);

  return (
    <article
      className="flex flex-col overflow-hidden rounded-none border bg-white"
      style={{ borderColor: "var(--shop-border)" }}
    >
      <div className="relative">
        <Link href={pdpHref} className="relative block aspect-square overflow-hidden bg-neutral-100">
          <Image
            src={img}
            alt={product.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>
        <button
          type="button"
          onClick={onAdd}
          disabled={addingApi}
          className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-none border border-black/15 bg-white text-shop-ink shadow-sm transition hover:bg-black hover:text-white disabled:opacity-50"
          aria-label="Add to cart"
        >
          <ShoppingCart className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-black/45">{brandLine}</p>
        <Link href={pdpHref} className="line-clamp-2 text-sm font-medium leading-snug text-shop-ink hover:text-shop-accent">
          {product.title}
        </Link>

        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {onSale ? (
            <>
              <span className="text-sm font-semibold tabular-nums text-shop-sale">-{product.discountPercent}%</span>
              <span className="text-base font-bold tabular-nums text-shop-sale">{formatApiMoney(product.price, product.currency)}</span>
              <span className="text-xs tabular-nums text-black/40 line-through">
                {formatApiMoney(product.compareAtPrice, product.currency)}
              </span>
            </>
          ) : (
            <span className="text-base font-bold tabular-nums text-shop-ink">{formatApiMoney(product.price, product.currency)}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-black/50">
          <StarRow filled={activity.rating} />
          <span className="tabular-nums">({activity.reviewCount})</span>
        </div>
        <p className="text-[11px] text-black/45">{activity.cartsLine}</p>

        {apiErr ? <p className="text-xs text-red-600">{apiErr}</p> : null}
        {!token ? <p className="text-[11px] text-black/45">Sign in to sync cart to your account.</p> : null}

        <Link href={pdpHref} className="mt-auto pt-1 text-xs font-medium text-shop-accent hover:underline">
          View details
        </Link>
      </div>
    </article>
  );
}
