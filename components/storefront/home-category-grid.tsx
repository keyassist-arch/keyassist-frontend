"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useGetCategoriesQuery } from "@/store/routes/unified-commerce-api";
import type { Category } from "@/types/api";

const PALETTE = [
  "#e8d5c0", "#2d3a4a", "#b8d5c8", "#c8956c",
  "#4a7c59", "#6b5b9f", "#e8547a", "#3a7ca8",
];

function categoryBg(cat: Category, index: number): string {
  if (cat.imageUrl) return "";
  return PALETTE[index % PALETTE.length];
}

function categoryText(cat: Category, index: number): string {
  const light = ["#e8d5c0", "#b8d5c8"];
  const bg = categoryBg(cat, index);
  return light.includes(bg) ? "#2a1800" : "#ffffff";
}

function CategoryCard({ cat, index }: { cat: Category; index: number }) {
  const bg = categoryBg(cat, index);
  const text = categoryText(cat, index);
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] } },
      }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
    >
      <Link
        href={`/shop/${cat.slug}`}
        className="relative flex h-[130px] overflow-hidden rounded-2xl transition hover:opacity-90"
        style={
          cat.imageUrl
            ? { backgroundImage: `url(${cat.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: bg }
        }
      >
        {cat.imageUrl && (
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <span
            className="block text-[13px] font-bold leading-tight"
            style={{ color: cat.imageUrl ? "#fff" : text }}
          >
            {cat.name}
          </span>
          {cat.productCount > 0 && (
            <span
              className="block text-[11px] leading-tight"
              style={{ color: cat.imageUrl ? "rgba(255,255,255,0.75)" : text, opacity: cat.imageUrl ? 1 : 0.7 }}
            >
              {cat.productCount} {cat.productCount === 1 ? "product" : "products"}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function CategorySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-[130px] animate-pulse rounded-2xl bg-gray-100" />
      ))}
    </div>
  );
}

export function HomeCategoryGrid() {
  const { data: categories, isLoading } = useGetCategoriesQuery();

  const visible = (categories ?? []).slice(0, 5);

  return (
    <motion.section
      className="w-full border-t border-gray-100 bg-white py-6"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="mx-auto max-w-(--shop-layout-max) px-4 sm:px-8">
        {isLoading ? (
          <CategorySkeleton />
        ) : visible.length === 0 ? null : (
          <motion.div
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.06 } },
            }}
          >
            {visible.map((cat, i) => (
              <CategoryCard key={cat.id} cat={cat} index={i} />
            ))}
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
