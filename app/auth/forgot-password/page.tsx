"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { KeyRound, Mail, MailCheck, Send } from "lucide-react";
import { useForgotPasswordMutation } from "@/store/routes/unified-commerce-api";
import { getErrorMessage } from "@/lib/rtk-error";
import {
  AuthShell,
  AuthField,
  AuthInput,
  AuthButton,
  AuthGhostButton,
} from "@/components/auth/auth-shell";

export default function ForgotPasswordPage() {
  const [forgotPassword, { isLoading, isError, error, isSuccess, data }] =
    useForgotPasswordMutation();
  const [formError, setFormError] = useState("");
  const [sentTo, setSentTo] = useState("");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    if (!email) { setFormError("Email is required."); return; }
    setSentTo(email);
    try {
      await forgotPassword({ email }).unwrap();
    } catch { /* surfaced via isError */ }
  };

  if (isSuccess && data?.message) {
    return (
      <AuthShell
        heading="Check your inbox"
        icon={<MailCheck className="h-[26px] w-[26px]" style={{ color: "var(--shop-primary)" }} aria-hidden />}
        backLabel="Back to sign in"
        backHref="/auth/login"
      >
        <div className="flex flex-col gap-4">
          <p className="text-[15px] leading-[1.5] text-shop-muted">{data.message}</p>
          <a
            href={`mailto:${sentTo}`}
            className="flex w-full items-center justify-center gap-2 rounded-full py-[15px] text-[15px] font-bold text-white transition hover:opacity-90"
            style={{ background: "var(--shop-primary)" }}
          >
            <Mail className="h-4 w-4" aria-hidden />
            Open email app
          </a>
          <Link href="/auth/login">
            <AuthGhostButton type="button">Back to sign in</AuthGhostButton>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      heading="Reset your password"
      subhead="Enter the email linked to your account and we'll send you a secure reset link."
      icon={<KeyRound className="h-[26px] w-[26px]" style={{ color: "var(--shop-primary)" }} aria-hidden />}
      backLabel="Back to sign in"
      backHref="/auth/login"
      footNote="Protected by industry-standard encryption. Links expire in 30 minutes."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <AuthField label="Email address">
          <AuthInput icon={Mail} name="email" type="email" autoComplete="email" placeholder="you@example.com" required autoFocus />
        </AuthField>

        {(formError || isError) && (
          <p className="px-1 text-xs text-red-500">
            {formError || getErrorMessage(error)}
          </p>
        )}

        <AuthButton type="submit" disabled={isLoading} icon={Send}>
          {isLoading ? "Sending…" : "Send reset link"}
        </AuthButton>

        <div className="flex items-center justify-center gap-1.5">
          <span className="text-sm text-shop-muted">Remember it?</span>
          <Link href="/auth/login" className="text-sm font-semibold hover:underline" style={{ color: "var(--shop-primary)" }}>
            Sign in
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
