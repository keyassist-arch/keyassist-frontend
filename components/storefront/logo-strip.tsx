const MARKETPLACES = ["amazon", "apple", "nike", "adidas", "zara", "ebay", "goat", "stockx"];

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
          {MARKETPLACES.map((name) => (
            <span key={name} className="text-[22px] font-bold" style={{ color: "#A8A29E" }}>
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
