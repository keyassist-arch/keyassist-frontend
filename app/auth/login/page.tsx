"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useLayoutEffect, useRef, useState, Suspense } from "react";
import { ArrowLeft, Fingerprint } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { registerUrl } from "@/lib/auth-redirect";
import { passkeyPref } from "@/lib/passkey-pref";
import toast from "react-hot-toast";
import {
  useLogin2faMutation,
  useLoginMutation,
  usePasskeyLoginFinishMutation,
  usePasskeyLoginStartMutation,
  useResendVerificationMutation,
} from "@/store/routes/unified-commerce-api";
import { useAppDispatch } from "@/store/hooks";
import { unifiedCommerceApi } from "@/store/routes/unified-commerce-api";
import { useCart } from "@/context/cart-context";
import { mapCartItemsToLocalCart } from "@/lib/local-cart-payload";
import {
  getEmailNotVerifiedPayload,
  getErrorMessage,
} from "@/lib/rtk-error";
import {
  isTokenLoginResult,
  isTwoFactorRequiredResult,
  normalizeTotpCode,
} from "@/lib/auth-login-guards";
import type { LocalCartLine } from "@/types/api";
import {
  AuthShell,
  AuthInput,
  AuthPasswordInput,
  AuthButton,
  AuthGhostButton,
} from "@/components/auth/auth-shell";

type Step = "email" | "password" | "totp";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const dispatch = useAppDispatch();
  const { items } = useCart();

  const [login, { isLoading, isError, error, isSuccess, data: loginData }] =
    useLoginMutation();
  const [login2fa, { isLoading: loading2fa, isError: err2fa, error: error2fa, isSuccess: success2fa }] =
    useLogin2faMutation();
  const [resend, { isLoading: resendLoading }] = useResendVerificationMutation();
  const [passkeyStart] = usePasskeyLoginStartMutation();
  const [passkeyFinish] = usePasskeyLoginFinishMutation();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [resendReadyIn, setResendReadyIn] = useState(0);
  const [passkeyAvailable] = useState(() => passkeyPref.get());

  const preAuthTokenRef = useRef<string | null>(null);
  const localLinesRef = useRef<LocalCartLine[]>([]);
  const verificationToastShown = useRef(false);

  const notVerified = isError ? getEmailNotVerifiedPayload(error) : null;
  const notVerifiedKey = notVerified ? `${notVerified.email ?? ""}:${notVerified.message}` : null;

  useEffect(() => {
    if (step === "password" && isSuccess && isTokenLoginResult(loginData)) {
      dispatch(unifiedCommerceApi.util.invalidateTags(["Me", "Cart"]));
      router.replace(redirect);
    }
  }, [step, isSuccess, loginData, dispatch, router]);

  useEffect(() => {
    if (step === "totp" && success2fa) {
      dispatch(unifiedCommerceApi.util.invalidateTags(["Me", "Cart"]));
      router.replace(redirect);
    }
  }, [step, success2fa, dispatch, router]);

  useEffect(() => {
    if (!notVerified?.verificationEmailSent || verificationToastShown.current) return;
    verificationToastShown.current = true;
    toast.success("Check your inbox — we sent a confirmation link.");
  }, [notVerified?.verificationEmailSent]);

  useLayoutEffect(() => {
    if (!notVerifiedKey) { setResendReadyIn(0); return; }
    setResendReadyIn(60);
  }, [notVerifiedKey]);

  useEffect(() => {
    if (!notVerifiedKey) return;
    const id = window.setInterval(() => setResendReadyIn((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [notVerifiedKey]);

  const onContinueEmail = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const val = String(fd.get("email") ?? "").trim();
    if (!val) { setFormError("Please enter your email."); return; }
    setEmail(val);
    setFormError("");
    setStep("password");
  };

  const onSubmitPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    if (!password) { setFormError("Password is required."); return; }
    const lines = mapCartItemsToLocalCart(items);
    localLinesRef.current = lines;
    try {
      const data = await login({
        email,
        password,
        ...(lines.length ? { localCart: lines } : {}),
      }).unwrap();
      if (isTwoFactorRequiredResult(data)) {
        preAuthTokenRef.current = data.preAuthToken;
        setStep("totp");
        return;
      }
    } catch {
      /* surfaced via isError */
    }
  };

  const onSubmitTotp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    const fd = new FormData(e.currentTarget);
    const code = normalizeTotpCode(String(fd.get("code") ?? ""));
    if (!code || code.length < 6) {
      setFormError("Enter the 6–8 digit code from your authenticator app.");
      return;
    }
    const pre = preAuthTokenRef.current;
    if (!pre) {
      setFormError("Session expired. Please sign in again.");
      setStep("email");
      return;
    }
    const lines = localLinesRef.current;
    try {
      await login2fa({
        preAuthToken: pre,
        code,
        ...(lines.length ? { localCart: lines } : {}),
      }).unwrap();
    } catch { /* surfaced via err2fa */ }
  };

  const onPasskeyLogin = useCallback(async (useBrowserAutofill = false) => {
    if (!useBrowserAutofill) setPasskeyLoading(true);
    setFormError("");
    try {
      const { startAuthentication } = await import("@simplewebauthn/browser");
      const options = await passkeyStart().unwrap();
      const authResponse = await startAuthentication({ optionsJSON: options, useBrowserAutofill });
      await passkeyFinish(authResponse).unwrap();
      dispatch(unifiedCommerceApi.util.invalidateTags(["Me", "Cart"]));
      router.replace(redirect);
    } catch (err: unknown) {
      if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "AbortError")) {
        // User cancelled or autofill was superseded by the manual button — silent
      } else if (!useBrowserAutofill) {
        setFormError(getErrorMessage(err));
      }
    } finally {
      if (!useBrowserAutofill) setPasskeyLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirect]);

  // Kick off conditional UI (passkey autofill) silently when the email step mounts
  useEffect(() => {
    if (step !== "email" || !passkeyAvailable) return;
    let cancelled = false;
    (async () => {
      const { browserSupportsWebAuthnAutofill } = await import("@simplewebauthn/browser");
      if (cancelled || !(await browserSupportsWebAuthnAutofill())) return;
      void onPasskeyLogin(true);
    })();
    return () => { cancelled = true; };
  }, [step, passkeyAvailable, onPasskeyLogin]);

  const onResend = async () => {
    const addr = notVerified?.email;
    if (!addr) return;
    try {
      const data = await resend({ email: addr }).unwrap();
      toast.success(data.message);
      setResendReadyIn(60);
    } catch (err) {
      toast.error(
        (err as { status?: number }).status === 429
          ? "Too many attempts. Try again in a minute."
          : getErrorMessage(err),
      );
    }
  };

  const busy = isLoading || loading2fa;

  /* ── Step: email ── */
  if (step === "email") {
    return (
      <AuthShell
        heading="Sign in to save your favorites"
        subAction={
          <>
            Or{" "}
            <Link href={registerUrl(redirect)} className="font-medium text-[#5C4AE6] hover:underline">
              create an account
            </Link>
          </>
        }
      >
        <form onSubmit={onContinueEmail} className="space-y-3">
          <AuthInput
            name="email"
            type="email"
            autoComplete={passkeyAvailable ? "username webauthn" : "email"}
            placeholder="Enter your email"
            defaultValue={email}
            required
            autoFocus
          />
          {formError && <p className="px-1 text-xs text-red-500">{formError}</p>}
          <AuthButton type="submit">Continue</AuthButton>
        </form>

        {passkeyAvailable && (
          <>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-gray-400">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void onPasskeyLogin()}
              disabled={passkeyLoading}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              <Fingerprint className={`h-5 w-5 ${passkeyLoading ? "animate-pulse text-[#5C4AE6]" : "text-gray-500"}`} aria-hidden />
              {passkeyLoading ? "Waiting for passkey…" : "Sign in with a passkey"}
            </button>
          </>
        )}
      </AuthShell>
    );
  }

  /* ── Step: password ── */
  if (step === "password") {
    return (
      <AuthShell heading="Enter your password">
        <form onSubmit={onSubmitPassword} className="space-y-3">
          {/* Show which account */}
          <div className="flex items-center justify-between rounded-full border border-gray-200 px-5 py-3">
            <span className="truncate text-sm text-gray-700">{email}</span>
            <button
              type="button"
              onClick={() => { setStep("email"); setFormError(""); }}
              className="ml-2 shrink-0 text-[#5C4AE6] transition hover:opacity-75"
              aria-label="Change email"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>

          <AuthPasswordInput
            name="password"
            autoComplete="current-password"
            placeholder="Password"
            required
            autoFocus
          />

          {notVerified && (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-600 space-y-2">
              <p className="font-semibold text-gray-800">Verify your email first</p>
              <p>{notVerified.message}</p>
              {notVerified.email && (
                resendReadyIn > 0 ? (
                  <p className="text-gray-400">
                    Resend available in{" "}
                    <span className="tabular-nums font-medium text-gray-700">
                      {Math.floor(resendReadyIn / 60)}:{String(resendReadyIn % 60).padStart(2, "0")}
                    </span>
                  </p>
                ) : (
                  <button
                    type="button"
                    className="font-medium text-[#5C4AE6] hover:underline disabled:opacity-50"
                    onClick={onResend}
                    disabled={resendLoading}
                  >
                    {resendLoading ? "Sending…" : "Send another confirmation email"}
                  </button>
                )
              )}
            </div>
          )}

          {(isError || formError) && !notVerified && (
            <p className="px-1 text-xs text-red-500">{formError || getErrorMessage(error)}</p>
          )}

          <AuthButton type="submit" disabled={busy}>
            {isLoading ? "Signing in…" : "Sign in"}
          </AuthButton>

          <div className="text-center">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-gray-500 hover:text-gray-800 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </form>
      </AuthShell>
    );
  }

  /* ── Step: 2FA ── */
  return (
    <AuthShell heading="Two-step verification">
      <form onSubmit={onSubmitTotp} className="space-y-3">
        <p className="px-1 text-sm text-gray-500">
          Enter the code from your authenticator app for{" "}
          <span className="font-medium text-gray-800">{email}</span>.
        </p>

        <AuthInput
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          required
          autoFocus
        />

        {(err2fa || formError) && (
          <p className="px-1 text-xs text-red-500">{formError || getErrorMessage(error2fa)}</p>
        )}

        <AuthButton type="submit" disabled={busy}>
          {loading2fa ? "Verifying…" : "Verify"}
        </AuthButton>

        <AuthGhostButton
          type="button"
          onClick={() => { setStep("password"); preAuthTokenRef.current = null; setFormError(""); }}
        >
          Back
        </AuthGhostButton>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
