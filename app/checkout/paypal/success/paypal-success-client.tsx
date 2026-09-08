"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, AlertCircle, Lock, ArrowRight } from "lucide-react";
import { InnerShell } from "@/components/layout/inner-shell";
import { useCapturePaypalMutation } from "@/store/routes/unified-commerce-api";
import { useAppSelector } from "@/store/hooks";
import { ErrorState } from "@/components/feedback/query-state";
import { getErrorMessage } from "@/lib/rtk-error";
import { isUuid } from "@/lib/uuid";

const PAYPAL_KEY = "uc_paypal_checkout";

type Stored = { orderId: string; paypalOrderId: string };

function readStored(): Stored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PAYPAL_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Stored;
    if (p?.orderId && p?.paypalOrderId) return p;
    return null;
  } catch {
    return null;
  }
}

export function PaypalSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useAppSelector((s) => s.auth.accessToken);
  const [capturePaypal, { isLoading }] = useCapturePaypalMutation();
  const [err, setErr] = useState<string | null>(null);
  const started = useRef(false);

  const orderIdParam = (searchParams.get("order_id") ?? "").trim();
  const orderId = orderIdParam && isUuid(orderIdParam) ? orderIdParam : null;

  const runCapture = useCallback(async () => {
    const stored = readStored();
    const oid = orderId ?? stored?.orderId;
    const paypalOrderId = stored?.paypalOrderId;
    if (!oid || !paypalOrderId) {
      setErr("We couldn't find your PayPal order. Please go back to checkout and try again.");
      return;
    }
    try {
      await capturePaypal({ orderId: oid, paypalOrderId }).unwrap();
      sessionStorage.removeItem(PAYPAL_KEY);
      router.replace(`/checkout/success?order_id=${oid}`);
    } catch (e) {
      setErr(getErrorMessage(e));
    }
  }, [orderId, capturePaypal, router]);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    void runCapture();
  }, [token, runCapture]);

  if (!token) {
    return (
      <InnerShell>
        <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center py-8 text-center">
          <div className="card w-full space-y-5 p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-8 ring-amber-50/50">
              <Lock className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold tracking-tight text-shop-ink">Sign in required</h1>
              <p className="text-sm text-shop-muted leading-relaxed">
                Sign in to verify and complete your PayPal payment confirmation.
              </p>
            </div>
            <Link className="btn-primary inline-flex items-center justify-center gap-2 w-full py-3" href="/auth/login">
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </InnerShell>
    );
  }

  if (isLoading && !err) {
    return (
      <InnerShell>
        <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center py-8 text-center">
          <div className="card w-full space-y-4 p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
              <RefreshCw className="h-7 w-7 animate-spin" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-shop-ink">Confirming PayPal payment…</h2>
              <p className="text-xs text-shop-muted">Please hold on while we capture your transaction</p>
            </div>
          </div>
        </div>
      </InnerShell>
    );
  }

  if (err) {
    return (
      <InnerShell>
        <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center py-8 text-center">
          <div className="card w-full space-y-5 p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-8 ring-red-50/50">
              <AlertCircle className="h-7 w-7" />
            </div>
            <ErrorState error={err} title="Payment not confirmed" />
            <Link className="btn-secondary inline-block w-full py-2.5" href="/checkout">
              Back to checkout
            </Link>
          </div>
        </div>
      </InnerShell>
    );
  }

  return (
    <InnerShell>
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center py-8 text-center">
        <div className="card w-full space-y-4 p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-shop-accent-soft text-shop-primary">
            <RefreshCw className="h-7 w-7 animate-spin" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-shop-ink">Finalizing order…</h2>
            <p className="text-xs text-shop-muted">Redirecting to order confirmation</p>
          </div>
        </div>
      </div>
    </InnerShell>
  );
}
