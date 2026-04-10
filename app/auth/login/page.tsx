"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useLoginMutation, useResendVerificationMutation } from "@/store/routes/unified-commerce-api";
import { useAppDispatch } from "@/store/hooks";
import { unifiedCommerceApi } from "@/store/routes/unified-commerce-api";
import { InnerShell } from "@/components/layout/inner-shell";
import { ErrorState, LoadingState, SuccessState } from "@/components/feedback/query-state";
import { PasswordField } from "@/components/ui/password-field";
import { useCart } from "@/context/cart-context";
import { mapCartItemsToLocalCart } from "@/lib/local-cart-payload";
import { getEmailNotVerifiedPayload, getErrorMessage } from "@/lib/rtk-error";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items } = useCart();
  const [login, { isLoading, isError, error, isSuccess }] = useLoginMutation();
  const [resend, { isLoading: resendLoading }] = useResendVerificationMutation();
  const [formError, setFormError] = useState("");
  const verificationToastShown = useRef(false);
  const [resendReadyIn, setResendReadyIn] = useState(0);

  const notVerified = isError ? getEmailNotVerifiedPayload(error) : null;
  const notVerifiedKey = notVerified ? `${notVerified.email ?? ""}:${notVerified.message}` : null;

  useEffect(() => {
    if (isSuccess) {
      dispatch(unifiedCommerceApi.util.invalidateTags(["Me", "Cart"]));
      router.replace("/");
    }
  }, [isSuccess, dispatch, router]);

  useEffect(() => {
    if (!notVerified?.verificationEmailSent || verificationToastShown.current) return;
    verificationToastShown.current = true;
    toast.success("Check your inbox—we sent a confirmation link.");
  }, [notVerified?.verificationEmailSent]);

  useLayoutEffect(() => {
    if (!notVerifiedKey) {
      setResendReadyIn(0);
      return;
    }
    setResendReadyIn(60);
  }, [notVerifiedKey]);

  useEffect(() => {
    if (!notVerifiedKey) return;
    const id = window.setInterval(() => {
      setResendReadyIn((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [notVerifiedKey]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    if (!email || !password) {
      setFormError("Email and password are required.");
      return;
    }
    const lines = mapCartItemsToLocalCart(items);
    try {
      await login({
        email,
        password,
        ...(lines.length ? { localCart: lines } : {}),
      }).unwrap();
    } catch {
      /* RTK error surfaced via isError */
    }
  };

  const onResend = async () => {
    const email = notVerified?.email;
    if (!email) return;
    try {
      const data = await resend({ email }).unwrap();
      toast.success(data.message);
      setResendReadyIn(60);
    } catch (err) {
      const msg = getErrorMessage(err);
      if ((err as { status?: number }).status === 429) {
        toast.error("Too many attempts. Try again in a minute.");
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <InnerShell>
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="mt-2 text-sm text-black/70">Welcome back. Sign in to use your saved cart and track orders.</p>
        </div>

        <form className="card space-y-4" onSubmit={onSubmit}>
          {isLoading ? <LoadingState label="Signing in…" /> : null}
          {isSuccess ? <SuccessState message="Signed in. Redirecting…" /> : null}
          {notVerified ? (
            <div className="space-y-3 rounded-lg border border-black/10 bg-black/[0.02] p-4 text-sm text-black/80">
              <p className="font-medium text-shop-ink">Verify your email to sign in</p>
              <p className="leading-relaxed">{notVerified.message}</p>
              {notVerified.email ? (
                <p className="text-xs text-black/55">
                  {resendReadyIn > 0 ? (
                    <>
                      Optional: request another link in{" "}
                      <span className="tabular-nums font-medium text-shop-ink">
                        {Math.floor(resendReadyIn / 60)}:{String(resendReadyIn % 60).padStart(2, "0")}
                      </span>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="text-shop-accent underline decoration-shop-accent/40 underline-offset-2 transition hover:decoration-shop-accent disabled:opacity-50"
                      onClick={onResend}
                      disabled={resendLoading}
                    >
                      {resendLoading ? "Sending…" : "Send another confirmation email"}
                    </button>
                  )}
                </p>
              ) : null}
              <p className="text-xs text-black/50">
                Wrong address?{" "}
                <Link href="/auth/check-email" className="text-shop-accent hover:underline">
                  Open the check-email page
                </Link>{" "}
                to enter your email.
              </p>
            </div>
          ) : null}
          {(isError || formError) && !notVerified ? (
            <ErrorState error={formError || error} title="Sign-in failed" />
          ) : null}

          <label className="block space-y-1 text-sm">
            <span className="text-black/70">Email</span>
            <input
              className="input w-full"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </label>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />
          <button className="btn-primary w-full" type="submit" disabled={isLoading}>
            {isLoading ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-center text-sm">
            <Link href="/auth/forgot-password" className="font-medium text-shop-accent hover:underline">
              Forgot password?
            </Link>
          </p>
        </form>

        <p className="text-center text-sm text-black/70">
          No account?{" "}
          <Link href="/auth/register" className="font-medium text-shop-accent hover:underline">
            Register
          </Link>
        </p>
      </div>
    </InnerShell>
  );
}
