"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Trash2 } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useAppSelector } from "@/store/hooks";
import {
  useDeleteCartItemMutation,
  useGetCartQuery,
  usePatchCartItemMutation,
} from "@/store/routes/unified-commerce-api";
import type { ApiProduct, CartItemResponse } from "@/types/api";
import { ErrorState, LoadingState } from "@/components/feedback/query-state";
import { coerceNumber } from "@/lib/coerce-number";
import { ProductQuantityStepper } from "@/components/product/product-quantity-stepper";

function lineUnitPrice(item: CartItemResponse): number {
  const p = item.product;
  if (p && "title" in p) {
    const prod = p as ApiProduct;
    return coerceNumber(prod.salePrice ?? prod.originalPrice ?? 0, 0);
  }
  return 0;
}

function linePrice(item: CartItemResponse): number {
  return lineUnitPrice(item) * item.quantity;
}

function lineTitle(item: CartItemResponse): string {
  const p = item.product;
  if (p && "title" in p) return (p as ApiProduct).title;
  return "Product";
}

function lineCurrency(item: CartItemResponse): string {
  const p = item.product;
  if (p && "currency" in p) return (p as ApiProduct).currency ?? "USD";
  return "USD";
}

function lineImage(item: CartItemResponse): string {
  const p = item.product;
  if (p && "images" in p) {
    const imgs = (p as ApiProduct).images;
    if (imgs?.length) return imgs[0]!;
  }
  return "/file.svg";
}

function lineBrand(item: CartItemResponse): string {
  const p = item.product;
  if (p && "brand" in p) {
    const b = (p as ApiProduct).brand?.trim();
    if (b) return b;
  }
  return "Store";
}

export type CartContentLayout = "page" | "drawer";

function DrawerLineItem({
  imageSrc,
  imageAlt,
  brand,
  title,
  variantLine,
  unitLabel,
  lineTotalLabel,
  quantity,
  onQuantityChange,
  onRemove,
  maxQty,
  disabled,
}: {
  imageSrc: string;
  imageAlt: string;
  brand: string;
  title: string;
  variantLine?: string;
  unitLabel: string;
  lineTotalLabel: string;
  quantity: number;
  onQuantityChange: (q: number) => void;
  onRemove: () => void;
  maxQty?: number;
  disabled?: boolean;
}) {
  return (
    <article className="border-b border-black/10 py-4 last:border-b-0">
      <div className="grid grid-cols-[4rem_1fr_minmax(4rem,auto)] gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-black/10 bg-neutral-100">
          <Image src={imageSrc} alt={imageAlt} fill className="object-cover" sizes="64px" unoptimized />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-black/50">{brand}</p>
          <h3 className="mt-0.5 text-sm font-medium leading-snug text-shop-ink">{title}</h3>
          {variantLine ? <p className="mt-1 text-xs text-black/50">{variantLine}</p> : null}
          <p className="mt-1 text-xs text-black/50 tabular-nums">{unitLabel}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ProductQuantityStepper
              value={quantity}
              onChange={onQuantityChange}
              min={1}
              max={maxQty}
              disabled={disabled}
            />
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center bg-black text-white transition hover:bg-black/85 disabled:opacity-40"
              aria-label="Remove item"
            >
              <Trash2 size={18} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>
        <p className="text-right text-sm font-semibold tabular-nums text-shop-ink">{lineTotalLabel}</p>
      </div>
    </article>
  );
}

function formatDrawerSubtotal(amount: number, currency: string) {
  if (currency === "USD") return `$${amount.toFixed(2)} USD`;
  return `${currency} ${amount.toFixed(2)}`;
}

function DrawerFooter({
  subtotal,
  currencyLabel,
  ctaDisabled,
  onCheckoutNavigate,
  signInHint,
}: {
  subtotal: number;
  currencyLabel: string;
  ctaDisabled: boolean;
  onCheckoutNavigate?: () => void;
  signInHint?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="shrink-0 border-t border-black/10 bg-white px-4 py-4">
      {signInHint ? (
        <p className="mb-3 text-center text-xs text-black/55">
          <Link href="/auth/login" className="font-medium text-shop-accent underline hover:no-underline">
            Sign in
          </Link>{" "}
          to sync your cart across devices
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-2 text-left text-sm font-medium text-shop-ink"
      >
        Order special instructions
        <ChevronDown
          size={14}
          className={`shrink-0 text-black/45 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
          aria-hidden
        />
      </button>
      {open ? (
        <textarea
          className="input mt-1 min-h-[5.5rem] resize-y text-shop-ink"
          rows={3}
          placeholder="Gift message, delivery notes…"
          aria-label="Order special instructions"
        />
      ) : null}

      <div className="mt-4 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-shop-ink">Subtotal</span>
        <span className="text-sm font-bold tabular-nums text-shop-ink">{formatDrawerSubtotal(subtotal, currencyLabel)}</span>
      </div>
      <p className="mt-2 text-xs text-black/50">Taxes and shipping calculated at checkout</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href="/cart"
          onClick={onCheckoutNavigate}
          className="rounded-none border border-black bg-black py-3 text-center text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-black/90"
        >
          View cart
        </Link>
        <Link
          href="/checkout"
          aria-disabled={ctaDisabled}
          className={`rounded-none border border-black py-3 text-center text-xs font-semibold uppercase tracking-wide transition ${
            ctaDisabled
              ? "cursor-not-allowed border-black/20 bg-black/30 text-white/80"
              : "bg-black text-white hover:bg-black/90"
          }`}
          onClick={(e) => {
            if (ctaDisabled) e.preventDefault();
            else onCheckoutNavigate?.();
          }}
        >
          Check out
        </Link>
      </div>
    </div>
  );
}

export function CartPanelBody({
  layout = "page",
  onCheckoutNavigate,
}: {
  layout?: CartContentLayout;
  onCheckoutNavigate?: () => void;
}) {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { items: localItems, removeItem, updateQuantity, subtotal: localSubtotal } = useCart();

  const { data: apiCart, isLoading, isError, error, isFetching } = useGetCartQuery(undefined, {
    skip: !token,
  });
  const [patchItem, { isLoading: isPatching }] = usePatchCartItemMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteCartItemMutation();

  const apiItems = apiCart?.items ?? [];
  const apiSubtotal = apiItems.reduce((sum, li) => sum + linePrice(li), 0);
  const apiCurrency = apiItems[0] ? lineCurrency(apiItems[0]) : "USD";

  const gridClass =
    layout === "drawer" ? "flex min-h-0 flex-1 flex-col" : "grid gap-6 lg:grid-cols-[1.5fr_1fr]";

  return (
    <div className={layout === "drawer" ? "flex min-h-0 flex-1 flex-col" : "space-y-6"}>
      {!token ? (
        <div className={gridClass}>
          <GuestCartSection
            items={localItems}
            removeItem={removeItem}
            updateQuantity={updateQuantity}
            subtotal={localSubtotal}
            layout={layout}
            onCheckoutNavigate={onCheckoutNavigate}
          />
        </div>
      ) : (
        <>
          {(isLoading || isFetching) && layout !== "drawer" && <LoadingState label="Loading cart…" />}
          {(isLoading || isFetching) && layout === "drawer" && (
            <div className="flex flex-1 items-center justify-center p-8">
              <LoadingState label="Loading cart…" />
            </div>
          )}
          {isError && <ErrorState error={error} title="Could not load cart" />}
          {!isLoading && !isError && (
            <div className={gridClass}>
              <ApiCartSection
                items={apiItems}
                subtotal={apiSubtotal}
                currency={apiCurrency}
                onQuantityChange={(itemId, qty) => patchItem({ itemId, quantity: qty })}
                onRemove={(itemId) => deleteItem(itemId)}
                busy={isPatching || isDeleting}
                layout={layout}
                onCheckoutNavigate={onCheckoutNavigate}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GuestCartSection({
  items,
  removeItem,
  updateQuantity,
  subtotal,
  layout,
  onCheckoutNavigate,
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
            <p className="py-8 text-center text-sm text-black/55">Your cart is empty.</p>
          ) : (
            items.map((item) => {
              const variantLine = item.variant ? `${item.variant.name}: ${item.variant.value}` : undefined;
              const unit =
                currency === "USD" ? `$${item.price.toFixed(2)}` : `${currency} ${item.price.toFixed(2)}`;
              const lineTot =
                currency === "USD"
                  ? `$${(item.price * item.quantity).toFixed(2)}`
                  : `${currency} ${(item.price * item.quantity).toFixed(2)}`;
              return (
                <DrawerLineItem
                  key={item.id}
                  imageSrc={item.image}
                  imageAlt={item.title}
                  brand={String(item.marketplace)}
                  title={item.title}
                  variantLine={variantLine}
                  unitLabel={unit}
                  lineTotalLabel={lineTot}
                  quantity={item.quantity}
                  onQuantityChange={(q) => updateQuantity(item.id, q)}
                  onRemove={() => removeItem(item.id)}
                />
              );
            })
          )}
        </div>
        <DrawerFooter
          subtotal={subtotal}
          currencyLabel={currency}
          ctaDisabled={items.length === 0}
          onCheckoutNavigate={onCheckoutNavigate}
          signInHint
        />
      </>
    );
  }

  return (
    <>
      <section className="card space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Items</h2>
          <Link href="/auth/login" className="shrink-0 text-sm font-medium text-shop-accent hover:underline">
            Sign in to sync cart
          </Link>
        </div>
        <div className="mt-2 space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-black/60">Your cart is empty.</p>
          ) : (
            items.map((item) => (
              <article key={item.id} className="rounded-2xl border border-black/10 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate font-medium">{item.title}</h3>
                    <p className="mt-1 text-xs text-black/60">
                      {item.marketplace}
                      {item.variant ? ` — ${item.variant.name}: ${item.variant.value}` : ""}
                    </p>
                  </div>
                  <button className="btn-secondary w-fit shrink-0" type="button" onClick={() => removeItem(item.id)}>
                    Remove
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <input
                    className="input max-w-24"
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                  />
                  <p className="text-sm font-semibold tabular-nums">
                    {item.currency} {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
      <SummarySection
        count={items.length}
        subtotal={subtotal}
        currencyLabel={currency}
        ctaDisabled={items.length === 0}
        onCheckoutNavigate={onCheckoutNavigate}
      />
    </>
  );
}

function ApiCartSection({
  items,
  subtotal,
  currency,
  onQuantityChange,
  onRemove,
  busy,
  layout,
  onCheckoutNavigate,
}: {
  items: CartItemResponse[];
  subtotal: number;
  currency: string;
  onQuantityChange: (itemId: string, qty: number) => void;
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
            <p className="py-8 text-center text-sm text-black/55">Your cart is empty.</p>
          ) : (
            items.map((item) => {
              const unit = lineUnitPrice(item);
              const variantLine = item.variantSelection
                ? Object.entries(item.variantSelection)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" · ")
                : undefined;
              return (
                <DrawerLineItem
                  key={item.id}
                  imageSrc={lineImage(item)}
                  imageAlt={lineTitle(item)}
                  brand={lineBrand(item)}
                  title={lineTitle(item)}
                  variantLine={variantLine}
                  unitLabel={currency === "USD" ? `$${unit.toFixed(2)}` : `${currency} ${unit.toFixed(2)}`}
                  lineTotalLabel={
                    currency === "USD"
                      ? `$${linePrice(item).toFixed(2)}`
                      : `${currency} ${linePrice(item).toFixed(2)}`
                  }
                  quantity={item.quantity}
                  onQuantityChange={(q) => onQuantityChange(item.id, q)}
                  onRemove={() => onRemove(item.id)}
                  disabled={busy}
                />
              );
            })
          )}
        </div>
        <DrawerFooter
          subtotal={subtotal}
          currencyLabel={currency}
          ctaDisabled={items.length === 0}
          onCheckoutNavigate={onCheckoutNavigate}
        />
      </>
    );
  }

  return (
    <>
      <section className="card">
        <h2 className="text-lg font-semibold">Items</h2>
        <div className="mt-6 space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-black/60">Your cart is empty.</p>
          ) : (
            items.map((item) => (
              <article key={item.id} className="rounded-2xl border border-black/10 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate font-medium">{lineTitle(item)}</h3>
                    {item.variantSelection ? (
                      <p className="mt-1 text-xs text-black/60">
                        {Object.entries(item.variantSelection)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" · ")}
                      </p>
                    ) : null}
                  </div>
                  <button
                    className="btn-secondary w-fit shrink-0"
                    type="button"
                    disabled={busy}
                    onClick={() => onRemove(item.id)}
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <input
                    className="input max-w-24"
                    type="number"
                    min={0}
                    value={item.quantity}
                    disabled={busy}
                    onChange={(e) => onQuantityChange(item.id, Number(e.target.value))}
                  />
                  <p className="text-sm font-semibold tabular-nums">
                    {currency} {linePrice(item).toFixed(2)}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
      <SummarySection
        count={items.length}
        subtotal={subtotal}
        currencyLabel={currency}
        ctaDisabled={items.length === 0}
        onCheckoutNavigate={onCheckoutNavigate}
      />
    </>
  );
}

function SummarySection({
  count,
  subtotal,
  currencyLabel,
  ctaDisabled,
  onCheckoutNavigate,
}: {
  count: number;
  subtotal: number;
  currencyLabel: string;
  ctaDisabled: boolean;
  onCheckoutNavigate?: () => void;
}) {
  const shipping = 8;
  return (
    <section className="card h-fit">
      <h2 className="text-lg font-semibold">Order summary</h2>
      <p className="mt-3 text-sm text-black/70">{count} items</p>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span>Subtotal</span>
          <span className="font-medium tabular-nums">
            {currencyLabel} {subtotal.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>Estimated shipping</span>
          <span className="font-medium tabular-nums">USD {shipping.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-black/10 pt-2 text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">
            {currencyLabel} {(subtotal + shipping).toFixed(2)}
          </span>
        </div>
      </div>
      <Link
        className="btn-primary mt-5 inline-block w-full text-center disabled:pointer-events-none disabled:opacity-50"
        href="/checkout"
        aria-disabled={ctaDisabled}
        onClick={onCheckoutNavigate}
      >
        Proceed to checkout
      </Link>
    </section>
  );
}
