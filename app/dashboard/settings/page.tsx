"use client";

import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ErrorState, LoadingState } from "@/components/feedback/query-state";
import { useGetMeQuery, usePatchMeMutation } from "@/store/routes/unified-commerce-api";
import { useAppSelector } from "@/store/hooks";
import type { PatchMeRequest, ShippingAddress } from "@/types/api";
import { getErrorMessage } from "@/lib/rtk-error";

function emptyAddress(): ShippingAddress {
  return {
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    phone: "",
  };
}

export default function DashboardSettingsPage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: me, isLoading, isError, error } = useGetMeQuery(undefined, { skip: !token });
  const [patchMe, { isLoading: saving }] = usePatchMeMutation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [addr, setAddr] = useState<ShippingAddress>(emptyAddress());

  useEffect(() => {
    if (!me) return;
    setFirstName(me.firstName ?? "");
    setLastName(me.lastName ?? "");
    setPhone(me.phone ?? "");
    if (me.defaultShippingAddress) {
      setAddr({
        fullName: me.defaultShippingAddress.fullName ?? "",
        line1: me.defaultShippingAddress.line1 ?? "",
        line2: me.defaultShippingAddress.line2 ?? "",
        city: me.defaultShippingAddress.city ?? "",
        state: me.defaultShippingAddress.state ?? "",
        country: me.defaultShippingAddress.country ?? "",
        postalCode: me.defaultShippingAddress.postalCode ?? "",
        phone: me.defaultShippingAddress.phone ?? "",
      });
    } else {
      setAddr(emptyAddress());
    }
  }, [me]);

  if (isLoading) return <LoadingState label="Loading settings…" />;

  if (isError || !me) return <ErrorState error={error} title="Could not load settings" />;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const body: PatchMeRequest = {
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      phone: phone.trim() || undefined,
    };
    const hasAddr =
      addr.fullName.trim() ||
      addr.line1.trim() ||
      addr.city.trim() ||
      addr.country.trim();
    if (hasAddr) {
      body.defaultShippingAddress = {
        fullName: addr.fullName.trim(),
        line1: addr.line1.trim(),
        line2: addr.line2?.trim() || undefined,
        city: addr.city.trim(),
        state: addr.state?.trim() || undefined,
        country: addr.country.trim(),
        postalCode: addr.postalCode?.trim() || undefined,
        phone: addr.phone?.trim() || undefined,
      };
    }
    try {
      await patchMe(body).unwrap();
      toast.success("Your settings were saved.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-shop-ink">Settings</h1>
        <p className="mt-1 text-sm text-black/70">Update your profile and default shipping address for checkout.</p>
      </div>

      <form className="card space-y-8 border-shop-border/80" onSubmit={onSubmit}>
        <fieldset className="space-y-4">
          <legend className="text-base font-semibold text-shop-ink">Personal</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-black/70">First name</span>
              <input
                className="input mt-1"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
            </label>
            <label className="block text-sm">
              <span className="text-black/70">Last name</span>
              <input
                className="input mt-1"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-black/70">Phone</span>
            <input
              className="input mt-1"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              type="tel"
            />
          </label>
        </fieldset>

        <fieldset className="space-y-4 border-t border-black/10 pt-8">
          <legend className="text-base font-semibold text-shop-ink">Default shipping address</legend>
          <p className="text-sm text-black/70">Used when you skip entering an address at checkout.</p>
          <label className="block text-sm">
            <span className="text-black/70">Full name</span>
            <input
              className="input mt-1"
              value={addr.fullName}
              onChange={(e) => setAddr((a) => ({ ...a, fullName: e.target.value }))}
              autoComplete="name"
            />
          </label>
          <label className="block text-sm">
            <span className="text-black/70">Address line 1</span>
            <input
              className="input mt-1"
              value={addr.line1}
              onChange={(e) => setAddr((a) => ({ ...a, line1: e.target.value }))}
              autoComplete="address-line1"
            />
          </label>
          <label className="block text-sm">
            <span className="text-black/70">Address line 2</span>
            <input
              className="input mt-1"
              value={addr.line2}
              onChange={(e) => setAddr((a) => ({ ...a, line2: e.target.value }))}
              autoComplete="address-line2"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-black/70">City</span>
              <input
                className="input mt-1"
                value={addr.city}
                onChange={(e) => setAddr((a) => ({ ...a, city: e.target.value }))}
                autoComplete="address-level2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-black/70">State / region</span>
              <input
                className="input mt-1"
                value={addr.state}
                onChange={(e) => setAddr((a) => ({ ...a, state: e.target.value }))}
                autoComplete="address-level1"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-black/70">Postal code</span>
              <input
                className="input mt-1"
                value={addr.postalCode}
                onChange={(e) => setAddr((a) => ({ ...a, postalCode: e.target.value }))}
                autoComplete="postal-code"
              />
            </label>
            <label className="block text-sm">
              <span className="text-black/70">Country</span>
              <input
                className="input mt-1"
                value={addr.country}
                onChange={(e) => setAddr((a) => ({ ...a, country: e.target.value }))}
                autoComplete="country"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-black/70">Phone (shipping)</span>
            <input
              className="input mt-1"
              value={addr.phone}
              onChange={(e) => setAddr((a) => ({ ...a, phone: e.target.value }))}
              autoComplete="tel"
              type="tel"
            />
          </label>
        </fieldset>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
