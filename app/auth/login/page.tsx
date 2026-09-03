"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useLayoutEffect, useRef, useState, Suspense } from "react";
import { ArrowLeft, ArrowRight, Lock, Mail, ScanFace } from "lucide-react";
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
  AuthField,
  AuthInput,
  AuthPasswordInput,
  AuthButton,
  AuthGhostButton,
} from "@/components/auth/auth-shell";

type Step = "email" | "password" | "totp";
const OTP_LENGTH = 6;

function OtpInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? "");

  const setDigit = (i: number, d: string) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join(""));
  };

  return (
    <div className="flex gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(-1);
            setDigit(i, v);
            if (v && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
            if (!pasted) return;
            e.preventDefault();
            onChange(pasted.padEnd(OTP_LENGTH, "").slice(0, OTP_LENGTH).replace(/\s/g, ""));
            refs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
          }}
          className="h-[52px] flex-1 rounded-xl border-[1.5px] text-center text-xl font-bold text-shop-ink outline-none transition"
          style={{ borderColor: d ? "var(--shop-primary)" : "var(--shop-border)" }}
        />
      ))}
    </div>
  );
}

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
  const [otpCode, setOtpCode] = useState("");

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
    const code = normalizeTotpCode(otpCode);
    if (!code || code.length < 6) {
      setFormError("Enter the 6-digit code from your authenticator app.");
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
  const topRight = (
    <div className="flex items-center gap-2">
      <span className="text-[13px] text-shop-muted">New here?</span>
      <Link
        href={registerUrl(redirect)}
        className="rounded-full border border-shop-border bg-white px-4 py-[9px] text-[13px] font-semibold text-shop-ink transition hover:bg-black/5"
      >
        Create account
      </Link>
    </div>
  );

  /* ── Step: email ── */
  if (step === "email") {
    return (
      <AuthShell heading="Welcome back" subhead="Sign in to track orders, save favorites and check out faster." topRight={topRight}>
        <form onSubmit={onContinueEmail} className="flex flex-col gap-4">
          <AuthField label="Email address">
            <AuthInput
              icon={Mail}
              name="email"
              type="email"
              autoComplete={passkeyAvailable ? "username webauthn" : "email"}
              placeholder="you@example.com"
              defaultValue={email}
              required
              autoFocus
            />
          </AuthField>
          {formError && <p className="px-1 text-xs text-red-500">{formError}</p>}
          <AuthButton type="submit" icon={ArrowRight}>Continue</AuthButton>

          {passkeyAvailable && (
            <>
              <div className="flex items-center gap-3.5 py-1">
                <span className="h-px flex-1 bg-shop-border" />
                <span className="text-xs text-shop-muted">or</span>
                <span className="h-px flex-1 bg-shop-border" />
              </div>
              <AuthGhostButton type="button" icon={ScanFace} onClick={() => void onPasskeyLogin()} disabled={passkeyLoading}>
                {passkeyLoading ? "Waiting for passkey…" : "Sign in with a passkey"}
              </AuthGhostButton>
            </>
          )}
        </form>
      </AuthShell>
    );
  }

  /* ── Step: password ── */
  if (step === "password") {
    return (
      <AuthShell heading="Enter your password" topRight={topRight}>
        <form onSubmit={onSubmitPassword} className="flex flex-col gap-4">
          <div
            className="flex items-center justify-between rounded-full px-4 py-3"
            style={{ background: "var(--background)", border: "1px solid var(--shop-border)" }}
          >
            <span className="truncate text-sm text-shop-ink">{email}</span>
            <button
              type="button"
              onClick={() => { setStep("email"); setFormError(""); }}
              className="ml-2 shrink-0 transition hover:opacity-75"
              style={{ color: "var(--shop-primary)" }}
              aria-label="Change email"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>

          <AuthPasswordInput
            icon={Lock}
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            autoFocus
          />

          {notVerified && (
            <div className="flex flex-col gap-2 rounded-2xl p-4 text-xs" style={{ background: "var(--background)" }}>
              <p className="font-semibold text-shop-ink">Verify your email first</p>
              <p className="text-shop-muted">{notVerified.message}</p>
              {notVerified.email && (
                resendReadyIn > 0 ? (
                  <p className="text-shop-muted">
                    Resend available in{" "}
                    <span className="tabular-nums font-medium text-shop-ink">
                      {Math.floor(resendReadyIn / 60)}:{String(resendReadyIn % 60).padStart(2, "0")}
                    </span>
                  </p>
                ) : (
                  <button
                    type="button"
                    className="font-medium hover:underline disabled:opacity-50"
                    style={{ color: "var(--shop-primary)" }}
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
            <Link href="/auth/forgot-password" className="text-sm text-shop-muted hover:text-shop-ink hover:underline">
              Forgot password?
            </Link>
          </div>
        </form>
      </AuthShell>
    );
  }

  /* ── Step: 2FA ── */
  return (
    <AuthShell heading="Two-step verification" topRight={topRight}>
      <form onSubmit={onSubmitTotp} className="flex flex-col gap-4">
        <p className="px-1 text-sm text-shop-muted">
          Enter the code from your authenticator app for{" "}
          <span className="font-medium text-shop-ink">{email}</span>.
        </p>

        <OtpInput value={otpCode} onChange={setOtpCode} disabled={busy} />

        {(err2fa || formError) && (
          <p className="px-1 text-xs text-red-500">{formError || getErrorMessage(error2fa)}</p>
        )}

        <AuthButton type="submit" disabled={busy}>
          {loading2fa ? "Verifying…" : "Verify"}
        </AuthButton>

        <AuthGhostButton
          type="button"
          onClick={() => { setStep("password"); preAuthTokenRef.current = null; setFormError(""); setOtpCode(""); }}
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
