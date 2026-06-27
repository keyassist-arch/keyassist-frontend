"use client";

import Link from "next/link";
import { BadgeCheck, CreditCard, Mail, MapPin, Phone, Shield, Truck, User } from "lucide-react";
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
  { id: "personal",  label: "Personal info" },
  { id: "shipping",  label: "Shipping"      },
  { id: "payments",  label: "Payments"      },
];

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-gray-50 px-4 py-4">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(92,74,230,0.1)" }}>
        <Icon className="h-4 w-4" style={{ color: "#059669" }} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-gray-900">{value ?? "—"}</p>
      </div>
    </div>
  );
}

function AddressCard({ address, label, isDefault }: { address: ShippingAddress; label: string; isDefault?: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {isDefault && (
          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white" style={{ background: "#059669" }}>
            Default
          </span>
        )}
      </div>
      <address className="mt-3 text-sm not-italic leading-relaxed text-gray-600">
        <span className="font-medium text-gray-900">{address.fullName}</span>
        <br />{address.line1}
        {address.line2 ? <><br />{address.line2}</> : null}
        <br />{address.city}{address.state ? `, ${address.state}` : ""} {address.postalCode}
        <br />{address.country}
        {address.phone ? <><br /><span className="text-gray-400">{address.phone}</span></> : null}
      </address>
      <Link
        href="/dashboard/settings"
        className="mt-4 inline-flex text-xs font-medium text-[#059669] hover:underline"
      >
        Edit address
      </Link>
    </div>
  );
}

function StripeCard({ m }: { m: MockStripeMethod }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(92,74,230,0.1)" }}>
        <CreditCard className="h-5 w-5" style={{ color: "#059669" }} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{m.brand} ···· {m.last4}</p>
        <p className="text-xs text-gray-400">Expires {String(m.expMonth).padStart(2, "0")}/{m.expYear}</p>
        {m.isDefault && (
          <span className="mt-1.5 inline-block text-[11px] font-medium" style={{ color: "#059669" }}>Default</span>
        )}
      </div>
      <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">Stripe</span>
    </div>
  );
}

function PayPalRow({ m }: { m: MockPayPalMethod }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#003087] text-[10px] font-bold leading-tight text-white">
        Pay<br />Pal
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{m.payerEmail}</p>
        <p className="text-xs text-gray-400">{m.status === "linked" ? "Account linked" : "Action required"}</p>
        {m.isDefault && (
          <span className="mt-1.5 inline-block text-[11px] font-medium" style={{ color: "#059669" }}>Default</span>
        )}
      </div>
      <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">PayPal</span>
    </div>
  );
}

export function ProfileTabList({ active, onTabChange }: { active: TabId; onTabChange: (id: TabId) => void }) {
  return (
    <div role="tablist" aria-label="Profile sections" className="flex gap-1 p-1">
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
            className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
              isActive
                ? "text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
            style={isActive ? { background: "#059669" } : undefined}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export function ProfileTabPanels({ me, active }: { me: MeResponse | undefined; active: TabId }) {
  const personal = {
    firstName:     me?.firstName     ?? MOCK_PERSONAL.firstName,
    lastName:      me?.lastName      ?? MOCK_PERSONAL.lastName,
    email:         me?.email         ?? MOCK_PERSONAL.email,
    phone:         me?.phone         ?? MOCK_PERSONAL.phone,
    emailVerified: me?.emailVerified ?? MOCK_PERSONAL.emailVerified,
  };
  const fullName = [personal.firstName, personal.lastName].filter(Boolean).join(" ") ||
    [MOCK_PERSONAL.firstName, MOCK_PERSONAL.lastName].join(" ");
  const initials = (personal.firstName?.[0] ?? "") + (personal.lastName?.[0] ?? "") || "?";

  const defaultShip: ShippingAddress = me?.defaultShippingAddress ?? MOCK_SHIPPING_DEFAULT;

  return (
    <>
      {/* Personal */}
      <section
        id="profile-panel-personal"
        role="tabpanel"
        aria-labelledby="profile-tab-personal"
        hidden={active !== "personal"}
        className="space-y-4"
      >
        {/* Avatar + name hero */}
        <div className="flex items-center gap-4 rounded-2xl bg-gray-50 p-5">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
            style={{ background: "#059669" }}
          >
            {initials.toUpperCase()}
          </span>
          <div>
            <p className="text-lg font-bold text-gray-900">{fullName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {personal.emailVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                  Email unverified
                </span>
              )}
              {me?.role && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">
                  <Shield className="h-3 w-3" aria-hidden />
                  {me.role.replaceAll("_", " ")}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow icon={User}  label="Full name" value={fullName} />
          <InfoRow icon={Mail}  label="Email"     value={personal.email} />
          <InfoRow icon={Phone} label="Phone"     value={personal.phone} />
        </div>

        <Link
          href="/dashboard/settings"
          className="inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: "#059669" }}
        >
          Edit profile
        </Link>
      </section>

      {/* Shipping */}
      <section
        id="profile-panel-shipping"
        role="tabpanel"
        aria-labelledby="profile-tab-shipping"
        hidden={active !== "shipping"}
        className="space-y-4"
      >
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-gray-400" aria-hidden />
          <h2 className="text-sm font-semibold text-gray-900">Saved addresses</h2>
        </div>
        <AddressCard address={defaultShip} label="Home" isDefault />
        <AddressCard address={MOCK_SHIPPING_ALT} label="Work" />
        <p className="text-[11px] text-gray-400">
          Second address is preview data. Multi-address editing coming soon.
        </p>
      </section>

      {/* Payments */}
      <section
        id="profile-panel-payments"
        role="tabpanel"
        aria-labelledby="profile-tab-payments"
        hidden={active !== "payments"}
        className="space-y-4"
      >
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-gray-400" aria-hidden />
          <h2 className="text-sm font-semibold text-gray-900">Payment methods</h2>
        </div>
        <p className="text-xs text-gray-400">
          Checkout uses <strong className="text-gray-600">Stripe</strong> and <strong className="text-gray-600">PayPal</strong>. Methods shown below are illustrative.
        </p>
        <ul className="space-y-3">
          {MOCK_PAYMENT_METHODS.map((m) => (
            <li key={m.id}>
              {m.provider === "stripe" ? <StripeCard m={m} /> : <PayPalRow m={m} />}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3 pt-2">
          <button type="button" disabled title="Coming soon"
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-400">
            + Add card
          </button>
          <button type="button" disabled title="Coming soon"
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-400">
            + Link PayPal
          </button>
        </div>
      </section>
    </>
  );
}
