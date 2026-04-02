import Image from "next/image";

function SupportItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-neutral-950">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/10">
          <Image src="/file.svg" alt="" width={18} height={18} />
        </span>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-black/70 dark:text-white/70">{description}</p>
    </div>
  );
}

export function SupportSection() {
  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight">Built to help you scale</h2>
      <p className="mt-2 max-w-2xl text-sm text-black/70 dark:text-white/70">
        A focused shopping experience for multi-marketplace discovery, checkout, and team operations.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SupportItem title="Fast discovery" description="Search and paste marketplace URLs with a clean, conversion-first UI." />
        <SupportItem title="Smooth checkout" description="Unified cart pricing, validation, and post-checkout confirmation flow." />
        <SupportItem title="Seller context" description="Delivery estimate and seller info surfaced on product and checkout pages." />
        <SupportItem title="Team operations" description="Dashboards for order handling, updates, and keeping catalog data aligned with retailers." />
      </div>
    </section>
  );
}

