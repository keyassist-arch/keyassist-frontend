import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { InnerShell } from "@/components/layout/inner-shell";
import { ContactForm } from "@/components/contact/contact-form";
import { siteContext } from "@/lib/site-context";

const SUPPORT_EMAIL = "help@unifiedcommerce.com";
const SUPPORT_PHONE = "+1 (555) 010-0199";

export const metadata: Metadata = {
  title: `Contact — ${siteContext.brand}`,
  description: `Reach ${siteContext.brand} for orders, deliveries, and account help.`,
};

function InfoBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Mail;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border border-black/10 bg-shop-accent-soft text-shop-accent">
        <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
      </span>
      <div>
        <h3 className="text-sm font-semibold text-shop-ink">{title}</h3>
        <div className="mt-1 text-sm leading-relaxed text-black/70">{children}</div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <InnerShell>
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/50">Contact</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-shop-ink sm:text-4xl">We&apos;re here to help</h1>
          <p className="mt-3 text-base text-black/70">
            Questions about an order, delivery, or your {siteContext.brand} account? Use the form or reach us directly—we
            typically reply within one business day.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 lg:items-start">
          <aside className="space-y-8 lg:sticky lg:top-28">
            <div className="rounded-2xl border border-shop-border/80 bg-white p-6 sm:p-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-black/45">Get in touch</h2>
              <div className="mt-6 space-y-8">
                <InfoBlock icon={Mail} title="Email">
                  <a className="font-medium text-shop-accent underline-offset-2 hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
                    {SUPPORT_EMAIL}
                  </a>
                  <p className="mt-2 text-xs text-black/55">Best for order references, screenshots, and follow-ups.</p>
                </InfoBlock>

                <InfoBlock icon={Phone} title="Phone">
                  <a className="font-medium text-shop-accent underline-offset-2 hover:underline" href="tel:+15550100199">
                    {SUPPORT_PHONE}
                  </a>
                  <p className="mt-2 text-xs text-black/55">Mon–Fri, 9:00–18:00 (local time for each office below).</p>
                </InfoBlock>
              </div>
            </div>

            <div className="rounded-2xl border border-shop-border/80 bg-white p-6 sm:p-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-black/45">Offices</h2>
              <div className="mt-6 space-y-8">
                <InfoBlock icon={MapPin} title="Headquarters — San Francisco">
                  <address className="not-italic">
                    {siteContext.brand} Inc.
                    <br />
                    548 Market Street, Suite 230
                    <br />
                    San Francisco, CA 94104
                    <br />
                    United States
                  </address>
                </InfoBlock>

                <InfoBlock icon={MapPin} title="Africa operations — Lagos">
                  <address className="not-italic">
                    {siteContext.brand} Nigeria
                    <br />
                    15 Admiralty Way, Lekki Phase 1
                    <br />
                    Lagos 106104
                    <br />
                    Nigeria
                  </address>
                </InfoBlock>

                <InfoBlock icon={Clock} title="Support hours">
                  <p>Monday–Friday: 9:00–18:00</p>
                  <p className="mt-1">Saturday: 10:00–14:00 (email only)</p>
                  <p className="mt-1 text-xs text-black/55">Closed Sundays and public holidays in each region.</p>
                </InfoBlock>
              </div>
            </div>

            <p className="text-sm text-black/60">
              Prefer self-serve answers?{" "}
              <Link href="/faq" className="font-medium text-shop-accent hover:underline">
                Browse the FAQ
              </Link>
              .
            </p>
          </aside>

          <ContactForm />
        </div>
      </div>
    </InnerShell>
  );
}
