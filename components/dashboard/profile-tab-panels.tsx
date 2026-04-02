"use client";

import Link from "next/link";
import { BadgeCheck, CreditCard, Mail, MapPin, Shield, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  MOCK_PAYMENT_METHODS,
  MOCK_PERSONAL,
  MOCK_SHIPPING_ALT,
  MOCK_SHIPPING_DEFAULT,
  type MockPayPalMethod,
  type MockStripeMethod,
} from "@/lib/mock-profile";
import type { MeResponse, ShippingAddress } from "@/types/api";

type TabId = "personal" | "shipping" | "payments";

const TABS: { id: TabId; label: string }[] = [
  { id: "personal", label: "Personal info" },
  { id: "shipping", label: "Shipping details" },
  { id: "payments", label: "Payments" },
];

function formatAddress(a: ShippingAddress) {
  return (
    <>
      {a.fullName}
      <br />
      {a.line1}
      {a.line2 ? (
        <>
          <br />
          {a.line2}
        </>
      ) : null}
      <br />
      {a.city}
      {a.state ? `, ${a.state}` : ""} {a.postalCode}
      <br />
      {a.country}
      {a.phone ? (
        <>
          <br />
          <span className="text-black/60">{a.phone}</span>
        </>
      ) : null}
    </>
  );
}

function StripeCard({ m }: { m: MockStripeMethod }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-none border border-black/10 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 items-center justify-center bg-shop-primary text-white">
          <CreditCard className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="font-medium text-shop-ink">
            {m.brand} ·••• {m.last4}
          </p>
          <p className="text-sm text-black/60">
            Expires {String(m.expMonth).padStart(2, "0")}/{m.expYear}
          </p>
          {m.isDefault ? (
            <span className="mt-2 inline-block text-xs font-medium text-shop-accent">Default at checkout</span>
          ) : null}
        </div>
      </div>
      <Badge variant="neutral">Stripe</Badge>
    </div>
  );
}

function PayPalRow({ m }: { m: MockPayPalMethod }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-none border border-black/10 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 items-center justify-center bg-[#003087] text-[10px] font-bold leading-tight text-white">
          Pay
          <br />
          Pal
        </span>
        <div>
          <p className="font-medium text-shop-ink">{m.payerEmail}</p>
          <p className="text-sm text-black/60">
            {m.status === "linked" ? "Account linked" : "Action required"}
          </p>
          {m.isDefault ? (
            <span className="mt-2 inline-block text-xs font-medium text-shop-accent">Default at checkout</span>
          ) : null}
        </div>
      </div>
      <Badge variant="neutral">PayPal</Badge>
    </div>
  );
}

type Props = {
  me: MeResponse | undefined;
  active: TabId;
  onTabChange: (id: TabId) => void;
};

export function ProfileTabList({ active, onTabChange }: Pick<Props, "active" | "onTabChange">) {
  return (
    <div
      role="tablist"
      aria-label="Profile sections"
      className="flex flex-wrap gap-1 border-b border-black/10"
    >
      {TABS.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            id={`profile-tab-${t.id}`}
            aria-controls={`profile-panel-${t.id}`}
            className={`relative -mb-px border-b-2 px-4 py-3 text-sm font-medium transition ${
              isActive
                ? "border-shop-primary text-shop-ink"
                : "border-transparent text-black/60 hover:text-shop-ink"
            }`}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export function ProfileTabPanels({ me, active }: Omit<Props, "onTabChange">) {
  const personal = {
    firstName: me?.firstName ?? MOCK_PERSONAL.firstName,
    lastName: me?.lastName ?? MOCK_PERSONAL.lastName,
    email: me?.email ?? MOCK_PERSONAL.email,
    phone: me?.phone ?? MOCK_PERSONAL.phone,
    emailVerified: me?.emailVerified ?? MOCK_PERSONAL.emailVerified,
  };
  const name =
    [personal.firstName, personal.lastName].filter(Boolean).join(" ") ||
    [MOCK_PERSONAL.firstName, MOCK_PERSONAL.lastName].join(" ");

  const defaultShip: ShippingAddress = me?.defaultShippingAddress ?? MOCK_SHIPPING_DEFAULT;

  return (
    <>
      <section
        id="profile-panel-personal"
        role="tabpanel"
        aria-labelledby="profile-tab-personal"
        hidden={active !== "personal"}
        className="pt-1"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-black/45">Full name</p>
            <p className="mt-2 text-xl font-semibold text-shop-ink">{name}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {personal.emailVerified ? (
              <span className="inline-flex items-center gap-1 rounded-none border border-shop-accent/40 bg-shop-accent-soft px-2 py-1 text-xs font-medium text-shop-ink">
                <BadgeCheck className="h-3.5 w-3.5 text-shop-accent" aria-hidden />
                Email verified
              </span>
            ) : (
              <Badge variant="warning">Email not verified</Badge>
            )}
            {me?.role ? (
              <span className="inline-flex items-center gap-1 rounded-none border border-black/10 px-2 py-1 text-xs font-medium text-black/70">
                <Shield className="h-3.5 w-3.5" aria-hidden />
                {me.role.replaceAll("_", " ")}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid gap-6 border-t border-black/10 pt-8 sm:grid-cols-2">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-black/45">
              <Mail className="h-4 w-4" aria-hidden />
              Email
            </p>
            <p className="mt-2 text-sm font-medium text-shop-ink">{personal.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-black/45">Phone</p>
            <p className="mt-2 text-sm font-medium text-shop-ink">{personal.phone ?? "—"}</p>
          </div>
        </div>

        <p className="mt-8 border-t border-black/10 pt-6 text-xs text-black/50">
          Sample data is shown when your account profile is still loading or empty. Saved changes sync from Settings.
        </p>
        <Link href="/dashboard/settings" className="btn-primary mt-4 inline-block">
          Edit in settings
        </Link>
      </section>

      <section
        id="profile-panel-shipping"
        role="tabpanel"
        aria-labelledby="profile-tab-shipping"
        hidden={active !== "shipping"}
        className="pt-1"
      >
        <div className="flex items-center gap-2 text-shop-ink">
          <Truck className="h-5 w-5 text-shop-accent" aria-hidden />
          <h2 className="text-base font-semibold">Default address</h2>
        </div>
        <address className="mt-4 text-sm not-italic leading-relaxed text-black/80">
          {formatAddress(defaultShip)}
        </address>

        <div className="mt-10 border-t border-black/10 pt-8">
          <div className="flex items-center gap-2 text-shop-ink">
            <MapPin className="h-5 w-5 text-shop-accent" aria-hidden />
            <h2 className="text-base font-semibold">Additional address</h2>
          </div>
          <address className="mt-4 text-sm not-italic leading-relaxed text-black/80">
            {formatAddress(MOCK_SHIPPING_ALT)}
          </address>
        </div>

        <p className="mt-8 text-xs text-black/50">
          Second address is mock data for UI preview. Multi-address editing will connect to your account later.
        </p>
        <Link href="/dashboard/settings" className="btn-primary mt-4 inline-block">
          Edit default address
        </Link>
      </section>

      <section
        id="profile-panel-payments"
        role="tabpanel"
        aria-labelledby="profile-tab-payments"
        hidden={active !== "payments"}
        className="pt-1"
      >
        <p className="text-sm text-black/70">
          Checkout uses <strong className="font-medium text-shop-ink">Stripe</strong> and{" "}
          <strong className="font-medium text-shop-ink">PayPal</strong>. Saved methods below are illustrative until
          wallet APIs are wired.
        </p>

        <ul className="mt-6 space-y-4">
          {MOCK_PAYMENT_METHODS.map((m) => (
            <li key={m.id}>
              {m.provider === "stripe" ? <StripeCard m={m} /> : <PayPalRow m={m} />}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-black/10 pt-6">
          <button type="button" className="btn-secondary" disabled title="Coming soon">
            Add card (Stripe)
          </button>
          <button type="button" className="btn-secondary" disabled title="Coming soon">
            Link PayPal
          </button>
        </div>
      </section>
    </>
  );
}
