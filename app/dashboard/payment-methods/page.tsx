"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { CreditCard, Trash2, Star, Plus, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { PaymentMethodsSkeleton } from "@/components/dashboard/payment-methods-skeleton";
import { ErrorState } from "@/components/feedback/query-state";
import { getErrorMessage } from "@/lib/rtk-error";
import { useAppSelector } from "@/store/hooks";
import {
  useGetSavedPaymentMethodsQuery,
  useCreateStripeSetupIntentMutation,
  useConfirmStripeSavedMethodMutation,
  useCreatePaypalVaultSetupMutation,
  useConfirmPaypalVaultSetupMutation,
  useSetDefaultPaymentMethodMutation,
  useDeletePaymentMethodMutation,
} from "@/store/routes/unified-commerce-api";
import type { SavedPaymentMethod } from "@/types/api";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "14px",
      color: "#1c1917",
      fontFamily: "var(--font-geist-sans, system-ui, sans-serif)",
      "::placeholder": { color: "#a8a29e" },
    },
    invalid: { color: "#dc2626" },
  },
};

function cardLabel(m: SavedPaymentMethod) {
  if (m.provider === "paypal") return `PayPal${m.email ? ` · ${m.email}` : ""}`;
  const brand = m.brand ? m.brand.charAt(0).toUpperCase() + m.brand.slice(1) : "Card";
  const exp = m.expMonth && m.expYear ? ` · ${String(m.expMonth).padStart(2, "0")}/${String(m.expYear).slice(-2)}` : "";
  return `${brand} ···· ${m.last4 ?? "????"}${exp}`;
}

function MethodRow({
  method,
  onSetDefault,
  onDelete,
  busy,
}: {
  method: SavedPaymentMethod;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  busy: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50">
          <CreditCard className="h-5 w-5 text-gray-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">{cardLabel(method)}</p>
          {method.isDefault && (
            <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-shop-primary">
              <Star className="h-3 w-3 fill-current" /> Default
            </span>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {!method.isDefault && (
            <button
              type="button"
              onClick={() => onSetDefault(method.id)}
              disabled={busy}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Set default
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={busy}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
            aria-label="Remove method"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <ConfirmModal
        open={confirmDelete}
        title="Remove payment method"
        description={`Remove "${cardLabel(method)}" from your saved methods?`}
        confirmLabel="Remove"
        cancelLabel="Keep"
        danger
        onConfirm={() => { setConfirmDelete(false); onDelete(method.id); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

function StripeCardForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [createSetupIntent] = useCreateStripeSetupIntentMutation();
  const [confirmMethod] = useConfirmStripeSavedMethodMutation();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setErr("");
    setBusy(true);
    try {
      const { clientSecret } = await createSetupIntent().unwrap();
      const cardEl = elements.getElement(CardElement);
      if (!cardEl) throw new Error("Card element not mounted");

      const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: cardEl },
      });

      if (error) throw new Error(error.message ?? "Card setup failed");
      if (!setupIntent?.id) throw new Error("Setup intent ID missing");

      await confirmMethod({ setupIntentId: setupIntent.id }).unwrap();
      onSuccess();
    } catch (ex) {
      setErr(getErrorMessage(ex));
    } finally {
      setBusy(false);
    }
  };

  if (!stripePromise) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Stripe is not configured. Set <code className="font-mono text-xs">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to enable card saving.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-xl border border-gray-200 px-4 py-3">
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>
      {err && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {err}
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!stripe || busy}
          className="btn-primary flex items-center gap-2"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? "Saving…" : "Save card"}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function PaymentMethodsPage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const searchParams = useSearchParams();
  const [addMode, setAddMode] = useState<"stripe" | "paypal" | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [flash, setFlash] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: methods, isLoading, isError, refetch } = useGetSavedPaymentMethodsQuery(undefined, { skip: !token });
  const [createPaypalVault] = useCreatePaypalVaultSetupMutation();
  const [confirmPaypalVault] = useConfirmPaypalVaultSetupMutation();
  const [setDefault] = useSetDefaultPaymentMethodMutation();
  const [deleteMethod] = useDeletePaymentMethodMutation();

  const showFlash = useCallback((type: "success" | "error", msg: string) => {
    setFlash({ type, msg });
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 4000);
  }, []);

  /* Handle PayPal vault return */
  const vaultToken = searchParams.get("vault_token") ?? searchParams.get("token");
  const vaultHandled = useRef(false);

  useEffect(() => {
    if (!vaultToken || vaultHandled.current || !token) return;
    vaultHandled.current = true;
    confirmPaypalVault({ vaultSetupToken: vaultToken })
      .unwrap()
      .then(() => showFlash("success", "PayPal account saved successfully."))
      .catch((err) => showFlash("error", getErrorMessage(err)));
  }, [vaultToken, token, confirmPaypalVault, showFlash]);

  const onAddPayPal = async () => {
    setActionBusy(true);
    setFlash(null);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const returnUrl = `${origin}/dashboard/payment-methods`;
      const cancelUrl = `${origin}/dashboard/payment-methods?paypal_cancelled=1`;
      const { approvalUrl } = await createPaypalVault({ returnUrl, cancelUrl }).unwrap();
      window.location.href = approvalUrl;
    } catch (err) {
      showFlash("error", getErrorMessage(err));
      setActionBusy(false);
    }
  };

  const onSetDefault = async (id: string) => {
    setActionBusy(true);
    try {
      await setDefault(id).unwrap();
      showFlash("success", "Default payment method updated.");
    } catch (err) {
      showFlash("error", getErrorMessage(err));
    } finally {
      setActionBusy(false);
    }
  };

  const onDelete = async (id: string) => {
    setActionBusy(true);
    try {
      await deleteMethod(id).unwrap();
      showFlash("success", "Payment method removed.");
    } catch (err) {
      showFlash("error", getErrorMessage(err));
    } finally {
      setActionBusy(false);
    }
  };

  const onStripeSuccess = () => {
    setAddMode(null);
    showFlash("success", "Card saved successfully.");
    void refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Payment Methods</h1>
          <p className="mt-1 text-sm text-gray-500">Save cards and PayPal accounts for faster checkout.</p>
        </div>
      </div>

      {/* Flash message */}
      {flash && (
        <div
          className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
            flash.type === "success"
              ? "border-emerald-100 bg-emerald-50 text-emerald-800"
              : "border-red-100 bg-red-50 text-red-700"
          }`}
        >
          {flash.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          )}
          {flash.msg}
        </div>
      )}

      {/* Saved methods list */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Saved methods</h2>
        </div>

        {isLoading ? (
          <div className="px-6 py-6">
            <PaymentMethodsSkeleton />
          </div>
        ) : isError ? (
          <div className="px-6 py-8">
            <ErrorState error="Could not load payment methods." />
          </div>
        ) : !methods || methods.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <CreditCard className="mx-auto h-8 w-8 text-gray-200" />
            <p className="mt-3 text-sm font-medium text-gray-900">No saved methods yet</p>
            <p className="mt-1 text-sm text-gray-500">Add a card or PayPal account to speed up checkout.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 px-6">
            {methods.map((m) => (
              <li key={m.id}>
                <MethodRow
                  method={m}
                  onSetDefault={onSetDefault}
                  onDelete={onDelete}
                  busy={actionBusy}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add method panel */}
      {addMode === null ? (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setAddMode("stripe")}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add card
          </button>
          <button
            type="button"
            onClick={onAddPayPal}
            disabled={actionBusy}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            {actionBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add PayPal
          </button>
        </div>
      ) : addMode === "stripe" ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Add a card</h2>
          {stripePromise ? (
            <Elements stripe={stripePromise}>
              <StripeCardForm
                onSuccess={onStripeSuccess}
                onCancel={() => setAddMode(null)}
              />
            </Elements>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Stripe is not configured. Set{" "}
              <code className="font-mono text-xs">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to enable card saving.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
