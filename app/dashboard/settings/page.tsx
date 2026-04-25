"use client";

import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ErrorState, LoadingState } from "@/components/feedback/query-state";
import Image from "next/image";
import {
  useGetMeQuery,
  usePatchMeMutation,
  usePostMe2faDisableMutation,
  usePostMe2faEnableMutation,
  usePostMe2faSetupCancelMutation,
  usePostMe2faSetupMutation,
} from "@/store/routes/unified-commerce-api";
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
  const [setup2fa, { isLoading: setupLoading }] = usePostMe2faSetupMutation();
  const [enable2fa, { isLoading: enableLoading }] = usePostMe2faEnableMutation();
  const [cancel2fa, { isLoading: cancelLoading }] = usePostMe2faSetupCancelMutation();
  const [disable2fa, { isLoading: disableLoading }] = usePostMe2faDisableMutation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [addr, setAddr] = useState<ShippingAddress>(emptyAddress());
  const [totpEnroll, setTotpEnroll] = useState("");
  const [totpDisable, setTotpDisable] = useState("");
  const [pwDisable, setPwDisable] = useState("");
  const [qr, setQr] = useState<{ dataUrl: string; secret: string } | null>(null);

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

  const tf = me.twoFactor;
  const onStart2fa = async () => {
    setQr(null);
    setTotpEnroll("");
    try {
      const res = await setup2fa().unwrap();
      setQr({ dataUrl: res.qrCodeDataUrl, secret: res.secret });
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };
  const onEnable2fa = async () => {
    const code = totpEnroll.replace(/\s+/g, "");
    if (code.length < 6) {
      toast.error("Enter the 6-digit code from your authenticator app.");
      return;
    }
    try {
      await enable2fa({ code }).unwrap();
      setQr(null);
      toast.success("Two-factor authentication is on.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };
  const onCancel2fa = async () => {
    try {
      await cancel2fa().unwrap();
      setQr(null);
      toast.success("2FA setup cancelled.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };
  const onDisable2fa = async () => {
    if (!pwDisable) {
      toast.error("Current password is required.");
      return;
    }
    const code = totpDisable.replace(/\s+/g, "");
    if (code.length < 6) {
      toast.error("Enter your current authenticator code.");
      return;
    }
    try {
      await disable2fa({ password: pwDisable, code }).unwrap();
      setPwDisable("");
      setTotpDisable("");
      toast.success("Two-factor authentication is off. Sign in again on your other devices.");
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

      <section className="card space-y-4 border-shop-border/80">
        <div>
          <h2 className="text-base font-semibold text-shop-ink">Two-factor authentication</h2>
          <p className="mt-1 text-sm text-black/70">Add extra security with an authenticator app. Once enabled, you'll enter a one-time code alongside your password each time you sign in.</p>
        </div>
        {tf?.enabled ? (
          <div className="space-y-3 rounded-lg border border-black/10 bg-black/2 p-4">
            <p className="text-sm font-medium text-shop-ink">Two-factor authentication is on.</p>
            <label className="block text-sm">
              <span className="text-black/70">Current password</span>
              <input
                className="input mt-1"
                type="password"
                value={pwDisable}
                onChange={(e) => setPwDisable(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <label className="block text-sm">
              <span className="text-black/70">Authenticator code</span>
              <input
                className="input mt-1 font-mono"
                value={totpDisable}
                onChange={(e) => setTotpDisable(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </label>
            <button type="button" className="btn-secondary text-sm" disabled={disableLoading} onClick={onDisable2fa}>
              {disableLoading ? "Disabling…" : "Turn off two-factor authentication"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tf?.setupPending && !qr ? (
              <div className="space-y-2">
                <p className="text-sm text-amber-900/90">You started setting up two-factor authentication but didn't finish. Continue to complete the setup, or cancel to start over.</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn-primary text-sm" disabled={setupLoading} onClick={onStart2fa}>
                    {setupLoading ? "Preparing…" : "Continue setup"}
                  </button>
                  <button type="button" className="btn-secondary text-sm" disabled={cancelLoading} onClick={onCancel2fa}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
            {qr ? (
              <>
                <p className="text-sm text-black/80">Scan the QR in your authenticator app, then enter a code to confirm.</p>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="relative h-40 w-40 shrink-0 border border-black/10 bg-white">
                    <Image src={qr.dataUrl} alt="Authenticator QR" fill className="object-contain p-2" unoptimized />
                  </div>
                  <div className="min-w-0 space-y-2 text-sm">
                    <p className="text-black/70">If you can’t scan the QR, enter this key manually in your app:</p>
                    <p className="break-all font-mono text-xs">{qr.secret}</p>
                    <label className="block">
                      <span className="text-black/70">6-digit code</span>
                      <input
                        className="input mt-1 max-w-48 font-mono"
                        value={totpEnroll}
                        onChange={(e) => setTotpEnroll(e.target.value)}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="btn-primary text-sm" disabled={enableLoading} onClick={onEnable2fa}>
                        {enableLoading ? "Verifying…" : "Enable 2FA"}
                      </button>
                      <button type="button" className="btn-secondary text-sm" disabled={cancelLoading} onClick={onCancel2fa}>
                        Cancel setup
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
            {!tf?.enabled && !qr && !tf?.setupPending ? (
              <button type="button" className="btn-secondary" disabled={setupLoading} onClick={onStart2fa}>
                {setupLoading ? "Preparing…" : "Set up two-factor authentication"}
              </button>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
