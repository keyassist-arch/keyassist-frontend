"use client";

import { useEffect, useState, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Copy,
  Check,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";
import { InnerShell } from "@/components/layout/inner-shell";
import { useTrackOrderQuery } from "@/store/routes/unified-commerce-api";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorState } from "@/components/feedback/query-state";
import { TrackingSection } from "@/components/dashboard/tracking-section";
import type { OrderStatus } from "@/types/api";

const JOURNEY_STEPS: { status: OrderStatus; label: string; description: string }[] = [
  { status: "PENDING", label: "Order Placed", description: "Order received in system" },
  { status: "PAID", label: "Payment Confirmed", description: "Payment verified successfully" },
  { status: "PROCESSING", label: "Processing", description: "Preparing order at warehouse" },
  { status: "ORDERED_FROM_SUPPLIER", label: "Supplier Ordered", description: "Sourced from marketplace" },
  { status: "SHIPPED", label: "In Transit", description: "Handed over to carrier" },
  { status: "DELIVERED", label: "Delivered", description: "Package reached destination" },
];

const TERMINAL_STATUSES: OrderStatus[] = ["CANCELLED", "REFUNDED", "DISPUTED"];

function formatDateTime(iso?: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function TrackPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const queryOrderParam = useMemo(() => {
    const raw = searchParams.get("order") ?? searchParams.get("id") ?? searchParams.get("order_id") ?? "";
    return raw.trim();
  }, [searchParams]);

  const [searchCode, setSearchCode] = useState(queryOrderParam);
  const [activeCode, setActiveCode] = useState(queryOrderParam);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (queryOrderParam) {
      setSearchCode(queryOrderParam);
      setActiveCode(queryOrderParam);
    }
  }, [queryOrderParam]);

  const {
    data: order,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useTrackOrderQuery(activeCode, {
    skip: !activeCode,
    pollingInterval: activeCode ? 8000 : 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchCode.trim();
    if (!clean) {
      toast.error("Please enter an order ID or KAO reference");
      return;
    }
    setActiveCode(clean);
    startTransition(() => {
      router.replace(`/track?order=${encodeURIComponent(clean)}`);
    });
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Order reference copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy reference");
    }
  };

  const currentStatus = order?.status;
  const isTerminal = currentStatus && TERMINAL_STATUSES.includes(currentStatus);
  const currentStepIndex = currentStatus ? JOURNEY_STEPS.findIndex((s) => s.status === currentStatus) : -1;

  const displayRef = order ? order.orderNumber ? `#${order.orderNumber}` : order.id : "";

  return (
    <InnerShell>
      <div className="mx-auto max-w-3xl py-6 sm:py-12 space-y-8">
        
        {/* Header Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-shop-border bg-white px-3.5 py-1 text-xs font-semibold text-shop-ink shadow-xs">
            <Truck className="h-3.5 w-3.5 text-shop-primary" />
            Live Shipment Tracker
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-shop-ink">
            Track Your Order
          </h1>
          <p className="mx-auto max-w-lg text-sm text-shop-muted leading-relaxed">
            Enter your order reference code (e.g. <strong className="font-semibold text-shop-ink font-mono">KAO-8F29AD</strong>) or order ID to view real-time delivery status and updates.
          </p>
        </div>

        {/* Search Bar Card */}
        <div className="card shadow-sm p-4 sm:p-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-shop-muted" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Enter order reference (e.g. KAO-8F29AD or UUID)"
                className="input pl-11 pr-4 py-3 font-mono text-sm tracking-wide uppercase placeholder:normal-case placeholder:font-sans"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || isFetching}
              className="btn-primary inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-semibold cursor-pointer shrink-0 disabled:opacity-50"
            >
              {isFetching ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {isFetching ? "Tracking…" : "Track Order"}
            </button>
          </form>

          {/* Quick Helper / Suggestion */}
          {!activeCode && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-shop-muted">
              <span>Tip: You can find your reference code in your order confirmation email or receipt.</span>
            </div>
          )}
        </div>

        {/* Loading Spinner */}
        {isLoading && !order && (
          <div className="card text-center py-16 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-shop-accent-soft text-shop-primary">
              <RefreshCw className="h-7 w-7 animate-spin" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-shop-ink">Locating your order…</h2>
              <p className="text-xs text-shop-muted">Fetching latest courier and fulfillment checkpoints</p>
            </div>
          </div>
        )}

        {/* Error / Not Found */}
        {isError && (
          <div className="card p-6 sm:p-8 space-y-5 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-8 ring-red-50/50">
              <AlertCircle className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-shop-ink">Order Not Found</h2>
              <p className="mx-auto max-w-md text-sm text-shop-muted leading-relaxed">
                We couldn&apos;t find an order with reference &quot;<strong className="font-mono text-shop-ink">{activeCode}</strong>&quot;. Please check the code in your confirmation email or receipt and try again.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSearchCode("");
                  setActiveCode("");
                  router.replace("/track");
                }}
                className="btn-secondary text-xs px-5 py-2.5 cursor-pointer"
              >
                Clear search
              </button>
              <Link href="/contact" className="btn-primary text-xs px-5 py-2.5">
                Contact Support
              </Link>
            </div>
          </div>
        )}

        {/* Order Details & Tracking Journey View */}
        {order && (
          <div className="space-y-6">
            
            {/* Top Status Header Card */}
            <div className="card p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-shop-border pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-shop-muted">
                      Order Reference
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono text-xl sm:text-2xl font-bold text-shop-ink tracking-tight">
                      {displayRef}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(order.orderNumber || order.id)}
                      title="Copy Reference Code"
                      className="inline-flex items-center rounded-lg p-1.5 text-shop-muted hover:bg-black/5 hover:text-shop-ink transition cursor-pointer"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-1.5">
                  <StatusBadge status={order.status} />
                  {order.createdAt && (
                    <span className="text-xs text-shop-muted">
                      Placed on {formatDateTime(order.createdAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Destination & Carrier Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3 rounded-xl bg-(--background) p-4">
                  <MapPin className="h-5 w-5 text-shop-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-shop-muted">Destination</p>
                    <p className="font-medium text-shop-ink mt-0.5">
                      {[order.destinationCity, order.destinationCountry].filter(Boolean).join(", ") || "Registered Delivery Address"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-(--background) p-4">
                  <Truck className="h-5 w-5 text-shop-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-shop-muted">Carrier &amp; Tracking</p>
                    {order.trackingNumber ? (
                      <p className="font-mono font-medium text-shop-ink mt-0.5">
                        {order.carrier ? `${order.carrier}: ` : ""}{order.trackingNumber}
                      </p>
                    ) : (
                      <p className="text-xs text-shop-muted mt-0.5">Assigned upon dispatch</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Journey Stepper */}
              <div className="space-y-4 pt-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-shop-muted">
                  Fulfilment Progress
                </h2>

                {isTerminal ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900">
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                    <div className="text-xs">
                      <p className="font-semibold">Order status: {order.status}</p>
                      <p className="text-red-700 mt-0.5">This order is no longer in active transit.</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto pb-2">
                    <div className="flex min-w-[560px] items-center justify-between">
                      {JOURNEY_STEPS.map((step, idx) => {
                        const isDone = currentStepIndex >= idx;
                        const isCurrent = currentStepIndex === idx;

                        return (
                          <div key={step.status} className="flex flex-1 items-center last:flex-none">
                            <div className="flex flex-col items-center text-center gap-1.5 min-w-[80px]">
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition ${
                                  isDone
                                    ? isCurrent
                                      ? "bg-shop-primary text-white ring-4 ring-emerald-100 shadow-sm"
                                      : "bg-shop-primary text-white"
                                    : "border-2 border-shop-border bg-white text-shop-muted"
                                }`}
                              >
                                {isDone && !isCurrent ? (
                                  <Check className="h-4 w-4 stroke-[3]" />
                                ) : isCurrent ? (
                                  <Clock className="h-4 w-4" />
                                ) : (
                                  <span>{idx + 1}</span>
                                )}
                              </div>
                              <span
                                className={`text-[11px] leading-tight ${
                                  isDone ? "font-bold text-shop-ink" : "font-medium text-shop-muted"
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>

                            {idx < JOURNEY_STEPS.length - 1 && (
                              <div
                                className={`mb-5 h-1 flex-1 mx-1 rounded-full transition ${
                                  currentStepIndex > idx ? "bg-shop-primary" : "bg-shop-border"
                                }`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Checkpoint Timeline */}
            <div className="card p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-shop-border pb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-shop-primary" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-shop-ink">
                    Activity &amp; Checkpoints
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="inline-flex items-center gap-1.5 text-xs text-shop-muted hover:text-shop-ink transition cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </button>
              </div>

              <TrackingSection tracking={order.tracking} />
            </div>

            {/* Package Contents Preview */}
            <div className="card overflow-hidden">
              <div className="border-b border-shop-border bg-(--background)/50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-shop-ink">
                  <Package className="h-4 w-4 text-shop-muted" />
                  Package Contents ({order.itemCount} item{order.itemCount !== 1 ? "s" : ""})
                </div>
              </div>

              <ul className="divide-y divide-shop-border">
                {order.items.map((item, idx) => (
                  <li key={`${item.title}-${idx}`} className="flex items-center gap-4 p-4 sm:p-5">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-shop-border bg-(--background)">
                      {item.images?.[0] ? (
                        <Image
                          src={item.images[0]}
                          alt={item.title}
                          fill
                          className="object-contain p-1"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-shop-muted/40">
                          <Package className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-sm font-medium text-shop-ink line-clamp-2 leading-snug">
                        {item.title}
                      </p>
                      <p className="text-xs text-shop-muted">
                        Quantity: <span className="font-semibold text-shop-ink">{item.quantity}</span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Helpful Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSearchCode("");
                  setActiveCode("");
                  router.replace("/track");
                }}
                className="text-xs font-semibold text-shop-muted hover:text-shop-ink transition cursor-pointer"
              >
                ← Track a different order
              </button>

              <div className="flex items-center gap-3">
                <Link href="/contact" className="inline-flex items-center gap-1.5 text-xs text-shop-muted hover:text-shop-ink transition">
                  <HelpCircle className="h-3.5 w-3.5" />
                  Need help?
                </Link>
                <Link href="/" className="btn-secondary text-xs px-5 py-2">
                  <ShoppingBag className="h-3.5 w-3.5 text-shop-muted mr-1" />
                  Shop More
                </Link>
              </div>
            </div>

          </div>
        )}

      </div>
    </InnerShell>
  );
}
