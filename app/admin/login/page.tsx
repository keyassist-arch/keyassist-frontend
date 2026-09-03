"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Lock, Mail } from "lucide-react";
import { useLoginMutation, useLazyGetMeQuery } from "@/store/routes/unified-commerce-api";
import { useAppDispatch } from "@/store/hooks";
import { unifiedCommerceApi } from "@/store/routes/unified-commerce-api";
import { getErrorMessage } from "@/lib/rtk-error";
import {
  AuthShell,
  AuthField,
  AuthInput,
  AuthPasswordInput,
  AuthButton,
} from "@/components/auth/auth-shell";

export default function AdminLoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [login, { isLoading, isError, error }] = useLoginMutation();
  const [triggerGetMe] = useLazyGetMeQuery();
  const [formError, setFormError] = useState("");

  const isAdminRole = (role: string) => role === "ADMIN_SUPER" || role === "ADMIN_STAFF";

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");

    if (!email) { setFormError("Please enter your email."); return; }
    if (!password) { setFormError("Password is required."); return; }

    try {
      await login({ email, password }).unwrap();
      dispatch(unifiedCommerceApi.util.invalidateTags(["Me"]));
      const me = await triggerGetMe().unwrap();
      if (!isAdminRole(me.role)) {
        setFormError("This account does not have admin access.");
        return;
      }
      router.replace("/admin");
    } catch {
      /* surfaced via isError */
    }
  };

  return (
    <AuthShell
      heading="Admin sign in"
      topRight={
        <Link
          href="/auth/login"
          className="rounded-full border border-shop-border bg-white px-4 py-[9px] text-[13px] font-semibold text-shop-ink transition hover:bg-black/5"
        >
          Sign in as customer
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <AuthField label="Admin email">
          <AuthInput icon={Mail} name="email" type="email" autoComplete="email" placeholder="you@example.com" required autoFocus />
        </AuthField>
        <AuthPasswordInput icon={Lock} label="Password" name="password" autoComplete="current-password" placeholder="Enter your password" required />

        {(isError || formError) && (
          <p className="px-1 text-xs text-red-500">{formError || getErrorMessage(error)}</p>
        )}

        <AuthButton type="submit" disabled={isLoading}>
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
