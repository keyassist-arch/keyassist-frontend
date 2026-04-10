"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useCart } from "@/context/cart-context";
import { Steps } from "@/components/ui/steps";
import { InnerShell } from "@/components/layout/inner-shell";
import { useAppSelector } from "@/store/hooks";
import {
  useCreateOrderMutation,
  useGetCartQuery,
  useGetMeQuery,
  useInitializePaymentMutation,
} from "@/store/routes/unified-commerce-api";
import type { ApiProduct, CartItemResponse, PaymentProvider } from "@/types/api";
import { ErrorState, LoadingState, SuccessState } from "@/components/feedback/query-state";
import { getErrorMessage } from "@/lib/rtk-error";
import { coerceNumber } from "@/lib/coerce-number";

function linePrice(item: CartItemResponse): number {
  const p = item.product;
  if (p && "title" in p) {
    const prod = p as ApiProduct;
    const unit = coerceNumber(prod.salePrice ?? prod.originalPrice ?? 0, 0);
    return unit * item.quantity;
  }
  return 0;
}

export default function CheckoutPage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { items: localItems, subtotal: localSubtotal } = useCart();
  const { data: me, isLoading: meLoading } = useGetMeQuery(undefined, { skip: !token });
  const { data: cart, isLoading: cartLoading } = useGetCartQuery(undefined, { skip: !token });
  const [createOrder, { isLoading: creating, isError: createErr, error: createError }] = useCreateOrderMutation();
  const [initPayment, { isLoading: paying, isError: payErr, error: payError }] = useInitializePaymentMutation();
  const [formError, setFormError] = useState("");
  const [provider, setProvider] = useState<PaymentProvider>("paystack");
  const [stepDone, setStepDone] = useState<"idle" | "order" | "redirect">("idle");

  const apiItems = useMemo(() => cart?.items ?? [], [cart]);
  const apiSubtotal = useMemo(() => apiItems.reduce((s, i) => s + linePrice(i), 0), [apiItems]);

  if (!token) {
    return (
      <InnerShell>
        <div className="card max-w-lg space-y-4">
          <h1 className="text-xl font-semibold">Sign in to checkout</h1>
          <p className="text-sm text-black/70">
            Sign in to place an order and pay securely.
            {localItems.length > 0
              ? " Items in your browser cart aren’t kept after sign-in — add them again once you’re logged in."
              : null}
          </p>
          <Link href="/auth/login" className="btn-primary inline-block text-center">
            Sign in
          </Link>
        </div>
      </InnerShell>
    );
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    const fd = new FormData(e.currentTarget);
    const fullName = String(fd.get("fullName") ?? "").trim();
    const line1 = String(fd.get("line1") ?? "").trim();
    const city = String(fd.get("city") ?? "").trim();
    const country = String(fd.get("country") ?? "").trim() || "NG";
    if (!fullName || !line1 || !city) {
      setFormError("Full name, address line, and city are required.");
      return;
    }
    if (apiItems.length === 0) {
      setFormError("Your cart is empty. Add something from the shop, then come back to checkout.");
      return;
    }

    try {
      const order = await createOrder({
        shippingAddress: {
          fullName,
          line1,
          city,
          country,
          line2: String(fd.get("line2") ?? "").trim() || undefined,
          state: String(fd.get("state") ?? "").trim() || undefined,
          postalCode: String(fd.get("postalCode") ?? "").trim() || undefined,
          phone: String(fd.get("phone") ?? "").trim() || undefined,
        },
      }).unwrap();

      setStepDone("order");

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const pay = await initPayment({
        orderId: order.id,
        provider,
        ...(provider === "stripe"
          ? {
              stripeSuccessUrl: origin
                ? `${origin}/checkout/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`
                : undefined,
              stripeCancelUrl: origin ? `${origin}/checkout` : undefined,
            }
          : {}),
      }).unwrap();

      setStepDone("redirect");
      if (pay.provider === "paystack") {
        window.location.href = pay.authorizationUrl;
      } else {
        window.location.href = pay.url;
      }
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  };

  const loading = meLoading || cartLoading || creating || paying;

  return (
    <InnerShell>
      <div className="space-y-6">
        <section className="card">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Checkout</h1>
              <p className="mt-2 text-sm text-black/70">Enter shipping, choose payment, and complete your purchase.</p>
            </div>
            <Steps
              current={1}
              steps={[
                { label: "Cart", href: "/cart" },
                { label: "Checkout", href: "/checkout" },
                { label: "Success", href: "/checkout/success" },
              ]}
            />
          </div>
        </section>

        {loading && <LoadingState label="Processing…" />}
        {createErr && <ErrorState error={createError} title="Order failed" />}
        {payErr && <ErrorState error={payError} title="Payment init failed" />}
        {stepDone === "order" && !payErr && <SuccessState message="Order created. Redirecting to payment…" />}

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <form className="card space-y-4" onSubmit={onSubmit}>
            <h2 className="text-lg font-semibold">Shipping</h2>
            <p className="text-xs text-black/60">We’ll pre-fill from your saved address when you have one. You can change anything below.</p>

            <label className="block space-y-1 text-sm">
              <span className="text-black/70">Full name</span>
              <input
                className="input w-full"
                name="fullName"
                placeholder="Jane Doe"
                required
                defaultValue={me?.defaultShippingAddress?.fullName ?? ""}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-black/70">Address line 1</span>
              <input
                className="input w-full"
                name="line1"
                placeholder="Street, building, unit"
                required
                defaultValue={me?.defaultShippingAddress?.line1 ?? ""}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-black/70">Address line 2 (optional)</span>
              <input
                className="input w-full"
                name="line2"
                placeholder="Apt, suite, etc."
                defaultValue={me?.defaultShippingAddress?.line2 ?? ""}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="text-black/70">City</span>
                <input
                  className="input w-full"
                  name="city"
                  placeholder="City"
                  required
                  defaultValue={me?.defaultShippingAddress?.city ?? ""}
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-black/70">State / region</span>
                <input
                  className="input w-full"
                  name="state"
                  placeholder="State or region"
                  defaultValue={me?.defaultShippingAddress?.state ?? ""}
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="text-black/70">Country code</span>
                <input
                  className="input w-full"
                  name="country"
                  placeholder="e.g. NG"
                  defaultValue={me?.defaultShippingAddress?.country ?? "NG"}
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-black/70">Postal code</span>
                <input
                  className="input w-full"
                  name="postalCode"
                  placeholder="Postal or ZIP"
                  defaultValue={me?.defaultShippingAddress?.postalCode ?? ""}
                />
              </label>
            </div>
            <label className="block space-y-1 text-sm">
              <span className="text-black/70">Phone</span>
              <input
                className="input w-full"
                name="phone"
                type="tel"
                placeholder="+234 …"
                defaultValue={me?.defaultShippingAddress?.phone ?? me?.phone ?? ""}
              />
            </label>

            <h2 className="pt-4 text-lg font-semibold">Payment provider</h2>
            <label className="block space-y-1 text-sm">
              <span className="text-black/70">Provider</span>
              <select
                className="input w-full"
                value={provider}
                onChange={(e) => setProvider(e.target.value as PaymentProvider)}
              >
                <option value="paystack">Paystack</option>
                <option value="stripe">Stripe Checkout</option>
              </select>
            </label>

            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

            <button className="btn-primary w-full" type="submit" disabled={loading || apiItems.length === 0}>
              {creating ? "Creating order…" : paying ? "Starting payment…" : "Place order & pay"}
            </button>
          </form>

          <section className="card h-fit">
            <h2 className="text-lg font-semibold">Summary</h2>
            <p className="mt-3 text-sm text-black/70">{apiItems.length} {apiItems.length === 1 ? "item" : "items"} in your cart</p>
            {localItems.length > 0 ? (
              <p className="mt-2 text-xs text-black/50">
                {localItems.length} item{localItems.length === 1 ? "" : "s"} saved only on this device — not included in this order.
              </p>
            ) : null}
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-medium tabular-nums">USD {apiSubtotal.toFixed(2)}</span>
              </div>
              {localItems.length > 0 ? (
                <div className="flex items-center justify-between border-t border-black/10 pt-2 text-xs text-black/50">
                  <span>On-device cart (not in this order)</span>
                  <span className="tabular-nums">USD {localSubtotal.toFixed(2)}</span>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </InnerShell>
  );
}
