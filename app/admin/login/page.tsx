"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useLoginMutation, useLazyGetMeQuery } from "@/store/routes/unified-commerce-api";
import { useAppDispatch } from "@/store/hooks";
import { unifiedCommerceApi } from "@/store/routes/unified-commerce-api";
import { getErrorMessage } from "@/lib/rtk-error";
import {
  AuthShell,
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
      subAction={
        <>
          Or{" "}
          <Link href="/auth/login" className="font-medium text-[#5C4AE6] hover:underline">
            sign in as customer
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <AuthInput
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Admin email"
          required
          autoFocus
        />
        <AuthPasswordInput
          name="password"
          autoComplete="current-password"
          placeholder="Password"
          required
        />

        {(isError || formError) && (
          <p className="px-1 text-xs text-red-500">{formError || getErrorMessage(error)}</p>
        )}

        <AuthButton type="submit" disabled={isLoading}>
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
