"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { useVerifyEmailMutation } from "@/store/routes/unified-commerce-api";
import { InnerShell } from "@/components/layout/inner-shell";
import { ErrorState, LoadingState, SuccessState } from "@/components/feedback/query-state";
import { getErrorMessage } from "@/lib/rtk-error";
import { useCart } from "@/context/cart-context";
import { mapCartItemsToLocalCart } from "@/lib/local-cart-payload";

export function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, clearCart } = useCart();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  const [verifyEmail, { isSuccess, isError, error }] = useVerifyEmailMutation();
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const missingToast = useRef(false);
  const finished = useRef(false);

  useEffect(() => {
    if (!token) {
      if (!missingToast.current) {
        missingToast.current = true;
        toast.error("This link doesn't look right. Please open the confirmation link from your email.");
      }
      return;
    }
    let cancelled = false;
    const id = window.setTimeout(() => {
      if (cancelled) return;
      const lines = mapCartItemsToLocalCart(itemsRef.current);
      verifyEmail({ token, ...(lines.length ? { localCart: lines } : {}) })
        .unwrap()
        .catch((err) => {
          if (!cancelled) toast.error(getErrorMessage(err));
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [token, verifyEmail]);

  useEffect(() => {
    if (!isSuccess || finished.current) return;
    finished.current = true;
    toast.success("Your email is verified. You’re signed in.");
    clearCart();
    router.replace("/");
  }, [isSuccess, clearCart, router]);

  const showLoading = Boolean(token && !isSuccess && !isError);

  return (
    <InnerShell>
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Verify email</h1>
          <p className="mt-2 text-sm text-black/70">Confirming your email address for your account.</p>
        </div>

        {!token ? (
          <div className="card space-y-4">
            <ErrorState
              error="Open the full link from your confirmation email. If you've already verified, you can sign in directly."
              title="Invalid link"
            />
            <Link href="/auth/login" className="btn-primary inline-block w-full text-center">
              Sign in
            </Link>
          </div>
        ) : showLoading ? (
          <div className="card space-y-4">
            <LoadingState label="Verifying your email…" />
          </div>
        ) : isSuccess ? (
          <div className="card space-y-4">
            <SuccessState message="Signed in. Redirecting…" />
          </div>
        ) : (
          <div className="card space-y-4">
            <ErrorState error={getErrorMessage(error)} title="Verification failed" />
            <p className="text-center text-sm text-black/70">
              The link may have expired. Request a new confirmation email from the check-inbox screen.
            </p>
            <Link href="/auth/check-email" className="btn-primary inline-block w-full text-center">
              Resend confirmation email
            </Link>
            <Link href="/auth/login" className="btn-secondary inline-block w-full text-center">
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </InnerShell>
  );
}
