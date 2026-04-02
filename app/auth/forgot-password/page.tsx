"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useForgotPasswordMutation } from "@/store/routes/unified-commerce-api";
import { InnerShell } from "@/components/layout/inner-shell";
import { ErrorState, LoadingState, SuccessState } from "@/components/feedback/query-state";

export default function ForgotPasswordPage() {
  const [forgotPassword, { isLoading, isError, error, isSuccess, data }] = useForgotPasswordMutation();
  const [formError, setFormError] = useState("");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    if (!email) {
      setFormError("Email is required.");
      return;
    }
    try {
      await forgotPassword({ email }).unwrap();
    } catch {
      /* RTK error */
    }
  };

  return (
    <InnerShell>
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Forgot password</h1>
          <p className="mt-2 text-sm text-black/70">
            Enter your email. If an account exists, we&apos;ll send a reset link. (We always show the same confirmation for privacy.)
          </p>
        </div>

        {isSuccess && data?.message ? (
          <SuccessState message={data.message} />
        ) : (
          <form className="card space-y-4" onSubmit={onSubmit}>
            {isLoading ? <LoadingState label="Sending…" /> : null}
            {(isError || formError) && <ErrorState error={formError || error} title="Request failed" />}

            <input className="input" name="email" type="email" autoComplete="email" placeholder="Email" required />
            <button className="btn-primary w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-black/70">
          <Link href="/auth/login" className="font-medium text-shop-accent hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </InnerShell>
  );
}
