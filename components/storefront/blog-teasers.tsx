import Link from "next/link";

const posts = [
  {
    title: "How unified carts handle multiple sellers",
    date: "Mar 12, 2026",
    href: "/faq",
  },
  {
    title: "Reading delivery estimates across marketplaces",
    date: "Mar 5, 2026",
    href: "/faq",
  },
  {
    title: "Order status: what you see after checkout",
    date: "Feb 28, 2026",
    href: "/faq",
  },
  {
    title: "Security notes for pasted product URLs",
    date: "Feb 20, 2026",
    href: "/contact",
  },
];

export function BlogTeasers() {
  return (
    <section className="w-full border-b bg-shop-surface py-12" style={{ borderColor: "var(--shop-border)" }}>
      <div className="mx-auto max-w-(--shop-layout-max) px-4 sm:px-8">
        <h2 className="text-xl font-semibold">Guides & updates</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {posts.map((post) => (
            <article key={post.title} className="flex flex-col rounded-2xl border bg-white" style={{ borderColor: "var(--shop-border)" }}>
              <div className="aspect-video border-b bg-neutral-100" style={{ borderColor: "var(--shop-border)" }} />
              <div className="flex flex-1 flex-col p-4">
                <time className="text-xs text-black/50">{post.date}</time>
                <h3 className="mt-2 flex-1 text-sm font-semibold leading-snug">{post.title}</h3>
                <Link href={post.href} className="mt-4 text-sm font-medium text-shop-accent hover:underline">
                  Read more
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
