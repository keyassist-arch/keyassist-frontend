import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";

type BrandCard = {
  id: string;
  name: string;
  rating: number;
  reviewCount: string;
  heroBg: string;
  heroText: string;
  thumbColors: [string, string, string];
};

const MENSWEAR: BrandCard[] = [
  {
    id: "nike",
    name: "Nike",
    rating: 4.8,
    reviewCount: "1.2k",
    heroBg: "linear-gradient(140deg,#111 0%,#222 100%)",
    heroText: "#ffffff",
    thumbColors: ["#b0b0b0", "#111111", "#e0e0e0"],
  },
  {
    id: "adidas",
    name: "Adidas",
    rating: 4.7,
    reviewCount: "890",
    heroBg: "linear-gradient(140deg,#0d0d0d 0%,#1a1a2e 100%)",
    heroText: "#ffffff",
    thumbColors: ["#3333aa", "#ffffff", "#000000"],
  },
  {
    id: "uniqlo",
    name: "Uniqlo",
    rating: 4.6,
    reviewCount: "2.1k",
    heroBg: "linear-gradient(140deg,#cc0000 0%,#880000 100%)",
    heroText: "#ffffff",
    thumbColors: ["#f0f0f0", "#cc0000", "#1a1a1a"],
  },
  {
    id: "zara-men",
    name: "ZARA",
    rating: 4.5,
    reviewCount: "3.4k",
    heroBg: "linear-gradient(140deg,#c8b898 0%,#a89060 100%)",
    heroText: "#2a1800",
    thumbColors: ["#e8d8c0", "#b0906a", "#2a1800"],
  },
];

const WOMENSWEAR: BrandCard[] = [
  {
    id: "comme-si",
    name: "Comme Si",
    rating: 4.8,
    reviewCount: "508",
    heroBg: "linear-gradient(140deg,#e8d5c0 0%,#c8a888 100%)",
    heroText: "#2a1000",
    thumbColors: ["#f8e8d8", "#e0c0a0", "#c89060"],
  },
  {
    id: "summersvlt",
    name: "SUMMERSVLT",
    rating: 4.4,
    reviewCount: "1.0k",
    heroBg: "linear-gradient(140deg,#5588aa 0%,#3366aa 100%)",
    heroText: "#ffffff",
    thumbColors: ["#88aacc", "#225588", "#ddeeff"],
  },
  {
    id: "good-american",
    name: "GOOD AMERICAN",
    rating: 4.1,
    reviewCount: "890",
    heroBg: "linear-gradient(140deg,#1a2a3a 0%,#2a3a4a 100%)",
    heroText: "#ffffff",
    thumbColors: ["#334466", "#778899", "#aabbcc"],
  },
  {
    id: "gymshark",
    name: "Gymshark US",
    rating: 4.8,
    reviewCount: "25.7k",
    heroBg: "linear-gradient(140deg,#111 0%,#333 100%)",
    heroText: "#ffffff",
    thumbColors: ["#444", "#888", "#cccccc"],
  },
];

function RatingRow({ rating, count }: { rating: number; count: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px]">
      <span className="inline-flex items-center gap-px">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            size={10}
            fill={i < Math.floor(rating) ? "#F59E0B" : "none"}
            strokeWidth={i < Math.floor(rating) ? 0 : 1.5}
            color={i < Math.floor(rating) ? "#F59E0B" : "#D1D5DB"}
          />
        ))}
      </span>
      <span className="font-semibold">{rating}</span>
      <span className="opacity-60">({count})</span>
    </span>
  );
}

function BrandTile({ card }: { card: BrandCard }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
      {/* Hero */}
      <div
        className="relative flex h-[210px] flex-col justify-between p-4"
        style={{ background: card.heroBg, color: card.heroText }}
      >
        <RatingRow rating={card.rating} count={card.reviewCount} />
        <p className="text-2xl font-black leading-tight tracking-tight">
          {card.name}
        </p>
      </div>
      {/* Product thumbnails */}
      <div className="flex gap-1 p-2">
        {card.thumbColors.map((bg, i) => (
          <div
            key={i}
            className="h-[72px] flex-1 rounded-xl"
            style={{ background: bg }}
          />
        ))}
      </div>
    </div>
  );
}

function BrandRow({
  label,
  href,
  cards,
}: {
  label: string;
  href: string;
  cards: BrandCard[];
}) {
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
            <BrandTile key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomeBrandCarousel() {
  return (
    <section className="w-full border-t border-gray-100 bg-white py-6">
      <BrandRow label="Menswear" href="/shop?q=menswear" cards={MENSWEAR} />
      <BrandRow label="Womenswear" href="/shop?q=womenswear" cards={WOMENSWEAR} />
    </section>
  );
}
