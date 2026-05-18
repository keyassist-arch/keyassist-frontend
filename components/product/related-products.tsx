"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useGetRelatedProductsQuery } from "@/store/routes/unified-commerce-api";
import { apiProductToProduct } from "@/lib/map-api-product-to-product";
import { StoreProductCard, StoreProductCardSkeleton } from "@/components/storefront/store-product-card";

interface Props {
  idOrSlug: string;
}

export function RelatedProducts({ idOrSlug }: Props) {
  const { data, isLoading, isError } = useGetRelatedProductsQuery(
    { idOrSlug, limit: 8 },
    { skip: !idOrSlug },
  );

  const products = useMemo(() => (data ?? []).map(apiProductToProduct), [data]);

  if (isError) return null;

  if (isLoading) {
    return (
      <section className="border-t border-gray-100 bg-white py-10">
        <div className="mx-auto max-w-(--shop-layout-max) px-4 sm:px-8">
          <div className="mb-5 h-6 w-44 animate-pulse rounded-full bg-gray-100" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 6 }, (_, i) => (
              <StoreProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products.length) return null;

  return (
    <motion.section
      className="border-t border-gray-100 bg-white py-10"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="mx-auto max-w-(--shop-layout-max) px-4 sm:px-8">
        <h2 className="mb-5 text-xl font-semibold tracking-tight text-shop-ink">
          You might also like
        </h2>

        <motion.div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.05 } },
          }}
        >
          {products.map((p) => (
            <motion.div
              key={p.id}
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] } },
              }}
            >
              <StoreProductCard product={p} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
