const MARKETPLACES = [
  { id: "amazon", label: "Amazon", url: "https://www.amazon.com" },
  { id: "apple", label: "Apple", url: "https://www.apple.com" },
  { id: "nike", label: "Nike", url: "https://www.nike.com" },
  { id: "adidas", label: "Adidas", url: "https://www.adidas.com" },
  { id: "zara", label: "Zara", url: "https://www.zara.com" },
  { id: "ebay", label: "eBay", url: "https://www.ebay.com" },
  { id: "goat", label: "GOAT", url: "https://www.goat.com" },
  { id: "stockx", label: "StockX", url: "https://www.stockx.com" },
];

export function LogoStrip() {
  return (
    <section
      className="w-full py-9"
      style={{ background: "var(--background)", borderTop: "1px solid var(--shop-border)", borderBottom: "1px solid var(--shop-border)" }}
    >
      <div className="mx-auto flex max-w-(--shop-layout-max) flex-col items-center gap-5 px-4 sm:px-8 lg:px-24">
        <p className="text-xs font-semibold tracking-[1.5px] text-shop-muted">
          SHOP FROM 12+ TRUSTED US MARKETPLACES
        </p>
        <div className="flex w-full flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:justify-between">
          {MARKETPLACES.map(({ id, label, url }) => (
            <a
              key={id}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title={`Shop on ${label} (opens in new tab)`}
              className="text-[22px] font-bold text-[#A8A29E] transition hover:text-shop-ink hover:scale-105"
            >
              {id}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
