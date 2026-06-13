"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { ErrorState, LoadingState } from "@/components/feedback/query-state";
import {
  useDeletePasskeyCredentialMutation,
  useGetMeQuery,
  useGetPasskeyCredentialsQuery,
  usePatchMeMutation,
  usePatchPasskeyCredentialMutation,
  usePasskeyRegisterFinishMutation,
  usePasskeyRegisterStartMutation,
  usePostMe2faDisableMutation,
  usePostMe2faEnableMutation,
  usePostMe2faSetupCancelMutation,
  usePostMe2faSetupMutation,
} from "@/store/routes/unified-commerce-api";
import { useAppSelector } from "@/store/hooks";
import type { RegistrationResponseJSON } from "@simplewebauthn/browser";
import type { PatchMeRequest, ShippingAddress } from "@/types/api";
import { getErrorMessage } from "@/lib/rtk-error";
import { passkeyPref } from "@/lib/passkey-pref";
import { Fingerprint, Pencil, Shield, Trash2 } from "lucide-react";

function emptyAddress(): ShippingAddress {
  return { fullName: "", line1: "", line2: "", city: "", state: "", country: "", postalCode: "", phone: "" };
}

function SectionCard({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 border-b border-gray-100 pb-4">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "input w-full";

export default function DashboardSettingsPage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: me, isLoading, isError, error } = useGetMeQuery(undefined, { skip: !token });
  const [patchMe,    { isLoading: saving }]       = usePatchMeMutation();
  const [setup2fa,   { isLoading: setupLoading }] = usePostMe2faSetupMutation();
  const [enable2fa,  { isLoading: enableLoading }]= usePostMe2faEnableMutation();
  const [cancel2fa,  { isLoading: cancelLoading }]= usePostMe2faSetupCancelMutation();
  const [disable2fa, { isLoading: disableLoading }] = usePostMe2faDisableMutation();
  const [passkeyRegisterStart] = usePasskeyRegisterStartMutation();
  const [passkeyRegisterFinish] = usePasskeyRegisterFinishMutation();
  const [patchPasskey] = usePatchPasskeyCredentialMutation();
  const [deletePasskey] = useDeletePasskeyCredentialMutation();
  const { data: passkeys, refetch: refetchPasskeys } = useGetPasskeyCredentialsQuery(undefined, { skip: !token });

  const [passkeyRegistering, setPasskeyRegistering] = useState(false);
  const [pendingPasskey, setPendingPasskey] = useState<RegistrationResponseJSON | null>(null);
  const [pendingPasskeyName, setPendingPasskeyName] = useState("");
  const [savingPasskey, setSavingPasskey] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [phone,     setPhone]     = useState("");
  const [addr,      setAddr]      = useState<ShippingAddress>(emptyAddress());
  const [totpEnroll,  setTotpEnroll]  = useState("");
  const [totpDisable, setTotpDisable] = useState("");
  const [pwDisable,   setPwDisable]   = useState("");
  const [qr, setQr] = useState<{ dataUrl: string; secret: string } | null>(null);

  useEffect(() => {
    if (!me) return;
    setFirstName(me.firstName ?? "");
    setLastName(me.lastName ?? "");
    setPhone(me.phone ?? "");
    setAddr(me.defaultShippingAddress
      ? { fullName: me.defaultShippingAddress.fullName ?? "", line1: me.defaultShippingAddress.line1 ?? "", line2: me.defaultShippingAddress.line2 ?? "", city: me.defaultShippingAddress.city ?? "", state: me.defaultShippingAddress.state ?? "", country: me.defaultShippingAddress.country ?? "", postalCode: me.defaultShippingAddress.postalCode ?? "", phone: me.defaultShippingAddress.phone ?? "" }
      : emptyAddress());
  }, [me]);

  if (isLoading) return <LoadingState label="Loading settings…" />;
  if (isError || !me) return <ErrorState error={error} title="Could not load settings" />;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const body: PatchMeRequest = {
      firstName: firstName.trim() || undefined,
      lastName:  lastName.trim()  || undefined,
      phone:     phone.trim()     || undefined,
    };
    const hasAddr = addr.fullName.trim() || addr.line1.trim() || addr.city.trim() || addr.country.trim();
    if (hasAddr) {
      body.defaultShippingAddress = {
        fullName:   addr.fullName.trim(),
        line1:      addr.line1.trim(),
        line2:      addr.line2?.trim()      || undefined,
        city:       addr.city.trim(),
        state:      addr.state?.trim()      || undefined,
        country:    addr.country.trim(),
        postalCode: addr.postalCode?.trim() || undefined,
        phone:      addr.phone?.trim()      || undefined,
      };
    }
    try {
      await patchMe(body).unwrap();
      toast.success("Settings saved.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const tf = me.twoFactor;

  const onStart2fa = async () => {
    setQr(null); setTotpEnroll("");
    try {
      const res = await setup2fa().unwrap();
      setQr({ dataUrl: res.qrCodeDataUrl, secret: res.secret });
    } catch (err) { toast.error(getErrorMessage(err)); }
  };
  const onEnable2fa = async () => {
    const code = totpEnroll.replace(/\s+/g, "");
    if (code.length < 6) { toast.error("Enter the 6-digit code from your authenticator app."); return; }
    try {
      await enable2fa({ code }).unwrap();
      setQr(null);
      toast.success("Two-factor authentication is on.");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };
  const onCancel2fa = async () => {
    try { await cancel2fa().unwrap(); setQr(null); toast.success("2FA setup cancelled."); }
    catch (err) { toast.error(getErrorMessage(err)); }
  };
  const onDisable2fa = async () => {
    if (!pwDisable) { toast.error("Current password is required."); return; }
    const code = totpDisable.replace(/\s+/g, "");
    if (code.length < 6) { toast.error("Enter your current authenticator code."); return; }
    try {
      await disable2fa({ password: pwDisable, code }).unwrap();
      setPwDisable(""); setTotpDisable("");
      toast.success("Two-factor authentication is off.");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const onRegisterPasskey = async () => {
    setPasskeyRegistering(true);
    try {
      const { startRegistration } = await import("@simplewebauthn/browser");
      const options = await passkeyRegisterStart().unwrap();
      const regResponse = await startRegistration({ optionsJSON: options });
      setPendingPasskey(regResponse);
      setPendingPasskeyName("");
    } catch (err: unknown) {
      if (!(err instanceof DOMException && err.name === "NotAllowedError")) {
        toast.error(getErrorMessage(err));
      }
    } finally {
      setPasskeyRegistering(false);
    }
  };

  const savePasskey = async (friendlyName?: string) => {
    if (!pendingPasskey) return;
    setSavingPasskey(true);
    try {
      await passkeyRegisterFinish({
        response: pendingPasskey,
        friendlyName: friendlyName?.trim() || undefined,
      }).unwrap();
      passkeyPref.set();
      toast.success("Passkey registered successfully.");
      setPendingPasskey(null);
      void refetchPasskeys();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPasskey(false);
    }
  };

  const onRenamePasskey = async (id: string) => {
    const name = renameValue.trim();
    if (!name) return;
    try {
      await patchPasskey({ id, friendlyName: name }).unwrap();
      toast.success("Passkey renamed.");
      setRenamingId(null);
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const onDeletePasskey = async (id: string) => {
    if (!confirm("Remove this passkey? You won't be able to use it to sign in.")) return;
    try {
      await deletePasskey(id).unwrap();
      // Clear the pref flag if this was the last passkey
      const remaining = (passkeys ?? []).filter((pk) => pk.id !== id);
      if (remaining.length === 0) passkeyPref.clear();
      toast.success("Passkey removed.");
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Update your profile and shipping details.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Personal */}
        <SectionCard title="Personal info" description="Your name and contact number.">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name">
                <input className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
              </Field>
              <Field label="Last name">
                <input className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
              </Field>
            </div>
            <Field label="Phone">
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" type="tel" />
            </Field>
          </div>
        </SectionCard>

        {/* Shipping */}
        <SectionCard title="Default shipping address" description="Used when you skip entering an address at checkout.">
          <div className="space-y-4">
            <Field label="Full name">
              <input className={inputCls} value={addr.fullName} onChange={(e) => setAddr((a) => ({ ...a, fullName: e.target.value }))} autoComplete="name" />
            </Field>
            <Field label="Address line 1">
              <input className={inputCls} value={addr.line1} onChange={(e) => setAddr((a) => ({ ...a, line1: e.target.value }))} autoComplete="address-line1" />
            </Field>
            <Field label="Address line 2">
              <input className={inputCls} value={addr.line2} onChange={(e) => setAddr((a) => ({ ...a, line2: e.target.value }))} autoComplete="address-line2" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City">
                <input className={inputCls} value={addr.city} onChange={(e) => setAddr((a) => ({ ...a, city: e.target.value }))} autoComplete="address-level2" />
              </Field>
              <Field label="State / region">
                <input className={inputCls} value={addr.state} onChange={(e) => setAddr((a) => ({ ...a, state: e.target.value }))} autoComplete="address-level1" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Postal code">
                <input className={inputCls} value={addr.postalCode} onChange={(e) => setAddr((a) => ({ ...a, postalCode: e.target.value }))} autoComplete="postal-code" />
              </Field>
              <Field label="Country">
                <input className={inputCls} value={addr.country} onChange={(e) => setAddr((a) => ({ ...a, country: e.target.value }))} autoComplete="country" />
              </Field>
            </div>
            <Field label="Phone (shipping)">
              <input className={inputCls} value={addr.phone} onChange={(e) => setAddr((a) => ({ ...a, phone: e.target.value }))} autoComplete="tel" type="tel" />
            </Field>
          </div>
        </SectionCard>

        <button
          type="submit"
          disabled={saving}
          className="rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "#5C4AE6" }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      {/* Passkeys */}
      <SectionCard
        title="Passkeys"
        description="Sign in with Face ID, Touch ID, Windows Hello, or a hardware key — no password needed."
      >
        <div className="space-y-3">
          {passkeys && passkeys.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {passkeys.map((pk) => (
                <li key={pk.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#5C4AE6]/08">
                    <Fingerprint className="h-4 w-4 text-[#5C4AE6]" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    {renamingId === pk.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          className="input h-8 max-w-48 py-1 text-xs"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void onRenamePasskey(pk.id);
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => void onRenamePasskey(pk.id)}
                          className="rounded-full bg-[#5C4AE6] px-3 py-1 text-xs font-semibold text-white"
                        >
                          Save
                        </button>
                        <button type="button" onClick={() => setRenamingId(null)} className="text-xs text-gray-400 hover:text-gray-600">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <p className="truncate text-sm font-medium text-gray-800">
                        {pk.friendlyName || "Unnamed passkey"}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400">
                      {pk.deviceType === "multiDevice" ? "Synced (cross-device)" : "Device-bound"}{pk.backedUp ? " · backed up" : ""}
                      {pk.createdAt ? ` · Added ${new Date(pk.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      title="Rename"
                      onClick={() => { setRenamingId(pk.id); setRenameValue(pk.friendlyName ?? ""); }}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      title="Remove"
                      onClick={() => void onDeletePasskey(pk.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No passkeys registered yet.</p>
          )}

          {pendingPasskey && (
            <form
              onSubmit={(e) => { e.preventDefault(); void savePasskey(pendingPasskeyName); }}
              className="rounded-2xl border border-[#5C4AE6]/20 bg-[#5C4AE6]/04 p-4"
            >
              <p className="mb-3 text-sm font-medium text-gray-800">
                Passkey created — give it a name so you can recognise it later.
              </p>
              <div className="flex items-center gap-2">
                <input
                  className="input h-9 flex-1 py-1.5 text-sm"
                  placeholder='e.g. "My iPhone" (optional)'
                  value={pendingPasskeyName}
                  onChange={(e) => setPendingPasskeyName(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={savingPasskey}
                  className="rounded-xl bg-[#5C4AE6] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {savingPasskey ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  disabled={savingPasskey}
                  onClick={() => void savePasskey()}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Skip
                </button>
              </div>
            </form>
          )}

          {!pendingPasskey && (
            <button
              type="button"
              disabled={passkeyRegistering}
              onClick={onRegisterPasskey}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-[#5C4AE6]/40 hover:text-[#5C4AE6] disabled:opacity-50"
            >
              <Fingerprint className={`h-4 w-4 ${passkeyRegistering ? "animate-pulse text-[#5C4AE6]" : ""}`} aria-hidden />
              {passkeyRegistering ? "Waiting for device…" : "Register a passkey"}
            </button>
          )}
        </div>
      </SectionCard>

      {/* 2FA */}
      <SectionCard
        title="Two-factor authentication"
        description="Add extra security with an authenticator app. You'll enter a one-time code alongside your password each time you sign in."
      >
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
          <span className={`flex h-8 w-8 items-center justify-center rounded-full ${tf?.enabled ? "bg-emerald-100" : "bg-gray-200"}`}>
            <Shield className={`h-4 w-4 ${tf?.enabled ? "text-emerald-600" : "text-gray-400"}`} aria-hidden />
          </span>
          <p className="flex-1 text-sm font-medium text-gray-900">
            {tf?.enabled ? "Two-factor authentication is on" : "Two-factor authentication is off"}
          </p>
          {tf?.enabled && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">Active</span>
          )}
        </div>

        {tf?.enabled ? (
          <div className="mt-4 space-y-3">
            <Field label="Current password">
              <input className={inputCls} type="password" value={pwDisable} onChange={(e) => setPwDisable(e.target.value)} autoComplete="current-password" />
            </Field>
            <Field label="Authenticator code">
              <input className={`${inputCls} font-mono`} value={totpDisable} onChange={(e) => setTotpDisable(e.target.value)} inputMode="numeric" autoComplete="one-time-code" />
            </Field>
            <button type="button" disabled={disableLoading} onClick={onDisable2fa}
              className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50">
              {disableLoading ? "Disabling…" : "Turn off two-factor authentication"}
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {tf?.setupPending && !qr && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800 space-y-3">
                <p>You started 2FA setup but didn&apos;t finish.</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={setupLoading} onClick={onStart2fa}
                    className="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                    style={{ background: "#5C4AE6" }}>
                    {setupLoading ? "Preparing…" : "Continue setup"}
                  </button>
                  <button type="button" disabled={cancelLoading} onClick={onCancel2fa}
                    className="rounded-full border border-amber-200 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100 disabled:opacity-50">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {qr && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Scan the QR code in your authenticator app, then enter a code to confirm.</p>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white">
                    <Image src={qr.dataUrl} alt="Authenticator QR" fill className="object-contain p-2" unoptimized />
                  </div>
                  <div className="min-w-0 space-y-3 text-sm">
                    <p className="text-gray-500">Can&apos;t scan? Enter this key manually:</p>
                    <p className="break-all rounded-xl bg-gray-50 p-3 font-mono text-xs text-gray-700">{qr.secret}</p>
                    <Field label="6-digit code">
                      <input className={`${inputCls} max-w-48 font-mono`} value={totpEnroll} onChange={(e) => setTotpEnroll(e.target.value)} inputMode="numeric" autoComplete="one-time-code" />
                    </Field>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={enableLoading} onClick={onEnable2fa}
                        className="rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                        style={{ background: "#5C4AE6" }}>
                        {enableLoading ? "Verifying…" : "Enable 2FA"}
                      </button>
                      <button type="button" disabled={cancelLoading} onClick={onCancel2fa}
                        className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!tf?.enabled && !qr && !tf?.setupPending && (
              <button type="button" disabled={setupLoading} onClick={onStart2fa}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "#5C4AE6" }}>
                {setupLoading ? "Preparing…" : "Set up two-factor authentication"}
              </button>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
