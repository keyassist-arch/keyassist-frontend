"use client";

import { useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { loginUrl } from "@/lib/auth-redirect";
import Image from "next/image";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";
import { useAppSelector } from "@/store/hooks";
import { useLocalSaves } from "@/context/saves-context";
import type { BatchRolloverInfo } from "@/types/index";
import {
  useAddWannaBuyItemMutation,
  useGetCatalogProductsQuery,
  useGetSavesQuery,
  useUnsaveProductMutation,
} from "@/store/routes/unified-commerce-api";
import { apiProductToProduct } from "@/lib/map-api-product-to-product";
import { LoadingState } from "@/components/feedback/query-state";
import { formatApiMoney } from "@/lib/format-price";
import { getErrorMessage } from "@/lib/rtk-error";
import { isUuid } from "@/lib/uuid";
import { productDetailPath } from "@/lib/product-detail-path";
import { BatchRolloverModal } from "@/components/wanna-buy/batch-rollover-modal";

export default function SavesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAppSelector((s) => s.auth.accessToken);
  const { localSavedIds, toggleLocalSave, removeLocalSave } = useLocalSaves();
  const [addWannaBuyItem, { isLoading: addingWannaBuy }] = useAddWannaBuyItemMutation();
  const [unsaveProduct] = useUnsaveProductMutation();
  const { data: serverSaves, isLoading: savesLoading } = useGetSavesQuery(undefined, { skip: !token });
  const { data: catalog, isLoading: catalogLoading } = useGetCatalogProductsQuery();
  const [apiErr, setApiErr] = useState<string | null>(null);
  const [rollover, setRollover] = useState<BatchRolloverInfo | null>(null);

  const savedIds = useMemo(() => {
    if (token) return new Set((serverSaves ?? []).map((s) => s.productId).filter((x): x is string => typeof x === "string"));
    return localSavedIds;
  }, [token, serverSaves, localSavedIds]);

  const products = useMemo(() => (catalog ?? []).map(apiProductToProduct), [catalog]);
  const savedProducts = useMemo(() => products.filter((p) => savedIds.has(p.id)), [products, savedIds]);

  const loading = catalogLoading || (token ? savesLoading : false);

  const onRemove = async (productId: string) => {
    setApiErr(null);
    if (!token) {
      toggleLocalSave(productId);
      return;
    }
    if (!isUuid(productId)) return;
    try {
      await unsaveProduct(productId).unwrap();
      removeLocalSave(productId);
    } catch (err) {
      setApiErr(getErrorMessage(err));
    }
  };

  const onAddToWannaBuy = async (product: (typeof savedProducts)[number], e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setApiErr(null);
    if (!token) {
      router.push(loginUrl(pathname));
      return;
    }
    const variantSelection = Object.fromEntries(product.variants.map((x) => [x.name, x.value]));
    try {
      const result = await addWannaBuyItem({
        productUrl: `${window.location.origin}${productDetailPath(product)}`,
        productTitle: product.title,
        imageUrl: product.images[0],
        ...(Object.keys(variantSelection).length ? { variantSelection } : {}),
      }).unwrap();
      if (result.batchRollover) {
        setRollover(result.batchRollover);
      } else {
        toast.success("Added to your Wanna Buy list!");
      }
    } catch (err) {
      setApiErr(getErrorMessage(err));
    }
  };

  return (
    <>
    <BatchRolloverModal info={rollover} onClose={() => setRollover(null)} />
    <div className="mx-auto max-w-(--shop-layout-max) px-4 py-8 sm:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: "rgba(92,74,230,0.1)" }}>
            <Heart className="h-5 w-5" style={{ color: "#059669" }} aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Saves</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {savedIds.size} saved {savedIds.size === 1 ? "item" : "items"}
            </p>
          </div>
        </div>
        {!token && (
          <Link
            href={loginUrl("/saves")}
            className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            Sign in to sync
          </Link>
        )}
      </div>

      {loading ? (
        <div className="py-10">
          <LoadingState />
        </div>
      ) : savedProducts.length === 0 ? (
        <section className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-900">No saved items yet</p>
          <p className="mt-1 text-sm text-gray-500">Tap the heart on any product to save it for later.</p>
          <div className="mt-5">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Browse shop
            </Link>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          {apiErr ? <p className="border-b border-gray-100 px-5 py-3 text-sm text-red-600">{apiErr}</p> : null}
          <ul className="divide-y divide-gray-100">
            {savedProducts.map((p) => {
              const href = productDetailPath(p);
              const img = p.images[0] || "/product-placeholder.svg";
              return (
                <li key={p.id} className="px-5 py-4">
                  <div className="flex gap-4">
                    <Link href={href} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-50">
                      <Image src={img} alt={p.title} fill className="object-contain p-1" sizes="64px" unoptimized />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link href={href} className="line-clamp-2 text-sm font-semibold text-gray-900 hover:text-[#059669]">
                        {p.title}
                      </Link>
                      <p className="mt-1 text-sm font-bold tabular-nums text-gray-900">
                        {formatApiMoney(p.price, p.currency)}
                      </p>
                      {p.seller || p.marketplace ? (
                        <p className="mt-1 text-xs text-gray-400">{p.seller?.trim() || p.marketplace}</p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-col gap-2">
                      <button
                        type="button"
                        onClick={(e) => onAddToWannaBuy(p, e)}
                        disabled={addingWannaBuy}
                        className="inline-flex items-center justify-center rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                      >
                        Add to Wanna Buy List
                      </button>
                      <button
                        type="button"
                        onClick={() => void onRemove(p.id)}
                        className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-800 transition hover:bg-gray-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
    </>
  );
}
