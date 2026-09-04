import Link from "next/link";
import Image from "next/image";

const CATEGORIES = [
  {
    name: "Sneakers",
    imageUrl:
      "https://images.unsplash.com/photo-1595909236612-9fd30b476365?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    name: "Electronics",
    imageUrl:
      "https://images.unsplash.com/photo-1782908423704-ec274571f1e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    name: "Fashion",
    imageUrl:
      "https://images.unsplash.com/photo-1562151270-c7d22ceb586a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    name: "Beauty",
    imageUrl:
      "https://images.unsplash.com/photo-1623884167468-065c75fe0af3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    name: "Watches",
    imageUrl:
      "https://images.unsplash.com/photo-1595923533867-ff8a01335ff9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
];

export function LandingCategories() {
  return (
    <section className="w-full bg-white py-20" style={{ borderTop: "1px solid var(--shop-border)" }}>
      <div className="mx-auto flex max-w-(--shop-layout-max) flex-col gap-7 px-4 sm:px-8 lg:px-24">
        <h2 className="text-[32px] font-extrabold tracking-[-0.6px] text-shop-ink">Shop by category</h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map(({ name, imageUrl }) => (
            <Link
              key={name}
              href="/shop"
              className="relative flex h-[170px] w-full items-end overflow-hidden rounded-[18px] p-4"
            >
              <Image src={imageUrl} alt="" fill sizes="(min-width: 1024px) 20vw, 50vw" className="object-cover" />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, #00000099 0%, #00000000 100%)" }}
                aria-hidden
              />
              <span className="relative z-10 text-base font-bold text-white">{name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
