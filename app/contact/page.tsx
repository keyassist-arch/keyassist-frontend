import Link from "next/link";
import { InnerShell } from "@/components/layout/inner-shell";

export default function ContactPage() {
  return (
    <InnerShell>
    <section className="card max-w-2xl">
      <p className="text-xs uppercase tracking-[0.18em] text-black/60 dark:text-white/60">
        Contact
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Get support</h1>
      <p className="mt-3 text-sm text-black/70 dark:text-white/70">
        Reach out to support for help with orders, delivery updates, and account settings.
      </p>

      <div className="mt-6 space-y-3 text-sm">
        <p>
          Email:{" "}
          <a className="underline" href="mailto:help@unifiedcommerce.com">
            help@unifiedcommerce.com
          </a>
        </p>
        <p>
          Prefer reading first?{" "}
          <Link className="underline" href="/faq">
            Visit FAQ
          </Link>
        </p>
      </div>
    </section>
    </InnerShell>
  );
}

