"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Check, CreditCard, MapPin, ShieldCheck, Truck } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { Steps } from "@/components/ui/steps";
import { InnerShell } from "@/components/layout/inner-shell";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  useCreateOrderMutation,
  useGetCartQuery,
  useGetMeQuery,
  useGetOrderQuery,
  useGetPaymentMethodsQuery,
  useGetLandedCostCartQuoteMutation,
  useInitializePaymentMutation,
  usePatchMeMutation,
} from "@/store/routes/unified-commerce-api";
import type {
  LandedCostDestination,
  LandedCostService,
  LandedCostCategory,
  LandedCostQuoteResponse,
  OrderDisplaySummary,
  OrderResponse,
  PaymentInitResponse,
  PaymentMethodEntry,
  PaymentProvider,
} from "@/types/api";
import { ErrorState, LoadingState } from "@/components/feedback/query-state";
import { getErrorMessage } from "@/lib/rtk-error";
import { coerceNumber } from "@/lib/coerce-number";
import { formatApiMoney } from "@/lib/format-price";
import { orderLineTotal } from "@/lib/dashboard-orders";
import { lineImage, lineTitle } from "@/lib/cart-item-helpers";
import {
  clearPendingCheckoutOrderId,
  getPendingCheckoutOrderId,
  setPendingCheckoutOrderId,
} from "@/lib/pending-checkout-order";
import { orderCanInitializePayment } from "@/lib/order-checkout";
import { isUuid } from "@/lib/uuid";
import { loginUrl } from "@/lib/auth-redirect";
import { unifiedCommerceApi } from "@/store/routes/unified-commerce-api";

const PAYPAL_STORAGE = "uc_paypal_checkout";

/* ── shared field styles (rounded-xl, dense form) ── */
const fieldInputCls =
  "flex h-[46px] w-full items-center rounded-xl border border-shop-border bg-white px-4 text-sm text-shop-ink outline-none transition placeholder:text-[#A8A29E] focus:border-shop-accent";
const fieldLabelCls = "text-[13px] font-semibold text-shop-ink";

function Field({
  label, name, placeholder, required, defaultValue, type,
}: {
  label: string; name: string; placeholder?: string; required?: boolean; defaultValue?: string; type?: string;
}) {
  return (
    <label className="flex w-full flex-col gap-[7px]">
      <span className={fieldLabelCls}>{label}</span>
      <input
        className={fieldInputCls}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
      />
    </label>
  );
}

function SelectField<T extends string>({
  label, value, onChange, options,
}: {
  label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[];
}) {
  return (
    <label className="flex w-full flex-col gap-[7px]">
      <span className={fieldLabelCls}>{label}</span>
      <div className="relative">
        <select
          className={`${fieldInputCls} appearance-none pr-10 font-medium`}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-shop-muted" aria-hidden />
      </div>
    </label>
  );
}

function SectionCard({
  icon: Icon, title, children,
}: {
  icon: typeof MapPin; title: string; children: React.ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-[18px] rounded-[20px] border border-shop-border bg-white p-7">
      <div className="flex items-center gap-2.5">
        <Icon className="h-[18px] w-[18px]" style={{ color: "var(--shop-primary)" }} aria-hidden />
        <h2 className="text-[17px] font-bold text-shop-ink">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function CheckoutDisplaySummary({ summary }: { summary: OrderDisplaySummary }) {
  const cur = summary.currency;
  const rows: [string, number, boolean?][] = [
    ["Product", Number(summary.product)],
    ["Import & delivery", Number(summary.importAndDelivery)],
    ["Service fee", Number(summary.serviceFee)],
  ];
  if (Number(summary.discount) > 0) rows.push(["Discount", Number(summary.discount), true]);

  return (
    <>
      <div className="flex flex-col gap-[11px]">
        {rows.map(([label, amount, isDiscount]) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span style={isDiscount ? { color: "var(--shop-primary)" } : { color: "var(--shop-muted)" }}>{label}</span>
            <span
              className="font-semibold tabular-nums"
              style={isDiscount ? { color: "var(--shop-primary)" } : { color: "var(--shop-ink)" }}
            >
              {isDiscount ? "-" : ""}
              {formatApiMoney(amount, cur)}
            </span>
          </div>
        ))}
      </div>
      <div className="h-px w-full bg-shop-border" />
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold text-shop-ink">Total</span>
        <span className="text-2xl font-extrabold tabular-nums text-shop-ink">{formatApiMoney(Number(summary.total), cur)}</span>
      </div>
    </>
  );
}

const DEFAULT_METHODS: PaymentMethodEntry[] = [{ provider: "stripe", available: true, reason: null }];

function isPaymentProvider(p: string | undefined | null): p is PaymentProvider {
  return p === "paystack" || p === "stripe" || p === "paypal" || p === "myaza";
}

export function CheckoutClient() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.accessToken);
  const searchParams = useSearchParams();
  const { items: localItems, subtotal: localSubtotal } = useCart();
  const { data: me, isLoading: meLoading } = useGetMeQuery(undefined, { skip: !token });
  const { data: cart, isLoading: cartLoading, refetch: refetchCart } = useGetCartQuery(undefined, { skip: !token });
  const { data: paymentMethods, isLoading: methodsLoading, isError: methodsError } = useGetPaymentMethodsQuery();
  const [createOrder, { isLoading: creating, isError: createErr, error: createError }] = useCreateOrderMutation();
  const [getLandedCostQuote, { isLoading: quoting }] = useGetLandedCostCartQuoteMutation();
  const [initPayment, { isLoading: paying, isError: payErr, error: payError, reset: resetPayError }] =
    useInitializePaymentMutation();
  const [patchMe] = usePatchMeMutation();

  const phoneVerificationBlocked = Boolean(me?.phoneVerificationRequired && !me?.phoneVerified);

  const hasSavedAddress = Boolean(
    me?.defaultShippingAddress &&
      me.defaultShippingAddress.line1?.trim() &&
      me.defaultShippingAddress.city?.trim()
  );

  const [mounted, setMounted] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [orderSnapshot, setOrderSnapshot] = useState<OrderResponse | null>(null);
  const [formError, setFormError] = useState("");
  const [payInitError, setPayInitError] = useState(false);
  const [provider, setProvider] = useState<PaymentProvider>("stripe");
  const [placeOrderBusy, setPlaceOrderBusy] = useState(false);
  const [myazaSession, setMyazaSession] = useState<Extract<PaymentInitResponse, { provider: "myaza" }> | null>(null);
  const [myazaOrderId, setMyazaOrderId] = useState<string | null>(null);

  const [addressMode, setAddressMode] = useState<"saved" | "new">("saved");
  const [saveToProfile, setSaveToProfile] = useState(true);

  const [destination, setDestination] = useState<LandedCostDestination>("lagos");
  const [shippingService, setShippingService] = useState<LandedCostService>("air");
  const [category, setCategory] = useState<LandedCostCategory>("generic");
  const [insurance, setInsurance] = useState(false);
  const [landedCostQuote, setLandedCostQuote] = useState<LandedCostQuoteResponse | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [pendingFormData, setPendingFormData] = useState<{
    fullName: string; line1: string; line2?: string; city: string;
    state?: string; country: string; postalCode?: string; phone?: string;
  } | null>(null);

  const { data: orderFetched, isLoading: orderLoading, refetch: refetchOrder } = useGetOrderQuery(activeOrderId ?? "", {
    skip: !token || !activeOrderId,
  });

  const displayOrder = orderFetched ?? orderSnapshot;

  const resumeParam = (searchParams.get("resume") ?? "").trim();
  const resumeId = resumeParam && isUuid(resumeParam) ? resumeParam : null;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (hasSavedAddress) {
      setAddressMode("saved");
    } else {
      setAddressMode("new");
    }
  }, [hasSavedAddress]);

  // Cargo insurance is only offered on Lagos-destined shipments.
  useEffect(() => {
    if (destination !== "lagos" && insurance) setInsurance(false);
  }, [destination, insurance]);

  useEffect(() => {
    if (resumeId) {
      setActiveOrderId(resumeId);
      return;
    }
    const stored = getPendingCheckoutOrderId();
    if (stored && isUuid(stored)) {
      setActiveOrderId(stored);
    }
  }, [resumeId]);

  useEffect(() => {
    if (!displayOrder) return;
    if (displayOrder.status === "PAID") {
      clearPendingCheckoutOrderId();
      setActiveOrderId(null);
      setOrderSnapshot(null);
    }
  }, [displayOrder?.id, displayOrder?.status]);

  useEffect(() => {
    if (!displayOrder?.payment?.provider) return;
    const p = displayOrder.payment.provider;
    if (isPaymentProvider(p)) {
      setProvider(p);
    }
  }, [displayOrder?.payment?.provider]);

  const inPaymentStep = Boolean(
    activeOrderId && displayOrder && orderCanInitializePayment(displayOrder) && !myazaSession
  );

  const showMyaza = Boolean(myazaSession && myazaOrderId);

  const apiItems = cart?.items ?? [];
  const apiCurrency = cart?.currency ?? "USD";
  const apiSubtotal = coerceNumber(cart?.subtotal, 0);
  const apiServiceCharge = coerceNumber(cart?.serviceCharge, 0);
  const apiDiscount = coerceNumber(cart?.discount, 0);
  const apiFees = coerceNumber(cart?.fees, apiServiceCharge - apiDiscount);
  const apiTotal = coerceNumber(cart?.total, apiSubtotal + apiFees);

  const orderCurrency = displayOrder?.items[0]?.currency ?? displayOrder?.currency ?? "USD";
  const orderSubtotalN = useMemo(
    () =>
      displayOrder
        ? displayOrder.items.reduce((s, i) => s + orderLineTotal(i as Parameters<typeof orderLineTotal>[0]), 0)
        : 0,
    [displayOrder]
  );
  const oSub = coerceNumber(displayOrder?.subtotal, orderSubtotalN);
  const oSvc = coerceNumber(displayOrder?.serviceCharge, 0);
  const oDisc = coerceNumber(displayOrder?.discount, 0);
  const oFees = coerceNumber(displayOrder?.fees, oSvc - oDisc);
  const oTotal = coerceNumber(displayOrder?.total, oSub + oFees);

  // Payment options are restricted to Stripe only.
  const methodRows: PaymentMethodEntry[] = useMemo(() => {
    const rows = methodsError || !paymentMethods?.methods?.length ? DEFAULT_METHODS : paymentMethods.methods;
    return rows.filter((m) => m.provider === "stripe");
  }, [paymentMethods, methodsError]);

  const availableProviders = useMemo(() => methodRows.filter((x) => x.available).map((x) => x.provider), [methodRows]);

  useEffect(() => {
    if (availableProviders.length === 0) return;
    if (!availableProviders.includes(provider)) {
      setProvider(availableProviders[0]!);
    }
  }, [availableProviders, provider]);

  const runInitialize = useCallback(
    async (order: OrderResponse) => {
      setPayInitError(false);
      setFormError("");
      resetPayError();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      try {
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
          ...(provider === "paypal"
            ? {
                paypalReturnUrl: origin ? `${origin}/checkout/paypal/success?order_id=${order.id}` : undefined,
                paypalCancelUrl: origin ? `${origin}/checkout/paypal/cancel?order_id=${order.id}` : undefined,
              }
            : {}),
          ...(provider === "myaza"
            ? {
                myazaReturnUrl: origin ? `${origin}/checkout/myaza/success?order_id=${order.id}` : undefined,
                myazaCancelUrl: origin ? `${origin}/checkout/myaza/cancel?order_id=${order.id}` : undefined,
              }
            : {}),
        }).unwrap();

        if (pay.provider === "paystack") {
          window.location.href = pay.authorizationUrl;
          return;
        }
        if (pay.provider === "stripe") {
          window.location.href = pay.url;
          return;
        }
        if (pay.provider === "paypal") {
          sessionStorage.setItem(
            PAYPAL_STORAGE,
            JSON.stringify({ orderId: order.id, paypalOrderId: pay.paypalOrderId })
          );
          window.location.href = pay.approvalUrl;
          return;
        }
        if (pay.provider === "myaza") {
          setMyazaOrderId(order.id);
          setMyazaSession(pay);
          if (pay.checkoutUrl) {
            window.open(pay.checkoutUrl, "_blank", "noopener,noreferrer");
          }
          void refetchOrder();
        }
      } catch (err) {
        setPayInitError(true);
        setFormError(getErrorMessage(err));
      }
    },
    [provider, initPayment, resetPayError, refetchOrder]
  );

  const onGetQuote = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setQuoteError("");
    if (inPaymentStep) return;
    if (apiItems.length === 0) {
      setFormError("Your cart is empty. Add something from the shop, then come back to checkout.");
      return;
    }

    let shippingData: {
      fullName: string;
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      country: string;
      postalCode?: string;
      phone?: string;
    };

    if (addressMode === "saved" && hasSavedAddress && me?.defaultShippingAddress) {
      const s = me.defaultShippingAddress;
      const fullName =
        s.fullName?.trim() ||
        [me.firstName, me.lastName].filter(Boolean).join(" ") ||
        "Customer";
      shippingData = {
        fullName,
        line1: s.line1.trim(),
        line2: s.line2?.trim() || undefined,
        city: s.city.trim(),
        state: s.state?.trim() || undefined,
        country: s.country?.trim() || "NG",
        postalCode: s.postalCode?.trim() || undefined,
        phone: s.phone?.trim() || me.phone?.trim() || undefined,
      };
    } else {
      const fd = new FormData(e.currentTarget);
      const fullName = String(fd.get("fullName") ?? "").trim();
      const line1 = String(fd.get("line1") ?? "").trim();
      const city = String(fd.get("city") ?? "").trim();
      const country = String(fd.get("country") ?? "").trim() || "NG";
      if (!fullName || !line1 || !city) {
        setFormError("Full name, address line, and city are required.");
        return;
      }
      shippingData = {
        fullName,
        line1,
        city,
        country,
        line2: String(fd.get("line2") ?? "").trim() || undefined,
        state: String(fd.get("state") ?? "").trim() || undefined,
        postalCode: String(fd.get("postalCode") ?? "").trim() || undefined,
        phone: String(fd.get("phone") ?? "").trim() || undefined,
      };

      if (saveToProfile) {
        void patchMe({ defaultShippingAddress: shippingData });
      }
    }

    setPendingFormData(shippingData);
    try {
      const quoteResult = await getLandedCostQuote({
        destination,
        shippingService,
        category,
        displayCurrency: "NGN",
        insurance,
      }).unwrap();
      setLandedCostQuote(quoteResult);
    } catch {
      setQuoteError("Could not fetch landed cost estimate. You can still place the order.");
      setLandedCostQuote(null);
    }
  };

  const onPlaceOrder = async () => {
    if (!pendingFormData) return;
    if (phoneVerificationBlocked) {
      setFormError("Verify your phone number via WhatsApp in Settings before checking out.");
      return;
    }
    if (availableProviders.length > 0 && !availableProviders.includes(provider) && !methodsError) {
      setFormError("That payment method is not available right now. Choose another option.");
      return;
    }
    setPlaceOrderBusy(true);
    try {
      const shouldSave = addressMode === "new" ? saveToProfile : !hasSavedAddress;
      const order = await createOrder({
        shippingAddress: pendingFormData,
        saveAddressToProfile: shouldSave,
        landedCost: { destination, shippingService, category, insurance },
      }).unwrap();
      if (shouldSave && addressMode === "new") {
        void patchMe({ defaultShippingAddress: pendingFormData });
      }
      setOrderSnapshot(order);
      setActiveOrderId(order.id);
      setPendingCheckoutOrderId(order.id);
      setMyazaSession(null);
      setMyazaOrderId(null);
      setLandedCostQuote(null);
      setPendingFormData(null);
      dispatch(unifiedCommerceApi.util.invalidateTags(["Cart", "Me"]));
      void refetchCart();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setPlaceOrderBusy(false);
    }
  };

  const onPay = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    if (!displayOrder || displayOrder.status !== "PENDING") {
      setFormError("This order is not awaiting payment. Open your orders list.");
      return;
    }
    if (availableProviders.length > 0 && !availableProviders.includes(provider) && !methodsError) {
      setFormError("That payment method is not available right now. Choose another option.");
      return;
    }
    void runInitialize(displayOrder);
  };

  const showQuoteConfirm = Boolean(pendingFormData && !inPaymentStep);
  const loading = meLoading || cartLoading || methodsLoading;

  if (!mounted) {
    return (
      <InnerShell>
        <LoadingState label="Loading…" />
      </InnerShell>
    );
  }

  if (!token) {
    return (
      <InnerShell>
        <div className="max-w-lg space-y-4 rounded-[20px] border border-shop-border bg-white p-7">
          <h1 className="text-xl font-semibold">Sign in to checkout</h1>
          <p className="text-sm text-black/70">
            Sign in to place an order and pay securely.
            {localItems.length > 0
              ? " Your browsing cart won't carry over after sign-in — you can add items again once you're in."
              : null}
          </p>
          <Link href={loginUrl("/checkout")} className="btn-primary inline-block text-center">
            Sign in
          </Link>
        </div>
      </InnerShell>
    );
  }

  if (activeOrderId && !displayOrder && orderLoading) {
    return (
      <InnerShell>
        <LoadingState label="Loading your order…" />
      </InnerShell>
    );
  }

  if (activeOrderId && displayOrder && displayOrder.status === "PAID") {
    return (
      <InnerShell>
        <div className="max-w-lg space-y-3 rounded-[20px] border border-shop-border bg-white p-7">
          <h1 className="text-lg font-semibold">Order already paid</h1>
          <p className="text-sm text-black/70">This order is complete. You can open it from your account.</p>
          <Link className="btn-primary" href={`/dashboard/orders/${displayOrder.id}`}>
            View order
          </Link>
        </div>
      </InnerShell>
    );
  }

  const summaryItems = inPaymentStep || showMyaza
    ? (displayOrder?.items ?? []).map((i) => ({ title: i.title, quantity: i.quantity, image: i.images?.[0], key: i.title }))
    : apiItems.map((i) => ({ title: lineTitle(i), quantity: i.quantity, image: lineImage(i), key: i.id }));

  const totalLabel = inPaymentStep || showMyaza
    ? formatApiMoney(displayOrder?.displaySummary ? Number(displayOrder.displaySummary.total) : oTotal, displayOrder?.currency ?? orderCurrency)
    : showQuoteConfirm && landedCostQuote?.totalDisplay
      ? `${landedCostQuote.displayCurrency} ${landedCostQuote.totalDisplay.toLocaleString()}`
      : `${apiCurrency} ${apiTotal.toFixed(2)}`;

  return (
    <InnerShell>
      <div className="flex flex-col gap-7">
        <Steps
          current={1}
          steps={[
            { label: "Cart", href: "/cart" },
            { label: "Checkout", href: "/checkout" },
            { label: "Success" },
          ]}
        />

        <h1 className="text-[34px] font-extrabold tracking-[-0.8px] text-shop-ink">Checkout</h1>

        {loading && !inPaymentStep && <LoadingState label="Loading…" />}
        {createErr && <ErrorState error={createError} title="Couldn't place order" />}
        {payErr && payInitError && <ErrorState error={payError} title="Payment setup failed" />}

        {showMyaza && myazaOrderId ? (
          <section className="flex flex-col gap-4 rounded-[20px] border border-shop-border bg-white p-7">
            <h2 className="text-lg font-semibold">Complete Myaza payment</h2>
            <p className="text-sm text-black/70">
              Send the indicated amount to the address below, or use the hosted checkout if you opened it in a new tab. Open
              your order to see when the payment clears.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {myazaSession?.qrCode ? (
                <div className="relative h-48 w-48 border border-black/10 bg-white">
                  <Image src={myazaSession.qrCode} alt="" fill className="object-contain p-2" unoptimized />
                </div>
              ) : null}
              {myazaSession ? (
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-black/50">Network / token</dt>
                    <dd className="font-medium">
                      {myazaSession.chain} / {myazaSession.token}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-black/50">Amount</dt>
                    <dd className="font-mono">{myazaSession.amount}</dd>
                  </div>
                  <div>
                    <dt className="text-black/50">Deposit address</dt>
                    <dd className="mt-1 flex items-start gap-2">
                      <span className="break-all font-mono text-xs leading-relaxed">{myazaSession.depositAddress}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(myazaSession.depositAddress).then(() => {
                            setCopiedAddress(true);
                            setTimeout(() => setCopiedAddress(false), 2000);
                          });
                        }}
                        className="shrink-0 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-medium text-shop-ink transition hover:bg-black/5 active:scale-95"
                      >
                        {copiedAddress ? "Copied!" : "Copy"}
                      </button>
                    </dd>
                  </div>
                  {myazaSession.checkoutUrl ? (
                    <dd>
                      <a
                        className="text-shop-accent underline"
                        href={myazaSession.checkoutUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open Myaza checkout
                      </a>
                    </dd>
                  ) : null}
                </dl>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="btn-primary" href={`/dashboard/orders/${myazaOrderId}`}>
                View order
              </Link>
              <Link className="btn-secondary" href="/">
                Continue shopping
              </Link>
            </div>
          </section>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="flex flex-col gap-6">
            {inPaymentStep && displayOrder && !showMyaza ? (
              <form className="flex flex-col gap-[18px] rounded-[20px] border border-shop-border bg-white p-7" onSubmit={onPay}>
                <h2 className="text-lg font-semibold">Pay for order {displayOrder.id.slice(0, 8)}…</h2>
                <p className="text-sm text-amber-900/80">
                  Status: <span className="font-medium">{displayOrder.status}</span>. Your cart was cleared when the order was placed — use the totals below to complete payment.
                </p>
                {displayOrder.shippingAddress ? (
                  <div className="rounded-xl border border-shop-border bg-(--background) p-3 text-sm">
                    <p className="font-medium text-shop-ink">Ship to</p>
                    <p className="mt-1 text-black/80">
                      {displayOrder.shippingAddress.fullName}
                      <br />
                      {displayOrder.shippingAddress.line1}
                      {displayOrder.shippingAddress.line2 ? <>, {displayOrder.shippingAddress.line2}</> : null}
                      <br />
                      {displayOrder.shippingAddress.city}
                      {displayOrder.shippingAddress.state ? `, ${displayOrder.shippingAddress.state}` : ""}{" "}
                      {displayOrder.shippingAddress.postalCode}
                      <br />
                      {displayOrder.shippingAddress.country}
                    </p>
                  </div>
                ) : null}

                <div className="flex items-center gap-2.5 pt-2">
                  <CreditCard className="h-[18px] w-[18px]" style={{ color: "var(--shop-primary)" }} aria-hidden />
                  <h3 className="text-[17px] font-bold text-shop-ink">Payment method</h3>
                </div>
                {!methodsError && availableProviders.length === 0 ? (
                  <p className="text-sm text-amber-800">No payment methods are available right now.</p>
                ) : null}
                {methodsError ? (
                  <p className="text-xs text-black/50">Couldn&apos;t check payment options — Stripe is shown by default.</p>
                ) : null}

                <div
                  className="flex items-center gap-3 rounded-xl p-4"
                  style={{ background: "var(--shop-accent-soft)", border: "1.5px solid var(--shop-primary)" }}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ border: "2px solid var(--shop-primary)", background: "#FFFFFF" }}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--shop-primary)" }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-shop-ink">Stripe Checkout</p>
                    <p className="text-xs text-shop-muted">International cards</p>
                  </div>
                </div>

                {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    className="btn-primary w-full sm:w-auto"
                    type="submit"
                    disabled={paying || (!methodsError && availableProviders.length === 0)}
                  >
                    {paying ? "Starting…" : "Complete payment"}
                  </button>
                  {payInitError || payErr ? (
                    <button
                      type="button"
                      className="btn-secondary w-full sm:w-auto"
                      onClick={() => {
                        setFormError("");
                        setPayInitError(false);
                        resetPayError();
                      }}
                    >
                      Dismiss error
                    </button>
                  ) : null}
                </div>
                <p className="text-xs text-black/50">
                  If payment didn&apos;t start, you can <span className="font-medium">try again</span>. Your order stays open.
                </p>
              </form>
            ) : !inPaymentStep && !showMyaza && !showQuoteConfirm ? (
              <form className="flex flex-col gap-6" onSubmit={onGetQuote}>
                <SectionCard icon={MapPin} title="Shipping details">
                  <p className="-mt-2 text-xs text-shop-muted">
                    Placing the order <span className="font-medium text-shop-ink">clears your cart</span>. You&apos;ll complete payment on the next step.
                  </p>

                  {hasSavedAddress && me?.defaultShippingAddress ? (
                    <div className="flex flex-col gap-4">
                      {/* Address mode switcher */}
                      <div className="flex rounded-xl bg-black/5 p-1">
                        <button
                          type="button"
                          onClick={() => setAddressMode("saved")}
                          className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                            addressMode === "saved"
                              ? "bg-white text-shop-ink shadow-sm"
                              : "text-shop-muted hover:text-shop-ink"
                          }`}
                        >
                          Deliver to saved address
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddressMode("new")}
                          className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                            addressMode === "new"
                              ? "bg-white text-shop-ink shadow-sm"
                              : "text-shop-muted hover:text-shop-ink"
                          }`}
                        >
                          Use a different address
                        </button>
                      </div>

                      {addressMode === "saved" ? (
                        <div className="flex flex-col gap-3 rounded-xl border border-shop-border bg-(--background) p-4">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                              <Check className="h-3.5 w-3.5" aria-hidden /> Default profile address
                            </span>
                            <button
                              type="button"
                              onClick={() => setAddressMode("new")}
                              className="text-xs font-semibold text-shop-accent hover:underline"
                            >
                              Deliver elsewhere
                            </button>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-shop-ink">
                              {me.defaultShippingAddress.fullName ||
                                [me.firstName, me.lastName].filter(Boolean).join(" ") ||
                                "Saved Customer"}
                            </p>
                            <p className="mt-0.5 text-xs text-black/75">
                              {me.defaultShippingAddress.line1}
                              {me.defaultShippingAddress.line2 ? `, ${me.defaultShippingAddress.line2}` : ""}
                            </p>
                            <p className="text-xs text-black/75">
                              {me.defaultShippingAddress.city}
                              {me.defaultShippingAddress.state ? `, ${me.defaultShippingAddress.state}` : ""}
                              {me.defaultShippingAddress.postalCode ? ` ${me.defaultShippingAddress.postalCode}` : ""}
                              {me.defaultShippingAddress.country ? `, ${me.defaultShippingAddress.country}` : ""}
                            </p>
                            {(me.defaultShippingAddress.phone || me.phone) && (
                              <p className="mt-1 text-xs font-medium text-shop-muted">
                                Phone: {me.defaultShippingAddress.phone || me.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-shop-ink">Enter new shipping details</span>
                            <button
                              type="button"
                              onClick={() => setAddressMode("saved")}
                              className="text-xs font-medium text-shop-accent hover:underline"
                            >
                              ← Use saved address
                            </button>
                          </div>
                          <Field
                            label="Full name"
                            name="fullName"
                            placeholder="Jane Doe"
                            required
                            defaultValue={me?.firstName && me?.lastName ? `${me.firstName} ${me.lastName}` : (me?.defaultShippingAddress?.fullName ?? "")}
                          />
                          <Field label="Address line 1" name="line1" placeholder="Street, building, unit" required />
                          <Field label="Address line 2 (optional)" name="line2" placeholder="Apartment, suite, etc." />
                          <div className="flex w-full gap-4">
                            <Field label="City" name="city" placeholder="Lagos" required />
                            <Field label="State / region" name="state" placeholder="Lagos" />
                          </div>
                          <div className="flex w-full gap-4">
                            <Field label="Country" name="country" placeholder="Nigeria" defaultValue="NG" />
                            <Field label="Postal code" name="postalCode" placeholder="100001" />
                          </div>
                          <Field label="Phone" name="phone" type="tel" placeholder="+234 …" defaultValue={me?.phone ?? ""} />

                          <label className="flex w-full cursor-pointer items-start gap-3 rounded-xl border border-shop-border bg-(--background) p-3.5 transition hover:bg-black/5">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={saveToProfile}
                              onChange={(e) => setSaveToProfile(e.target.checked)}
                            />
                            <span
                              className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[5px]"
                              style={
                                saveToProfile
                                  ? { background: "var(--shop-primary)" }
                                  : { border: "1.5px solid var(--shop-border)", background: "#FFFFFF" }
                              }
                            >
                              {saveToProfile && <Check className="h-3 w-3 text-white" aria-hidden />}
                            </span>
                            <span className="flex flex-col gap-0.5">
                              <span className="text-xs font-semibold text-shop-ink">Save as default address in my profile</span>
                              <span className="text-[11px] leading-relaxed text-shop-muted">
                                {saveToProfile
                                  ? "Updates your profile address for 1-click checkout on future orders."
                                  : "Temporary address — this won't overwrite your saved profile address."}
                              </span>
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <Field
                        label="Full name"
                        name="fullName"
                        placeholder="Jane Doe"
                        required
                        defaultValue={me?.firstName && me?.lastName ? `${me.firstName} ${me.lastName}` : (me?.defaultShippingAddress?.fullName ?? "")}
                      />
                      <Field label="Address line 1" name="line1" placeholder="Street, building, unit" required defaultValue={me?.defaultShippingAddress?.line1 ?? ""} />
                      <Field label="Address line 2 (optional)" name="line2" placeholder="Apartment, suite, etc." defaultValue={me?.defaultShippingAddress?.line2 ?? ""} />
                      <div className="flex w-full gap-4">
                        <Field label="City" name="city" placeholder="Lagos" required defaultValue={me?.defaultShippingAddress?.city ?? ""} />
                        <Field label="State / region" name="state" placeholder="Lagos" defaultValue={me?.defaultShippingAddress?.state ?? ""} />
                      </div>
                      <div className="flex w-full gap-4">
                        <Field label="Country" name="country" placeholder="Nigeria" defaultValue={me?.defaultShippingAddress?.country ?? "NG"} />
                        <Field label="Postal code" name="postalCode" placeholder="100001" defaultValue={me?.defaultShippingAddress?.postalCode ?? ""} />
                      </div>
                      <Field label="Phone" name="phone" type="tel" placeholder="+234 …" defaultValue={me?.defaultShippingAddress?.phone ?? me?.phone ?? ""} />

                      <label className="flex w-full cursor-pointer items-start gap-3 rounded-xl border border-shop-border bg-(--background) p-3.5 transition hover:bg-black/5">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={saveToProfile}
                          onChange={(e) => setSaveToProfile(e.target.checked)}
                        />
                        <span
                          className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[5px]"
                          style={
                            saveToProfile
                              ? { background: "var(--shop-primary)" }
                              : { border: "1.5px solid var(--shop-border)", background: "#FFFFFF" }
                          }
                        >
                          {saveToProfile && <Check className="h-3 w-3 text-white" aria-hidden />}
                        </span>
                        <span className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-shop-ink">Save this address to my profile</span>
                          <span className="text-[11px] leading-relaxed text-shop-muted">
                            {saveToProfile
                              ? "Saved to your profile so you don't have to enter it again on future orders."
                              : "Use as a temporary address for this order only."}
                          </span>
                        </span>
                      </label>
                    </div>
                  )}
                </SectionCard>

                <SectionCard icon={Truck} title="Delivery options">
                  <div className="flex w-full gap-4">
                    <SelectField
                      label="Destination"
                      value={destination}
                      onChange={setDestination}
                      options={[
                        { value: "lagos", label: "Lagos" },
                        { value: "outside_lagos", label: "Outside Lagos" },
                      ]}
                    />
                    <SelectField
                      label="Shipping service"
                      value={shippingService}
                      onChange={setShippingService}
                      options={[
                        { value: "air", label: "Air (faster)" },
                        { value: "ocean_small", label: "Ocean small box" },
                      ]}
                    />
                  </div>
                  <SelectField
                    label="Product category"
                    value={category}
                    onChange={setCategory}
                    options={[
                      { value: "generic", label: "General / Other" },
                      { value: "sneakers", label: "Sneakers" },
                      { value: "clothing", label: "Clothing" },
                      { value: "phone", label: "Phone" },
                      { value: "laptop", label: "Laptop" },
                      { value: "tablet", label: "Tablet" },
                      { value: "tv", label: "TV" },
                      { value: "electronics_small", label: "Electronics (small)" },
                      { value: "electronics_large", label: "Electronics (large)" },
                      { value: "accessories", label: "Accessories" },
                      { value: "books", label: "Books" },
                    ]}
                  />
                  {destination === "lagos" && (
                    <label className="flex w-full cursor-pointer items-start gap-3 rounded-xl border border-shop-border bg-(--background) p-4">
                      <input type="checkbox" className="sr-only" checked={insurance} onChange={(e) => setInsurance(e.target.checked)} />
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px]"
                        style={insurance ? { background: "var(--shop-primary)" } : { border: "1.5px solid var(--shop-border)", background: "#FFFFFF" }}
                      >
                        {insurance && <Check className="h-[13px] w-[13px] text-white" aria-hidden />}
                      </span>
                      <span className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-shop-ink">Add cargo insurance</span>
                        <span className="text-[13px] leading-[1.45] text-shop-muted">
                          3% of item cost{apiSubtotal > 0 ? ` (~$${(apiSubtotal * 0.03).toFixed(2)})` : ""} — covers loss or damage in transit to Lagos.
                        </span>
                      </span>
                    </label>
                  )}
                </SectionCard>

                {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
                <button
                  className="btn-primary w-full"
                  type="submit"
                  disabled={quoting || apiItems.length === 0 || loading}
                >
                  {quoting ? "Getting estimate…" : "Get cost estimate"}
                </button>
              </form>
            ) : showQuoteConfirm && !inPaymentStep && !showMyaza ? (
              <div className="flex flex-col gap-4 rounded-[20px] border border-shop-border bg-white p-7">
                <h2 className="text-lg font-semibold">Confirm your order</h2>
                <p className="text-xs text-black/60">
                  Review the estimated landed cost below. Once you place the order, your cart is cleared.
                </p>
                {pendingFormData && (
                  <div className="rounded-xl border border-shop-border bg-(--background) p-3 text-xs">
                    <div className="flex items-center justify-between font-medium text-shop-ink">
                      <span>Ship to</span>
                      <span className="text-[11px] text-shop-muted">
                        {addressMode === "saved" ? "Saved Profile Address" : saveToProfile ? "Saving as Default" : "Temporary Address"}
                      </span>
                    </div>
                    <p className="mt-1 text-black/80">
                      <span className="font-semibold">{pendingFormData.fullName}</span> — {pendingFormData.line1}
                      {pendingFormData.line2 ? `, ${pendingFormData.line2}` : ""}, {pendingFormData.city}
                      {pendingFormData.state ? `, ${pendingFormData.state}` : ""} ({pendingFormData.country})
                      {pendingFormData.phone ? ` • Tel: ${pendingFormData.phone}` : ""}
                    </p>
                  </div>
                )}
                {landedCostQuote ? (
                  <div className="space-y-2 rounded-xl border border-shop-border bg-(--background) p-4">
                    <p className="text-sm font-medium text-shop-ink">Estimated landed cost</p>
                    {landedCostQuote.marketplaceConfidence === "low" && (
                      <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5">
                        Marketplace estimates are approximate. Final cost may vary slightly.
                      </p>
                    )}
                    <ul className="space-y-1 text-xs text-black/70 font-mono">
                      {landedCostQuote.breakdown.map((line, i) => (
                        <li key={i} className="whitespace-pre-wrap">{line}</li>
                      ))}
                    </ul>
                    {landedCostQuote.totalDisplay && landedCostQuote.displayCurrency && (
                      <p className="pt-2 text-sm font-semibold text-shop-ink border-t border-shop-border">
                        Estimated total: {landedCostQuote.displayCurrency} {landedCostQuote.totalDisplay.toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : quoteError ? (
                  <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">{quoteError}</p>
                ) : null}
                {phoneVerificationBlocked && (
                  <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                    Verify your phone number via WhatsApp in{" "}
                    <Link href="/dashboard/settings" className="font-semibold underline">
                      Settings
                    </Link>{" "}
                    before checking out.
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => { setLandedCostQuote(null); setPendingFormData(null); setQuoteError(""); }}
                  >
                    Back
                  </button>
                  <button
                    className="btn-primary flex-1"
                    type="button"
                    disabled={creating || placeOrderBusy || phoneVerificationBlocked}
                    onClick={onPlaceOrder}
                  >
                    {creating || placeOrderBusy ? "Placing order…" : "Place order"}
                  </button>
                </div>
                {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
              </div>
            ) : null}
          </div>

          <section className="flex h-fit flex-col gap-[18px] rounded-[20px] border border-shop-border bg-white p-[26px] lg:sticky lg:top-24">
            <h2 className="text-lg font-bold text-shop-ink">Order summary</h2>

            {summaryItems.length > 0 && (
              <div className="flex flex-col gap-3 border-b border-shop-border pb-4">
                {summaryItems.map((item) => (
                  <div key={item.key} className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-(--background)">
                      {item.image ? (
                        <Image src={item.image} alt="" fill className="object-contain p-1" unoptimized />
                      ) : null}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-shop-ink">
                      {item.title} × {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {(inPaymentStep || showMyaza) && displayOrder ? (
              <>
                {displayOrder.displaySummary ? (
                  <CheckoutDisplaySummary summary={displayOrder.displaySummary} />
                ) : (
                  <>
                    <div className="flex flex-col gap-[11px] text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-shop-muted">Product</span>
                        <span className="font-semibold tabular-nums text-shop-ink">{orderCurrency} {oSub.toFixed(2)}</span>
                      </div>
                      {oSvc > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-shop-muted">Service charge</span>
                          <span className="font-semibold tabular-nums text-shop-ink">{orderCurrency} {oSvc.toFixed(2)}</span>
                        </div>
                      )}
                      {oDisc > 0 && (
                        <div className="flex items-center justify-between" style={{ color: "var(--shop-primary)" }}>
                          <span>Discount</span>
                          <span className="font-semibold tabular-nums">-{orderCurrency} {oDisc.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    <div className="h-px w-full bg-shop-border" />
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-bold text-shop-ink">Total</span>
                      <span className="text-2xl font-extrabold tabular-nums text-shop-ink">{formatApiMoney(oTotal, displayOrder.currency ?? orderCurrency)}</span>
                    </div>
                  </>
                )}
                {displayOrder.pricingBreakdown && displayOrder.pricingBreakdown.length > 0 && (
                  <details className="border-t border-shop-border pt-3 text-xs text-black/50">
                    <summary className="cursor-pointer select-none hover:text-black/80">Cost breakdown</summary>
                    <ul className="mt-2 space-y-0.5 font-mono">
                      {displayOrder.pricingBreakdown.map((line, i) => (
                        <li key={i} className="whitespace-pre-wrap">{line}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-shop-muted">
                  {apiItems.length} {apiItems.length === 1 ? "item" : "items"} in your cart
                </p>
                {localItems.length > 0 ? (
                  <p className="-mt-2 text-xs text-shop-muted">
                    {localItems.length} saved in your browser only
                  </p>
                ) : null}

                {showQuoteConfirm && landedCostQuote ? (
                  <ul className="space-y-1 text-xs text-black/70 font-mono">
                    {landedCostQuote.breakdown.map((line, i) => (
                      <li key={i} className="whitespace-pre-wrap">{line}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col gap-[11px] text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-shop-muted">Product</span>
                      <span className="font-semibold tabular-nums text-shop-ink">{apiCurrency} {apiSubtotal.toFixed(2)}</span>
                    </div>
                    {apiServiceCharge > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-shop-muted">Service charge</span>
                        <span className="font-semibold tabular-nums text-shop-ink">{apiCurrency} {apiServiceCharge.toFixed(2)}</span>
                      </div>
                    )}
                    {apiDiscount > 0 && (
                      <div className="flex items-center justify-between" style={{ color: "var(--shop-primary)" }}>
                        <span>Discount</span>
                        <span className="font-semibold tabular-nums">-{apiCurrency} {apiDiscount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="h-px w-full bg-shop-border" />
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-bold text-shop-ink">Total</span>
                  <span className="text-2xl font-extrabold tabular-nums text-shop-ink">{totalLabel}</span>
                </div>
                {localItems.length > 0 ? (
                  <p className="text-xs text-shop-muted">
                    On-device only: USD {localSubtotal.toFixed(2)}
                  </p>
                ) : null}

              </>
            )}

            <div className="flex items-center justify-center gap-[7px] pt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-shop-muted" aria-hidden />
              <span className="text-xs text-shop-muted">Secure, encrypted checkout</span>
            </div>
          </section>
        </div>
      </div>
    </InnerShell>
  );
}
