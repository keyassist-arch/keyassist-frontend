"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type MouseEvent } from "react";
import { Heart, Star, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useLocalSaves } from "@/context/saves-context";
import type { Product, ProductVariant } from "@/types";
import { useAppSelector } from "@/store/hooks";
import {
  useAddCartItemMutation,
  useGetSaveStatusQuery,
  useSaveProductMutation,
  useUnsaveProductMutation,
} from "@/store/routes/unified-commerce-api";
import { productDetailPath } from "@/lib/product-detail-path";
import { isUuid } from "@/lib/uuid";
import { getErrorMessage } from "@/lib/rtk-error";
import { formatApiMoney } from "@/lib/format-price";
import { getStorefrontActivitySignals } from "@/lib/storefront-activity";

export function StoreProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white">
      {/* Image placeholder */}
      <div className="h-[180px] animate-pulse bg-gray-100 sm:h-[200px]" />
      {/* Info placeholder */}
      <div className="flex flex-1 flex-col gap-2 px-3 py-2.5">
        <div className="h-3 w-16 animate-pulse rounded-full bg-gray-100" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-full animate-pulse rounded-full bg-gray-100" />
          <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-gray-100" />
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-3 w-3 animate-pulse rounded-full bg-gray-100" />
          ))}
          <div className="ml-1 h-3 w-8 animate-pulse rounded-full bg-gray-100" />
        </div>
        <div className="h-4 w-20 animate-pulse rounded-full bg-gray-100" />
      </div>
    </div>
  );
}

function StarRow({ filled, count }: { filled: number; count: number }) {
  const n = Math.min(5, Math.max(0, Math.round(filled)));
  const display = count >= 1000 ? `(${(count / 1000).toFixed(1)}k)` : `(${count})`;
  return (
    <div className="flex items-center gap-1">
      <span className="inline-flex items-center gap-px" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={12}
            fill={i < n ? "currentColor" : "none"}
            className={i < n ? "text-amber-400" : "text-gray-200"}
            strokeWidth={i < n ? 0 : 1.5}
          />
        ))}
      </span>
      <span className="text-[11px] text-gray-400">{display}</span>
    </div>
  );
}

export function StoreProductCard({ product }: { product: Product }) {
  const { addItem, openCartDrawer } = useCart();
  const { toggleLocalSave, isSavedLocal } = useLocalSaves();
  const token = useAppSelector((s) => s.auth.accessToken);
  const [addCartItem, { isLoading: addingApi }] = useAddCartItemMutation();
  const [saveProduct] = useSaveProductMutation();
  const [unsaveProduct] = useUnsaveProductMutation();
  const { data: saveStatus } = useGetSaveStatusQuery(product.id, { skip: !token || !isUuid(product.id) });
  const [apiErr, setApiErr] = useState<string | null>(null);

  const img = product.images[0] ?? "/product-placeholder.svg";
  const activity = getStorefrontActivitySignals(product.id);
  const onSale = product.discountPercent != null && product.discountPercent > 0 && product.compareAtPrice != null;

  const brandLine = product.seller?.trim() || product.marketplace;
  const pdpHref = productDetailPath(product);
  const isSaved = token ? (saveStatus?.saved ?? false) : isSavedLocal(product.id);

  const onSave = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) {
      toggleLocalSave(product.id);
      return;
    }
    if (!isUuid(product.id)) return;
    try {
      if (isSaved) {
        await unsaveProduct(product.id).unwrap();
      } else {
        await saveProduct(product.id).unwrap();
      }
    } catch {
      /* ignore — optimistic UI handles it */
    }
  };

  const onAdd = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
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
    const selKey = product.variants.map((v) => `${v.name}:${v.value}`).sort().join("|");
    const cartVariant: ProductVariant = {
      id: selKey || "default",
      name: "Selection",
      value: product.variants.map((v) => `${v.name}: ${v.value}`).join(", "),
    };
    addItem(product, 1, cartVariant);
    openCartDrawer();
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white transition hover:shadow-lg">
      {/* Image area */}
      <Link href={pdpHref} className="relative block h-[180px] overflow-hidden bg-gray-50 sm:h-[200px]">
        <Image
          src={img}
          alt={product.title}
          fill
          className="object-contain p-2 transition duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          unoptimized
        />

        {/* Extra savings badge */}
        {onSale && (
          <span className="absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white" style={{ background: "#5C4AE6" }}>
            Extra savings
          </span>
        )}

        {/* Discount % badge */}
        {onSale && product.discountPercent != null && (
          <span className="absolute left-2 top-7 mt-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
            {product.discountPercent}% off
          </span>
        )}

        {/* Heart / save button */}
        <button
          type="button"
          onClick={onSave}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition hover:bg-white"
          aria-label={isSaved ? "Remove from saved" : "Save item"}
        >
          <Heart
            className="h-4 w-4 transition"
            fill={isSaved ? "#5C4AE6" : "none"}
            stroke={isSaved ? "#5C4AE6" : "#6b7280"}
            strokeWidth={1.75}
          />
        </button>

        {/* Floating cart button */}
        <button
          type="button"
          onClick={onAdd}
          className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition hover:bg-white disabled:opacity-50"
          aria-label="Add to cart"
          disabled={addingApi}
        >
          <ShoppingCart className="h-4 w-4 text-gray-700" aria-hidden />
        </button>
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 px-3 py-2.5">
        <p className="truncate text-[11px] text-gray-400">{brandLine}</p>

        <Link
          href={pdpHref}
          className="line-clamp-2 text-[13px] font-medium leading-snug text-gray-900 hover:text-[#5C4AE6]"
        >
          {product.title}
        </Link>

        <StarRow filled={activity.rating} count={activity.reviewCount} />

        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 pt-0.5">
          <span className="text-[15px] font-bold tabular-nums text-gray-900">
            {formatApiMoney(product.price, product.currency)}
          </span>
          {onSale && (
            <span className="text-[12px] tabular-nums text-gray-400 line-through">
              {formatApiMoney(product.compareAtPrice, product.currency)}
            </span>
          )}
        </div>

        {apiErr ? <p className="text-[11px] text-red-500">{apiErr}</p> : null}
      </div>
    </article>
  );
}
