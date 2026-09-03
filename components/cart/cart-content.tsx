"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, ShieldCheck, Trash2 } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useAppSelector } from "@/store/hooks";
import {
  useDeleteCartItemMutation,
  useGetCartQuery,
  usePatchCartItemMutation,
} from "@/store/routes/unified-commerce-api";
import type { CartItemResponse } from "@/types/api";
import { ErrorState, LoadingState } from "@/components/feedback/query-state";
import { coerceNumber } from "@/lib/coerce-number";
import { ProductQuantityStepper } from "@/components/product/product-quantity-stepper";
import { formatApiMoney } from "@/lib/format-price";
import { loginUrl } from "@/lib/auth-redirect";
import { lineBrand, lineCurrency, lineImage, linePrice, lineTitle, lineUnitPrice } from "@/lib/cart-item-helpers";
import { ConfirmModal } from "@/components/ui/confirm-modal";

function fmtMoney(amount: number, currency: string) {
  return formatApiMoney(amount, currency);
}

type TotalsSnapshot = {
  subtotal: number;
  serviceCharge: number;
  discount: number;
  fees: number;
  total: number;
};

export type CartContentLayout = "page" | "drawer";

/* ══════════════════════════════════════════
   DRAWER — unchanged visual
══════════════════════════════════════════ */

function DrawerLineItem({
  imageSrc, imageAlt, brand, title, variantLine,
  unitLabel, lineTotalLabel, quantity,
  onQuantityChange, onRemove, maxQty, disabled,
}: {
  imageSrc: string; imageAlt: string; brand: string; title: string;
  variantLine?: string; unitLabel: string; lineTotalLabel: string;
  quantity: number; onQuantityChange: (q: number) => void;
  onRemove: () => void; maxQty?: number; disabled?: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <article className="border-b border-black/10 py-4 last:border-b-0">
        <div className="grid grid-cols-[4rem_1fr_minmax(4rem,auto)] gap-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-neutral-100">
            <Image src={imageSrc} alt={imageAlt} fill className="object-contain p-1" sizes="64px" unoptimized />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-black/50">{brand}</p>
            <h3 className="mt-0.5 text-sm font-medium leading-snug text-shop-ink">{title}</h3>
            {variantLine ? <p className="mt-1 text-xs text-black/50">{variantLine}</p> : null}
            <p className="mt-1 text-xs text-black/50 tabular-nums">{unitLabel}</p>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-black/60">Quantity</span>
                <ProductQuantityStepper
                  value={quantity} onChange={onQuantityChange}
                  min={1} max={maxQty} disabled={disabled}
                />
              </div>
              <button
                type="button" onClick={() => setConfirmOpen(true)} disabled={disabled}
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-black text-white transition hover:bg-black/85 disabled:opacity-40"
                aria-label="Remove item"
              >
                <Trash2 size={18} strokeWidth={1.75} aria-hidden />
              </button>
            </div>
          </div>
          <p className="text-right text-sm font-semibold tabular-nums text-shop-ink">{lineTotalLabel}</p>
        </div>
      </article>

      <ConfirmModal
        open={confirmOpen}
        title="Remove item"
        description={`Remove "${title}" from your bag?`}
        confirmLabel="Remove"
        cancelLabel="Keep"
        danger
        onConfirm={() => { setConfirmOpen(false); onRemove(); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

function DrawerFooter({
  totals, currencyLabel, ctaDisabled, onCheckoutNavigate, signInHint,
}: {
  totals: TotalsSnapshot; currencyLabel: string;
  ctaDisabled: boolean; onCheckoutNavigate?: () => void; signInHint?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const fmt = (n: number) => fmtMoney(n, currencyLabel);

  return (
    <div className="shrink-0 border-t border-black/10 bg-white px-4 py-4">
      {signInHint && (
        <p className="mb-3 text-center text-xs text-black/55">
          <Link href={loginUrl("/cart")} className="font-medium underline" style={{ color: "#059669" }}>Sign in</Link>{" "}
          to sync your cart across devices
        </p>
      )}
      <button
        type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="flex w-full items-center justify-between py-2 text-left text-sm font-medium text-shop-ink"
      >
        Order special instructions
        <ChevronDown size={14} className={`shrink-0 text-black/45 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2} aria-hidden />
      </button>
      {open && (
        <textarea className="input mt-1 min-h-22 resize-y" rows={3} placeholder="Gift message, delivery notes…" aria-label="Order special instructions" />
      )}
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-shop-ink">Subtotal</span>
        <span className="text-sm font-bold tabular-nums text-shop-ink">{fmt(totals.subtotal)}</span>
      </div>
      <div className="mt-2 space-y-1 text-xs text-black/55">
        <div className="flex items-center justify-between">
          <span>Service charge</span><span>{fmt(totals.serviceCharge)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Discount</span><span>-{fmt(totals.discount)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-black/10 pt-1 font-semibold text-shop-ink">
          <span>Total</span><span>{fmt(totals.total)}</span>
        </div>
      </div>
      <p className="mt-2 text-xs text-black/50">Taxes and shipping calculated at checkout</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href="/cart" onClick={onCheckoutNavigate}
          className="rounded-full border border-gray-200 py-3 text-center text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          View bag
        </Link>
        <Link
          href="/checkout" aria-disabled={ctaDisabled}
          className={`rounded-full py-3 text-center text-xs font-semibold text-white transition hover:opacity-90 ${ctaDisabled ? "cursor-not-allowed opacity-40" : ""}`}
          style={{ background: "#059669" }}
          onClick={(e) => { if (ctaDisabled) e.preventDefault(); else onCheckoutNavigate?.(); }}
        >
          Check out
        </Link>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PAGE — new design
══════════════════════════════════════════ */

function PageItemCard({
  imageSrc, imageAlt, brand, title, variantLine, unitPrice,
  lineTotal, currency, quantity, onQuantityChange, onRemove, maxQty, disabled,
}: {
  imageSrc: string; imageAlt: string; brand: string; title: string;
  variantLine?: string; unitPrice: number; lineTotal: number; currency: string;
  quantity: number; onQuantityChange: (q: number) => void;
  onRemove: () => void; maxQty?: number; disabled?: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <article className="flex gap-[18px] rounded-[18px] border border-shop-border bg-white p-[18px]">
        {/* Image */}
        <div className="relative h-[110px] w-[110px] shrink-0 overflow-hidden rounded-[14px] bg-(--background)">
          <Image src={imageSrc} alt={imageAlt} fill className="object-contain p-2" sizes="110px" unoptimized />
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--shop-primary)" }} aria-hidden />
            <p className="text-xs font-semibold text-shop-muted">{brand}</p>
          </div>
          <p className="line-clamp-2 text-base font-semibold leading-[1.3] text-shop-ink">{title}</p>
          {variantLine && <p className="text-[13px] text-shop-muted">{variantLine}</p>}

          <div className="mt-auto flex flex-wrap items-center gap-4 pt-2">
            <ProductQuantityStepper
              value={quantity} onChange={onQuantityChange}
              min={1} max={maxQty} disabled={disabled} size="sm"
            />
            <button
              type="button" onClick={() => setConfirmOpen(true)} disabled={disabled}
              className="flex items-center gap-1.5 text-[13px] font-medium text-shop-muted transition hover:text-red-500 disabled:opacity-40"
              aria-label="Remove item"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Remove
            </button>
          </div>
        </div>

        {/* Price */}
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <p className="text-lg font-bold tabular-nums text-shop-ink">{fmtMoney(lineTotal, currency)}</p>
          {quantity > 1 && (
            <p className="text-[11px] tabular-nums text-shop-muted">{fmtMoney(unitPrice, currency)} each</p>
          )}
        </div>
      </article>

      <ConfirmModal
        open={confirmOpen}
        title="Remove item"
        description={`Remove "${title}" from your bag?`}
        confirmLabel="Remove"
        cancelLabel="Keep"
        danger
        onConfirm={() => { setConfirmOpen(false); onRemove(); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

function CartReassurance() {
  return (
    <div
      className="flex w-full items-center gap-2.5 rounded-[14px] p-4"
      style={{ background: "var(--shop-accent-soft)" }}
    >
      <ShieldCheck className="h-[18px] w-[18px] shrink-0" style={{ color: "var(--shop-primary)" }} aria-hidden />
      <p className="text-[13px] font-medium" style={{ color: "var(--shop-primary)" }}>
        Every item is verified for authenticity at our US hub before it ships to you.
      </p>
    </div>
  );
}

function PageSummary({
  count, totals, currencyLabel, ctaDisabled, onCheckoutNavigate, signInHint,
}: {
  count: number; totals: TotalsSnapshot; currencyLabel: string;
  ctaDisabled: boolean; onCheckoutNavigate?: () => void; signInHint?: boolean;
}) {
  const fmt = (n: number) => fmtMoney(n, currencyLabel);

  return (
    <div className="rounded-[20px] border border-shop-border bg-white p-[26px] lg:sticky lg:top-24">
      <h2 className="text-lg font-bold text-shop-ink">Order summary</h2>

      <div className="mt-[18px] flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between text-shop-muted">
          <span>Subtotal ({count} {count === 1 ? "item" : "items"})</span>
          <span className="tabular-nums font-semibold text-shop-ink">{fmt(totals.subtotal)}</span>
        </div>
        {totals.serviceCharge > 0 && (
          <div className="flex items-center justify-between text-shop-muted">
            <span>US procurement &amp; handling</span>
            <span className="tabular-nums font-semibold text-shop-ink">{fmt(totals.serviceCharge)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-shop-muted">
          <span>Estimated air freight</span>
          <span className="text-shop-muted">At checkout</span>
        </div>
        {totals.discount > 0 && (
          <div className="flex items-center justify-between" style={{ color: "var(--shop-primary)" }}>
            <span>Discount</span>
            <span className="tabular-nums font-semibold">-{fmt(totals.discount)}</span>
          </div>
        )}
      </div>

      <div className="my-[18px] h-px w-full bg-shop-border" />

      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold text-shop-ink">Estimated total</span>
        <span className="text-2xl font-extrabold tabular-nums text-shop-ink">{fmt(totals.total)}</span>
      </div>

      <p className="mt-[18px] text-xs leading-[1.45] text-shop-muted">
        Final duties are confirmed at checkout based on destination and category.
      </p>

      <Link
        href="/checkout"
        aria-disabled={ctaDisabled}
        className={`mt-[18px] flex w-full items-center justify-center gap-2 rounded-full py-[15px] text-center text-[15px] font-bold text-white transition hover:opacity-90 ${ctaDisabled ? "pointer-events-none opacity-40" : ""}`}
        style={{ background: "var(--shop-primary)" }}
        onClick={(e) => { if (ctaDisabled) e.preventDefault(); else onCheckoutNavigate?.(); }}
      >
        Proceed to checkout
        <ArrowRight className="h-[17px] w-[17px]" aria-hidden />
      </Link>

      {signInHint && (
        <p className="mt-4 text-center text-xs text-shop-muted">
          <Link href={loginUrl("/cart")} className="font-medium hover:underline" style={{ color: "var(--shop-primary)" }}>Sign in</Link>{" "}
          to sync your cart across devices
        </p>
      )}

      <Link
        href="/shop"
        className="mt-3 block w-full rounded-full border border-shop-border py-[13px] text-center text-sm font-semibold text-shop-ink transition hover:bg-black/5"
      >
        Continue shopping
      </Link>

      <div className="mt-1 flex flex-wrap items-center justify-center gap-2 pt-3">
        {["Visa", "Mastercard", "Paystack", "PayPal"].map((label) => (
          <span
            key={label}
            className="rounded-[7px] border border-shop-border px-[9px] py-[5px] text-[10px] font-semibold text-shop-muted"
            style={{ background: "var(--background)" }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   GUEST + API SECTIONS
══════════════════════════════════════════ */

function GuestCartSection({
  items, removeItem, updateQuantity, subtotal, layout, onCheckoutNavigate,
}: {
  items: ReturnType<typeof useCart>["items"];
  removeItem: (id: string) => void;
  updateQuantity: (id: string, q: number) => void;
  subtotal: number;
  layout: CartContentLayout;
  onCheckoutNavigate?: () => void;
}) {
  const currency = items[0]?.currency ?? "USD";

  if (layout === "drawer") {
    return (
      <>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-black/55">Your bag is empty.</p>
          ) : items.map((item) => (
            <DrawerLineItem
              key={item.id}
              imageSrc={item.image}
              imageAlt={item.title}
              brand={String(item.marketplace)}
              title={item.title}
              variantLine={item.variant ? `${item.variant.name}: ${item.variant.value}` : undefined}
              unitLabel={fmtMoney(item.price, currency)}
              lineTotalLabel={fmtMoney(item.price * item.quantity, currency)}
              quantity={item.quantity}
              onQuantityChange={(q) => updateQuantity(item.id, q)}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </div>
        <DrawerFooter
          totals={{ subtotal, serviceCharge: 0, discount: 0, fees: 0, total: subtotal }}
          currencyLabel={currency}
          ctaDisabled={items.length === 0}
          onCheckoutNavigate={onCheckoutNavigate}
          signInHint
        />
      </>
    );
  }

  /* Page layout */
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <div className="flex flex-col gap-4">
        {items.length === 0 ? (
          <EmptyBag />
        ) : (
          <>
            {items.map((item) => (
              <PageItemCard
                key={item.id}
                imageSrc={item.image}
                imageAlt={item.title}
                brand={String(item.marketplace)}
                title={item.title}
                variantLine={item.variant ? `${item.variant.name}: ${item.variant.value}` : undefined}
                unitPrice={item.price}
                lineTotal={item.price * item.quantity}
                currency={currency}
                quantity={item.quantity}
                onQuantityChange={(q) => updateQuantity(item.id, q)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
            <CartReassurance />
          </>
        )}
      </div>
      <PageSummary
        count={items.reduce((sum, i) => sum + i.quantity, 0)}
        totals={{ subtotal, serviceCharge: 0, discount: 0, fees: 0, total: subtotal }}
        currencyLabel={currency}
        ctaDisabled={items.length === 0}
        onCheckoutNavigate={onCheckoutNavigate}
        signInHint
      />
    </div>
  );
}

function ApiCartSection({
  items, totals, currency, onQuantityChange, onRemove, busy, layout, onCheckoutNavigate,
}: {
  items: CartItemResponse[];
  totals: TotalsSnapshot;
  currency: string;
  onQuantityChange: (itemId: string, qty: number, variantSelection?: Record<string, string>) => void;
  onRemove: (itemId: string) => void;
  busy: boolean;
  layout: CartContentLayout;
  onCheckoutNavigate?: () => void;
}) {
  if (layout === "drawer") {
    return (
      <>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-black/55">Your bag is empty.</p>
          ) : items.map((item) => {
            const unit = lineUnitPrice(item);
            const variantLine = item.variantSelection
              ? Object.entries(item.variantSelection).map(([k, v]) => `${k}: ${v}`).join(" · ")
              : undefined;
            return (
              <DrawerLineItem
                key={item.id}
                imageSrc={lineImage(item)}
                imageAlt={lineTitle(item)}
                brand={lineBrand(item)}
                title={lineTitle(item)}
                variantLine={variantLine}
                unitLabel={fmtMoney(unit, currency)}
                lineTotalLabel={fmtMoney(linePrice(item), currency)}
                quantity={item.quantity}
                onQuantityChange={(q) => onQuantityChange(item.id, q, item.variantSelection)}
                onRemove={() => onRemove(item.id)}
                disabled={busy}
              />
            );
          })}
        </div>
        <DrawerFooter
          totals={totals}
          currencyLabel={currency}
          ctaDisabled={items.length === 0}
          onCheckoutNavigate={onCheckoutNavigate}
        />
      </>
    );
  }

  /* Page layout */
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <div className="flex flex-col gap-4">
        {items.length === 0 ? (
          <EmptyBag />
        ) : (
          <>
            {items.map((item) => {
              const unit = lineUnitPrice(item);
              const variantLine = item.variantSelection
                ? Object.entries(item.variantSelection).map(([k, v]) => `${k}: ${v}`).join(" · ")
                : undefined;
              return (
                <PageItemCard
                  key={item.id}
                  imageSrc={lineImage(item)}
                  imageAlt={lineTitle(item)}
                  brand={lineBrand(item)}
                  title={lineTitle(item)}
                  variantLine={variantLine}
                  unitPrice={unit}
                  lineTotal={linePrice(item)}
                  currency={currency}
                  quantity={item.quantity}
                  onQuantityChange={(q) => onQuantityChange(item.id, q, item.variantSelection)}
                  onRemove={() => onRemove(item.id)}
                  disabled={busy}
                />
              );
            })}
            <CartReassurance />
          </>
        )}
      </div>
      <PageSummary
        count={items.reduce((sum, i) => sum + i.quantity, 0)}
        totals={totals}
        currencyLabel={currency}
        ctaDisabled={items.length === 0}
        onCheckoutNavigate={onCheckoutNavigate}
      />
    </div>
  );
}

function EmptyBag() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-shop-border bg-white py-20 text-center">
      <p className="text-base font-semibold text-shop-ink">Your bag is empty</p>
      <p className="mt-1 text-sm text-shop-muted">Browse the shop and add something you love.</p>
      <Link
        href="/shop"
        className="mt-5 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        style={{ background: "var(--shop-primary)" }}
      >
        Browse shop
      </Link>
    </div>
  );
}

/* ══════════════════════════════════════════
   PUBLIC EXPORT
══════════════════════════════════════════ */

export function CartPanelBody({
  layout = "page",
  onCheckoutNavigate,
}: {
  layout?: CartContentLayout;
  onCheckoutNavigate?: () => void;
}) {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { items: localItems, removeItem, updateQuantity, subtotal: localSubtotal } = useCart();

  const { data: apiCart, isLoading, isError, error, isFetching } = useGetCartQuery(undefined, { skip: !token });
  const [patchItem, { isLoading: isPatching }] = usePatchCartItemMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteCartItemMutation();

  const apiItems = apiCart?.items ?? [];
  const apiCurrency = apiCart?.currency ?? (apiItems[0] ? lineCurrency(apiItems[0]) : "USD");
  const apiSubtotal    = coerceNumber(apiCart?.subtotal,      apiItems.reduce((s, li) => s + linePrice(li), 0));
  const apiServiceCharge = coerceNumber(apiCart?.serviceCharge, 0);
  const apiDiscount    = coerceNumber(apiCart?.discount,      0);
  const apiFees        = coerceNumber(apiCart?.fees,          apiServiceCharge - apiDiscount);
  const apiTotal       = coerceNumber(apiCart?.total,         apiSubtotal + apiFees);

  if (!token) {
    return (
      <GuestCartSection
        items={localItems}
        removeItem={removeItem}
        updateQuantity={updateQuantity}
        subtotal={localSubtotal}
        layout={layout}
        onCheckoutNavigate={onCheckoutNavigate}
      />
    );
  }

  if (isLoading || isFetching) {
    return layout === "drawer" ? (
      <div className="flex flex-1 items-center justify-center p-8">
        <LoadingState label="Loading cart…" />
      </div>
    ) : <LoadingState label="Loading cart…" />;
  }

  if (isError) return <ErrorState error={error} title="Could not load cart" />;

  return (
    <ApiCartSection
      items={apiItems}
      totals={{ subtotal: apiSubtotal, serviceCharge: apiServiceCharge, discount: apiDiscount, fees: apiFees, total: apiTotal }}
      currency={apiCurrency}
      onQuantityChange={(itemId, qty, variantSelection) => patchItem({ itemId, quantity: qty, variantSelection })}
      onRemove={(itemId) => deleteItem(itemId)}
      busy={isPatching || isDeleting}
      layout={layout}
      onCheckoutNavigate={onCheckoutNavigate}
    />
  );
}
