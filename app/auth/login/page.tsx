"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
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

  const notVerified = isError ? getEmailNotVerifiedPayload(error) : null;

  useEffect(() => {
    if (isSuccess) {
      dispatch(unifiedCommerceApi.util.invalidateTags(["Me", "Cart"]));
      router.replace("/");
    }
  }, [isSuccess, dispatch, router]);

  useEffect(() => {
    if (!notVerified?.verificationEmailSent || verificationToastShown.current) return;
    verificationToastShown.current = true;
    toast.success("We sent another confirmation link to your inbox.");
  }, [notVerified?.verificationEmailSent]);

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
            <div className="space-y-3 rounded-lg border border-shop-accent/40 bg-shop-accent-soft p-4 text-sm text-shop-ink">
              <p className="font-medium">Verify your email</p>
              <p>{notVerified.message}</p>
              {notVerified.email ? (
                <button
                  type="button"
                  className="btn-secondary w-full"
                  onClick={onResend}
                  disabled={resendLoading}
                >
                  {resendLoading ? "Sending…" : "Resend confirmation email"}
                </button>
              ) : null}
              <p className="text-xs text-black/60">
                Wrong inbox? Use{" "}
                <Link href="/auth/check-email" className="font-medium text-shop-accent hover:underline">
                  check your email
                </Link>{" "}
                to enter your address.
              </p>
            </div>
          ) : null}
          {(isError || formError) && !notVerified ? (
            <ErrorState error={formError || error} title="Sign-in failed" />
          ) : null}

          <input className="input" name="email" type="email" autoComplete="email" placeholder="Email" required />
          <PasswordField
            name="password"
            autoComplete="current-password"
            placeholder="Password"
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
