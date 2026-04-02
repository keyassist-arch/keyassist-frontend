"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { InnerShell } from "@/components/layout/inner-shell";
import { ErrorState, LoadingState } from "@/components/feedback/query-state";
import { useResendVerificationMutation } from "@/store/routes/unified-commerce-api";
import { getErrorMessage } from "@/lib/rtk-error";

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 1) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}•••${domain}`;
}

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const emailFromUrl = useMemo(() => searchParams.get("email")?.trim() ?? "", [searchParams]);
  const [emailInput, setEmailInput] = useState(emailFromUrl);
  const [resend, { isLoading, isError, error }] = useResendVerificationMutation();
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    setEmailInput(emailFromUrl);
  }, [emailFromUrl]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const onResend = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = emailInput.trim();
    if (!email || cooldown > 0) return;
    try {
      const data = await resend({ email }).unwrap();
      toast.success(data.message);
      setCooldown(60);
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
          <h1 className="text-2xl font-semibold">Check your email</h1>
          <p className="mt-2 text-sm text-black/70">
            We sent a confirmation link
            {emailFromUrl ? (
              <>
                {" "}
                to <span className="font-medium text-shop-ink">{maskEmail(emailFromUrl)}</span>
              </>
            ) : null}
            . Open it to verify your account, then you can sign in.
          </p>
        </div>

        <div className="card space-y-4">
          {isLoading ? <LoadingState label="Sending…" /> : null}
          {isError ? <ErrorState error={getErrorMessage(error)} title="Could not resend" /> : null}

          <p className="text-sm text-black/70">
            Didn&apos;t get the email? Check spam, or resend the confirmation link.
          </p>

          <form onSubmit={onResend} className="space-y-3">
            {!emailFromUrl ? (
              <input
                className="input"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Your email address"
                value={emailInput}
                onChange={(ev) => setEmailInput(ev.target.value)}
                required
              />
            ) : null}
            <button
              type="submit"
              className="btn-secondary w-full"
              disabled={isLoading || !emailInput.trim() || cooldown > 0}
            >
              {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend confirmation email"}
            </button>
          </form>

          <p className="text-center text-sm">
            <Link href="/auth/login" className="font-medium text-shop-accent hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </InnerShell>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <InnerShell>
          <LoadingState label="Loading…" />
        </InnerShell>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
