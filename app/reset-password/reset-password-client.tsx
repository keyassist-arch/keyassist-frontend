"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { useResetPasswordMutation } from "@/store/routes/unified-commerce-api";
import { InnerShell } from "@/components/layout/inner-shell";
import { ErrorState, LoadingState, SuccessState } from "@/components/feedback/query-state";
import { PasswordField } from "@/components/ui/password-field";

export function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const [resetPassword, { isLoading, isError, error, isSuccess, data }] = useResetPasswordMutation();
  const [formError, setFormError] = useState("");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    if (!token) {
      setFormError("This page needs a valid reset link from your email.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm") ?? "");
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setFormError("Passwords do not match.");
      return;
    }
    try {
      await resetPassword({ token, password }).unwrap();
    } catch {
      /* RTK error */
    }
  };

  return (
    <InnerShell>
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Set a new password</h1>
          <p className="mt-2 text-sm text-black/70">Choose a new password for your account.</p>
        </div>

        {!token ? (
          <div className="card space-y-4">
            <ErrorState
              error="Open this page from the link in your reset email, or request a new link below."
              title="Missing token"
            />
            <Link href="/auth/forgot-password" className="btn-secondary inline-block text-center">
              Request reset link
            </Link>
          </div>
        ) : isSuccess ? (
          <div className="card space-y-4">
            <SuccessState
              message={data?.message ?? "Password updated. Sign in with your new password; existing sessions were signed out."}
            />
            <Link href="/auth/login" className="btn-primary inline-block w-full text-center">
              Sign in
            </Link>
          </div>
        ) : (
          <form className="card space-y-4" onSubmit={onSubmit}>
            {isLoading ? <LoadingState label="Updating password…" /> : null}
            {(isError || formError) && <ErrorState error={formError || error} title="Reset failed" />}

            <PasswordField
              name="password"
              autoComplete="new-password"
              placeholder="New password (min. 8 characters)"
              required
              minLength={8}
            />
            <PasswordField
              name="confirm"
              autoComplete="new-password"
              placeholder="Confirm new password"
              required
              minLength={8}
            />
            <button className="btn-primary w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Saving…" : "Update password"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-black/70">
          <Link href="/auth/login" className="font-medium text-shop-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </InnerShell>
  );
}
