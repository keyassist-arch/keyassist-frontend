"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { InnerShell } from "@/components/layout/inner-shell";
import { useCapturePaypalMutation } from "@/store/routes/unified-commerce-api";
import { useAppSelector } from "@/store/hooks";
import { ErrorState, LoadingState } from "@/components/feedback/query-state";
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
        <div className="card max-w-lg space-y-3">
          <h1 className="text-lg font-semibold">Sign in required</h1>
          <p className="text-sm text-black/70">Sign in to complete your PayPal payment.</p>
          <Link className="btn-primary inline-block" href="/auth/login">
            Sign in
          </Link>
        </div>
      </InnerShell>
    );
  }

  if (isLoading && !err) {
    return (
      <InnerShell>
        <LoadingState label="Confirming PayPal payment…" />
      </InnerShell>
    );
  }

  if (err) {
    return (
      <InnerShell>
        <div className="card max-w-lg space-y-4">
          <ErrorState error={err} title="Payment not confirmed" />
          <Link className="btn-secondary inline-block" href="/checkout">
            Back to checkout
          </Link>
        </div>
      </InnerShell>
    );
  }

  return (
    <InnerShell>
      <LoadingState label="Redirecting…" />
    </InnerShell>
  );
}
