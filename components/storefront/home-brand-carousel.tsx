"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

type MarketplaceCard = {
  id: string;
  name: string;
  tagline: string;
  heroBg: string;
  heroText: string;
  thumbColors: [string, string, string];
  href: string;
};

const SNEAKERS_AND_SPORT: MarketplaceCard[] = [
  {
    id: "nike",
    name: "Nike",
    tagline: "Sport & Lifestyle",
    heroBg: "linear-gradient(140deg,#111 0%,#222 100%)",
    heroText: "#ffffff",
    thumbColors: ["#b0b0b0", "#111111", "#e0e0e0"],
    href: "/shop?q=nike",
  },
  {
    id: "goat",
    name: "GOAT",
    tagline: "Sneakers & Streetwear",
    heroBg: "linear-gradient(140deg,#1a1a1a 0%,#2d2d2d 100%)",
    heroText: "#ffffff",
    thumbColors: ["#c8b89a", "#1a1a1a", "#f0ece8"],
    href: "/shop?q=goat",
  },
  {
    id: "stockx",
    name: "StockX",
    tagline: "Verified Resale",
    heroBg: "linear-gradient(140deg,#004d63 0%,#006380 100%)",
    heroText: "#ffffff",
    thumbColors: ["#00a8cc", "#004d63", "#e0f5fa"],
    href: "/shop?q=stockx",
  },
  {
    id: "converse",
    name: "Converse",
    tagline: "Icons & Classics",
    heroBg: "linear-gradient(140deg,#cc0000 0%,#880000 100%)",
    heroText: "#ffffff",
    thumbColors: ["#ffffff", "#cc0000", "#1a1a1a"],
    href: "/shop?q=converse",
  },
];

const RETAIL_AND_FASHION: MarketplaceCard[] = [
  {
    id: "amazon",
    name: "Amazon",
    tagline: "Everything, Delivered",
    heroBg: "linear-gradient(140deg,#232f3e 0%,#131921 100%)",
    heroText: "#FF9900",
    thumbColors: ["#FF9900", "#232f3e", "#37475a"],
    href: "/shop?q=amazon",
  },
  {
    id: "apple",
    name: "Apple",
    tagline: "Tech & Accessories",
    heroBg: "linear-gradient(140deg,#f0f0f0 0%,#d8d8d8 100%)",
    heroText: "#1d1d1f",
    thumbColors: ["#e8e8e8", "#a8a8a8", "#1d1d1f"],
    href: "/shop?q=apple",
  },
  {
    id: "zara",
    name: "ZARA",
    tagline: "Fashion & Apparel",
    heroBg: "linear-gradient(140deg,#c8b898 0%,#a89060 100%)",
    heroText: "#2a1800",
    thumbColors: ["#e8d8c0", "#b0906a", "#2a1800"],
    href: "/shop?q=zara",
  },
  {
    id: "ebay",
    name: "eBay",
    tagline: "New & Pre-owned",
    heroBg: "linear-gradient(140deg,#f5f5f5 0%,#e8e8e8 100%)",
    heroText: "#333333",
    thumbColors: ["#E53238", "#0064D2", "#F5AF02"],
    href: "/shop?q=ebay",
  },
];

function MarketplaceTile({ card }: { card: MarketplaceCard }) {
  return (
    <motion.a
      href={card.href}
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      whileHover={{ y: -2 }}
    >
      <div
        className="relative flex h-[210px] flex-col justify-between p-4"
        style={{ background: card.heroBg, color: card.heroText }}
      >
        <p className="text-[11px] font-medium opacity-70">{card.tagline}</p>
        <p className="text-2xl font-black leading-tight tracking-tight">{card.name}</p>
      </div>
      <div className="flex gap-1 p-2">
        {card.thumbColors.map((bg, i) => (
          <div key={i} className="h-[72px] flex-1 rounded-xl" style={{ background: bg }} />
        ))}
      </div>
    </motion.a>
  );
}

function MarketplaceRow({ label, href, cards }: { label: string; href: string; cards: MarketplaceCard[] }) {
  return (
    <div className="mb-8">
      <div className="mx-auto max-w-(--shop-layout-max) px-4 sm:px-8">
        <Link
          href={href}
          className="mb-4 inline-flex items-center gap-0.5 text-[15px] font-semibold text-gray-900 transition hover:text-gray-500"
        >
          {label}
          <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cards.map((card) => (
            <MarketplaceTile key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomeBrandCarousel() {
  return (
    <motion.section
      className="w-full border-t border-gray-100 bg-white py-6"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
    >
      <MarketplaceRow label="Sneakers & Sport" href="/shop?q=sneakers" cards={SNEAKERS_AND_SPORT} />
      <MarketplaceRow label="Retail & Fashion"  href="/shop?q=fashion"  cards={RETAIL_AND_FASHION} />
    </motion.section>
  );
}
