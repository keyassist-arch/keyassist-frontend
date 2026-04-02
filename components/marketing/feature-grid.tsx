import Image from "next/image";

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="shop-dark-card rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="max-w-[24ch]">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-2 text-sm text-white/70">{description}</p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-shop-accent/20">
          <Image src="/globe.svg" alt="" width={18} height={18} />
        </span>
      </div>
    </article>
  );
}

export function FeatureGrid() {
  return (
    <section className="shop-dark-section rounded-3xl p-8 md:p-10">
      <h2 className="mb-6 text-4xl font-semibold tracking-tight">Smarter selling starts here</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <FeatureCard
          title="World's best checkout"
          description="Flexible and conversion-focused checkout adapted for cross-marketplace purchasing."
        />
        <FeatureCard
          title="Built-in automation"
          description="Automate URL parsing, item normalization, and unified cart preparation."
        />
        <FeatureCard
          title="Fast, reliable processing"
          description="Order status visibility and operational controls for manual admin workflows."
        />
      </div>
    </section>
  );
}

