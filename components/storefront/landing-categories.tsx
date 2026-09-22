import Link from "next/link";
import Image from "next/image";

export const FEATURED_CATEGORIES = [
  {
    name: "Sneakers",
    marketplace: "Nike · GOAT · StockX",
    href: "/shop?marketplace=Nike",
    imageUrl:
      "https://images.unsplash.com/photo-1595909236612-9fd30b476365?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    name: "Electronics",
    marketplace: "Apple · Back Market",
    href: "/shop?marketplace=Apple",
    imageUrl:
      "https://images.unsplash.com/photo-1782908423704-ec274571f1e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    name: "Fashion",
    marketplace: "Zara · US Stores",
    href: "/shop?marketplace=Zara",
    imageUrl:
      "https://images.unsplash.com/photo-1562151270-c7d22ceb586a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    name: "Refurbished Tech",
    marketplace: "Back Market · Reebelo",
    href: "/shop?marketplace=Back+Market",
    imageUrl:
      "https://images.unsplash.com/photo-1595923533867-ff8a01335ff9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    name: "All Marketplaces",
    marketplace: "Amazon · Walmart · eBay",
    href: "/shop?marketplace=Amazon",
    imageUrl:
      "https://images.unsplash.com/photo-1623884167468-065c75fe0af3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
];

export function LandingCategories() {
  return (
    <section className="w-full bg-white py-20" style={{ borderTop: "1px solid var(--shop-border)" }}>
      <div className="mx-auto flex max-w-(--shop-layout-max) flex-col gap-7 px-4 sm:px-8 lg:px-24">
        <div className="flex flex-col gap-1">
          <h2 className="text-[32px] font-extrabold tracking-[-0.6px] text-shop-ink">Shop by category</h2>
          <p className="text-sm text-shop-muted">Explore popular categories across our supported US marketplaces.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {FEATURED_CATEGORIES.map(({ name, marketplace, href, imageUrl }) => (
            <Link
              key={name}
              href={href}
              className="group relative flex h-[170px] w-full flex-col justify-end overflow-hidden rounded-[18px] p-4 transition hover:scale-[1.02]"
            >
              <Image src={imageUrl} alt="" fill sizes="(min-width: 1024px) 20vw, 50vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, #000000B3 0%, #00000020 60%, #00000000 100%)" }}
                aria-hidden
              />
              <span className="relative z-10 text-base font-bold text-white">{name}</span>
              <span className="relative z-10 text-xs font-medium text-white/80">{marketplace}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
