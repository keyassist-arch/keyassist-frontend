"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const SECTIONS = [
  {
    id: "women",
    label: "Women",
    href: "/shop?q=women",
    tiles: [
      { label: "Dresses",   href: "/shop?q=dresses",       bg: "linear-gradient(160deg,#f7e6d5 0%,#e8c4a5 100%)", text: "#5c3010" },
      { label: "Pants",     href: "/shop?q=womens-pants",   bg: "linear-gradient(160deg,#e8d8c8 0%,#d4bfa8 100%)", text: "#5c3010" },
    ],
  },
  {
    id: "men",
    label: "Men",
    href: "/shop?q=men",
    tiles: [
      { label: "Hoodies",   href: "/shop?q=hoodies",        bg: "linear-gradient(160deg,#1a1a1a 0%,#2d2d2d 100%)",  text: "#f0f0f0" },
      { label: "Pants",     href: "/shop?q=mens-pants",     bg: "linear-gradient(160deg,#c8b898 0%,#b0a080 100%)",  text: "#2a1800" },
    ],
  },
  {
    id: "beauty",
    label: "Beauty",
    href: "/shop?q=beauty",
    tiles: [
      { label: "Serums & moisturizer", href: "/shop?q=serums", bg: "linear-gradient(160deg,#b8d5c8 0%,#8cbfb0 100%)", text: "#0a3528" },
      { label: "Hair styling products",href: "/shop?q=hair",   bg: "linear-gradient(160deg,#2a6b9a 0%,#1a4a72 100%)", text: "#e0f0ff" },
    ],
  },
  {
    id: "home",
    label: "Home",
    href: "/shop?q=home",
    tiles: [
      { label: "Blankets",  href: "/shop?q=blankets",       bg: "linear-gradient(160deg,#e8d5c0 0%,#d4bfa0 100%)", text: "#3a2010" },
      { label: "Decor",     href: "/shop?q=decor",          bg: "linear-gradient(160deg,#f5e8d5 0%,#e8d0b5 100%)", text: "#5c3010" },
    ],
  },
];

export function HomeCategoryGrid() {
  return (
    <motion.section
      className="w-full border-t border-gray-100 bg-white py-6"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="mx-auto max-w-(--shop-layout-max) px-4 sm:px-8">
        <motion.div
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } },
          }}
        >
          {SECTIONS.map((sec) => (
            <motion.div
              key={sec.id}
              className="flex flex-col gap-2"
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] } },
              }}
            >
              {/* Section header */}
              <Link
                href={sec.href}
                className="inline-flex items-center gap-0.5 text-[15px] font-semibold text-gray-900 transition hover:text-gray-500"
              >
                {sec.label}
                <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
              {/* 2-column tile grid */}
              <div className="grid grid-cols-2 gap-1">
                {sec.tiles.map((tile) => (
                  <motion.div
                    key={tile.label}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <Link
                    key={tile.label}
                    href={tile.href}
                    className="relative block overflow-hidden rounded-2xl transition hover:opacity-90"
                    style={{ background: tile.bg, aspectRatio: "3/4" }}
                  >
                    <span
                      className="absolute bottom-3 left-3 text-[12px] font-semibold leading-tight"
                      style={{ color: tile.text }}
                    >
                      {tile.label}
                    </span>
                  </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
