import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "Ordered a PS5 and AirPods from Amazon in one cart. Landed in Lagos in 9 days, sealed and genuine.",
    name: "Chidi O.",
    location: "Lekki, Lagos",
    avatar: "#4A7C59",
  },
  {
    quote:
      "Pasted a GOAT link, approved the quote, done. The all-in price was exactly what I paid — no customs drama.",
    name: "Amara N.",
    location: "Ikeja, Lagos",
    avatar: "#C8956C",
  },
  {
    quote:
      "I use Key Assist for all my Zara and Nike hauls now. Tracking updates the whole way is a game changer.",
    name: "Tunde A.",
    location: "Victoria Island",
    avatar: "#3A7CA8",
  },
];

export function Testimonials() {
  return (
    <section className="w-full bg-white py-20" style={{ borderTop: "1px solid var(--shop-border)" }}>
      <div className="mx-auto flex max-w-(--shop-layout-max) flex-col gap-9 px-4 sm:px-8 lg:px-24">
        <div className="flex flex-col items-center gap-3.5 text-center">
          <p className="text-xs font-bold tracking-[1.5px]" style={{ color: "var(--shop-primary)" }}>
            LOVED BY SHOPPERS
          </p>
          <h2 className="text-[32px] font-extrabold tracking-[-0.8px] text-shop-ink sm:text-[40px]">
            Thousands of parcels delivered, and counting
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {TESTIMONIALS.map(({ quote, name, location, avatar }) => (
            <article
              key={name}
              className="flex flex-col gap-[18px] rounded-[20px] border border-shop-border p-[26px]"
              style={{ background: "var(--background)" }}
            >
              <div className="flex gap-[3px]">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="h-4 w-4" style={{ color: "var(--shop-star)" }} aria-hidden />
                ))}
              </div>
              <p className="text-base leading-[1.5] text-shop-ink">&ldquo;{quote}&rdquo;</p>
              <div className="flex items-center gap-3 pt-1.5">
                <span className="h-10 w-10 shrink-0 rounded-full" style={{ background: avatar }} aria-hidden />
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-bold text-shop-ink">{name}</p>
                  <p className="text-xs text-shop-muted">{location}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
