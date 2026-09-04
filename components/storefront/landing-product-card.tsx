"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { type MouseEvent } from "react";
import { Heart, Plus, Star } from "lucide-react";
import toast from "react-hot-toast";
import { useLocalSaves } from "@/context/saves-context";
import { useCart } from "@/context/cart-context";
import { useAppSelector } from "@/store/hooks";
import {
  useAddCartItemMutation,
  useGetSaveStatusQuery,
  useSaveProductMutation,
  useUnsaveProductMutation,
} from "@/store/routes/unified-commerce-api";
import { isUuid } from "@/lib/uuid";
import { loginUrl } from "@/lib/auth-redirect";
import { getErrorMessage } from "@/lib/rtk-error";

export type LandingProduct = {
  id?: string;
  slug?: string | null;
  title: string;
  store: string;
  rating: string;
  ratingCount: string;
  price: string;
  comparePrice?: string;
  imageBg: string;
  imageUrl: string;
  href?: string;
};

export function LandingProductCardSkeleton() {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-[18px] border border-shop-border bg-white animate-pulse">
      <div className="h-[200px] w-full bg-gray-100" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-3 w-16 rounded bg-gray-100" />
        <div className="h-4 w-3/4 rounded bg-gray-100" />
        <div className="flex items-center justify-between pt-1.5">
          <div className="h-5 w-16 rounded bg-gray-100" />
          <div className="h-9 w-9 rounded-full bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

export function LandingProductCard({ product }: { product: LandingProduct }) {
  const { id, title, store, rating, ratingCount, price, comparePrice, imageBg, imageUrl, href = "/shop" } = product;
  const router = useRouter();
  const pathname = usePathname();
  const { toggleLocalSave, isSavedLocal, removeLocalSave } = useLocalSaves();
  const token = useAppSelector((s) => s.auth.accessToken);
  const { openCartDrawer } = useCart();
  const [addCartItem, { isLoading: adding }] = useAddCartItemMutation();
  const [saveProduct] = useSaveProductMutation();
  const [unsaveProduct] = useUnsaveProductMutation();
  const { data: saveStatus } = useGetSaveStatusQuery(id ?? "", { skip: !token || !id || !isUuid(id) });

  const isSaved = id ? (token ? (saveStatus?.saved ?? false) : isSavedLocal(id)) : false;

  const onSave = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!id) return;
    if (!token) {
      toggleLocalSave(id);
      return;
    }
    if (!isUuid(id)) return;
    try {
      if (isSaved) {
        await unsaveProduct(id).unwrap();
        removeLocalSave(id);
      } else {
        await saveProduct(id).unwrap();
      }
    } catch {
      /* ignore — optimistic UI handles it */
    }
  };

  const onAdd = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!id) {
      router.push(href);
      return;
    }
    if (!token) {
      router.push(loginUrl(pathname));
      return;
    }
    if (!isUuid(id)) return;
    try {
      await addCartItem({
        productId: id,
        quantity: 1,
      }).unwrap();
      toast.success("Added to cart");
      openCartDrawer();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="group relative flex w-full flex-col overflow-hidden rounded-[18px] border border-shop-border bg-white transition hover:shadow-lg">
      <Link href={href} className="absolute inset-0 z-0" aria-label={title} />

      <div className="relative h-[200px] w-full overflow-hidden" style={{ background: imageBg }}>
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
          className="object-contain p-3 transition duration-300 group-hover:scale-[1.03]"
          unoptimized
        />

        <span className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1.5 shadow-xs">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--shop-primary)" }} aria-hidden />
          <span className="text-[11px] font-semibold text-shop-ink">{store}</span>
        </span>

        {id && (
          <button
            type="button"
            onClick={onSave}
            aria-label={isSaved ? "Remove from saved" : "Save item"}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-shop-muted shadow-xs transition hover:text-shop-ink"
          >
            <Heart
              className="h-[15px] w-[15px] transition"
              fill={isSaved ? "#059669" : "none"}
              stroke={isSaved ? "#059669" : "currentColor"}
              strokeWidth={1.75}
            />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-2 p-4">
        <div>
          <div className="flex items-center gap-1">
            <Star className="h-[13px] w-[13px] fill-current" style={{ color: "var(--shop-star)" }} aria-hidden />
            <span className="text-xs font-semibold text-shop-ink">{rating}</span>
            <span className="text-xs text-shop-muted">{ratingCount}</span>
          </div>

          <p className="line-clamp-2 mt-1 text-[15px] font-semibold leading-[1.35] text-shop-ink">{title}</p>
        </div>

        <div className="flex items-center justify-between pt-1.5">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-shop-ink">{price}</span>
            {comparePrice && <span className="text-[13px] text-shop-muted line-through">{comparePrice}</span>}
          </div>
          <button
            type="button"
            onClick={onAdd}
            disabled={adding}
            aria-label="Add to cart"
            className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--shop-primary)" }}
          >
            <Plus className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
