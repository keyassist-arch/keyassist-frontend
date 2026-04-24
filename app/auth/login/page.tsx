"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useLogin2faMutation, useLoginMutation, useResendVerificationMutation } from "@/store/routes/unified-commerce-api";
import { useAppDispatch } from "@/store/hooks";
import { unifiedCommerceApi } from "@/store/routes/unified-commerce-api";
import { InnerShell } from "@/components/layout/inner-shell";
import { ErrorState, LoadingState, SuccessState } from "@/components/feedback/query-state";
import { PasswordField } from "@/components/ui/password-field";
import { useCart } from "@/context/cart-context";
import { mapCartItemsToLocalCart } from "@/lib/local-cart-payload";
import { getEmailNotVerifiedPayload, getErrorMessage } from "@/lib/rtk-error";
import { isTokenLoginResult, isTwoFactorRequiredResult, normalizeTotpCode } from "@/lib/auth-login-guards";
import type { LocalCartLine } from "@/types/api";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items } = useCart();
  const [login, { isLoading, isError, error, isSuccess, data: loginData }] = useLoginMutation();
  const [login2fa, { isLoading: loading2fa, isError: err2fa, error: error2fa, isSuccess: success2fa }] =
    useLogin2faMutation();
  const [resend, { isLoading: resendLoading }] = useResendVerificationMutation();
  const [formError, setFormError] = useState("");
  const verificationToastShown = useRef(false);
  const [resendReadyIn, setResendReadyIn] = useState(0);

  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const preAuthTokenRef = useRef<string | null>(null);
  const emailRef = useRef("");
  const localLinesRef = useRef<LocalCartLine[]>([]);

  const notVerified = isError ? getEmailNotVerifiedPayload(error) : null;
  const notVerifiedKey = notVerified ? `${notVerified.email ?? ""}:${notVerified.message}` : null;

  useEffect(() => {
    if (!twoFactorStep && isSuccess && isTokenLoginResult(loginData)) {
      dispatch(unifiedCommerceApi.util.invalidateTags(["Me", "Cart"]));
      router.replace("/");
    }
  }, [twoFactorStep, isSuccess, loginData, dispatch, router]);

  useEffect(() => {
    if (twoFactorStep && success2fa) {
      dispatch(unifiedCommerceApi.util.invalidateTags(["Me", "Cart"]));
      router.replace("/");
    }
  }, [twoFactorStep, success2fa, dispatch, router]);

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

  const onSubmitPassword = async (e: FormEvent<HTMLFormElement>) => {
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
    localLinesRef.current = lines;
    emailRef.current = email;
    try {
      const data = await login({
        email,
        password,
        ...(lines.length ? { localCart: lines } : {}),
      }).unwrap();

      if (isTwoFactorRequiredResult(data)) {
        preAuthTokenRef.current = data.preAuthToken;
        setTwoFactorStep(true);
        return;
      }
      if (isTokenLoginResult(data)) {
        /* credentials + redirect handled by effects */
        return;
      }
      setFormError("Unexpected response from server.");
    } catch {
      /* RTK error surfaced via isError */
    }
  };

  const onSubmitTotp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    const fd = new FormData(e.currentTarget);
    const raw = String(fd.get("code") ?? "");
    const code = normalizeTotpCode(raw);
    if (!code || code.length < 6) {
      setFormError("Enter the 6–8 digit code from your authenticator app.");
      return;
    }
    const pre = preAuthTokenRef.current;
    if (!pre) {
      setFormError("Your sign-in session expired. Enter your password again.");
      setTwoFactorStep(false);
      return;
    }
    const lines = localLinesRef.current;
    try {
      await login2fa({
        preAuthToken: pre,
        code,
        ...(lines.length ? { localCart: lines } : {}),
      }).unwrap();
    } catch {
      /* surfaced below */
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

  const busy = isLoading || loading2fa;
  const showPasswordError = (isError || formError) && !notVerified && !twoFactorStep;
  const showTotpError = twoFactorStep && (err2fa || formError);

  return (
    <InnerShell>
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="mt-2 text-sm text-black/70">Welcome back. Sign in to use your saved cart and track orders.</p>
        </div>

        {twoFactorStep ? (
          <form className="card space-y-4" onSubmit={onSubmitTotp}>
            {loading2fa ? <LoadingState label="Verifying code…" /> : null}
            {success2fa ? <SuccessState message="Signed in. Redirecting…" /> : null}
            {showTotpError ? <ErrorState error={formError || error2fa} title="Verification failed" /> : null}
            <p className="text-sm text-black/70">
              Enter the code from your authenticator app for <span className="font-medium">{emailRef.current}</span>.
            </p>
            <label className="block space-y-1 text-sm">
              <span className="text-black/70">Authenticator code</span>
              <input
                className="input w-full font-mono tabular-nums tracking-widest"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                required
                autoFocus
              />
            </label>
            <button className="btn-primary w-full" type="submit" disabled={busy}>
              {loading2fa ? "Verifying…" : "Continue"}
            </button>
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => {
                setTwoFactorStep(false);
                preAuthTokenRef.current = null;
                setFormError("");
              }}
            >
              Back to password
            </button>
          </form>
        ) : (
          <form className="card space-y-4" onSubmit={onSubmitPassword}>
            {isLoading ? <LoadingState label="Signing in…" /> : null}
            {isSuccess && isTokenLoginResult(loginData) ? <SuccessState message="Signed in. Redirecting…" /> : null}
            {notVerified ? (
              <div className="space-y-3 rounded-lg border border-black/10 bg-black/2 p-4 text-sm text-black/80">
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
            {showPasswordError ? <ErrorState error={formError || error} title="Sign-in failed" /> : null}

            <label className="block space-y-1 text-sm">
              <span className="text-black/70">Email</span>
              <input
                className="input w-full"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                defaultValue={emailRef.current}
              />
            </label>
            <PasswordField
              label="Password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              required
            />
            <button className="btn-primary w-full" type="submit" disabled={busy}>
              {isLoading ? "Signing in…" : "Sign in"}
            </button>
            <p className="text-center text-sm">
              <Link href="/auth/forgot-password" className="font-medium text-shop-accent hover:underline">
                Forgot password?
              </Link>
            </p>
          </form>
        )}

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
