"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useForgotPasswordMutation } from "@/store/routes/unified-commerce-api";
import { getErrorMessage } from "@/lib/rtk-error";
import {
  AuthShell,
  AuthInput,
  AuthButton,
} from "@/components/auth/auth-shell";
import { KeyAssistMark } from "@/components/ui/keyassist-logo";

export default function ForgotPasswordPage() {
  const [forgotPassword, { isLoading, isError, error, isSuccess, data }] =
    useForgotPasswordMutation();
  const [formError, setFormError] = useState("");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    if (!email) { setFormError("Email is required."); return; }
    try {
      await forgotPassword({ email }).unwrap();
    } catch { /* surfaced via isError */ }
  };

  if (isSuccess && data?.message) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-4 text-center">
        <KeyAssistMark size={40} />
        <h1 className="mt-5 text-2xl font-bold text-gray-900">Check your inbox</h1>
        <p className="mt-3 max-w-[280px] text-sm text-gray-500">{data.message}</p>
        <Link
          href="/auth/login"
          className="mt-6 rounded-full border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <AuthShell
      heading="Reset your password"
      subAction={
        <>
          Remember it?{" "}
          <Link href="/auth/login" className="font-medium text-[#5C4AE6] hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <AuthInput
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          required
          autoFocus
        />

        {(formError || isError) && (
          <p className="px-1 text-xs text-red-500">
            {formError || getErrorMessage(error)}
          </p>
        )}

        <AuthButton type="submit" disabled={isLoading}>
          {isLoading ? "Sending…" : "Send reset link"}
        </AuthButton>
      </form>
    </AuthShell>
  );
}
