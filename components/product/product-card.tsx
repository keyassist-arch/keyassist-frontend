"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAppSelector } from "@/store/hooks";
import { useAddWannaBuyItemMutation } from "@/store/routes/unified-commerce-api";
import { loginUrl } from "@/lib/auth-redirect";
import { getErrorMessage } from "@/lib/rtk-error";
import type { Product } from "@/types";
import { productDetailPath } from "@/lib/product-detail-path";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [activeImage, setActiveImage] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const token = useAppSelector((s) => s.auth.accessToken);
  const [addWannaBuyItem, { isLoading: adding }] = useAddWannaBuyItemMutation();

  const onAdd = async () => {
    if (!token) {
      router.push(loginUrl(pathname));
      return;
    }
    const variantSelection = Object.fromEntries(product.variants.map((v) => [v.name, v.value]));
    try {
      await addWannaBuyItem({
        productUrl: `${window.location.origin}${productDetailPath(product)}`,
        productTitle: product.title,
        imageUrl: product.images[0],
        ...(Object.keys(variantSelection).length ? { variantSelection } : {}),
      }).unwrap();
      toast.success("Added to your Wanna Buy list!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <article className="card group transition hover:-translate-y-0.5">
      <div className="relative mb-4 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-900">
        <Image
          src={product.images[activeImage] ?? "/product-placeholder.svg"}
          alt={product.title}
          className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
          width={600}
          height={420}
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-xs dark:bg-black/80">
          {product.marketplace}
        </span>
      </div>
      <div className="mb-3 flex gap-2">
        {product.images.map((image, index) => (
          <button
            key={image}
            type="button"
            className={`h-8 w-8 overflow-hidden rounded-md border ${
              index === activeImage ? "border-black dark:border-white" : "border-black/10 dark:border-white/20"
            }`}
            onClick={() => setActiveImage(index)}
            aria-label={`Switch to image ${index + 1}`}
          >
            <Image
              src={image}
              alt={`${product.title} preview ${index + 1}`}
              className="h-full w-full object-cover"
              width={64}
              height={64}
            />
          </button>
        ))}
      </div>
      <h3 className="text-base font-semibold">{product.title}</h3>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">{product.variants.length} variants available</p>
      <p className="mt-3 text-lg font-semibold">
        {product.currency} {product.price}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="btn-primary"
          disabled={adding}
          onClick={() => { void onAdd(); }}
        >
          {adding ? "Adding…" : "Add to Wanna Buy List"}
        </button>
        <Link href={productDetailPath(product)} className="btn-secondary text-center">
          View Details
        </Link>
      </div>
    </article>
  );
}
