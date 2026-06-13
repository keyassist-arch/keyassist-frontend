"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRegisterMutation } from "@/store/routes/unified-commerce-api";
import { getErrorMessage } from "@/lib/rtk-error";
import { loginUrl } from "@/lib/auth-redirect";
import {
  AuthShell,
  AuthInput,
  AuthPasswordInput,
  AuthButton,
} from "@/components/auth/auth-shell";

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "";
  const [register, { isLoading, isError, error }] = useRegisterMutation();
  const [formError, setFormError] = useState("");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    const fd = new FormData(e.currentTarget);
    const firstName = String(fd.get("firstName") ?? "").trim();
    const lastName = String(fd.get("lastName") ?? "").trim();
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    const phone = String(fd.get("phone") ?? "").trim();

    if (!firstName || !lastName) {
      setFormError("First name and last name are required.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    try {
      const data = await register({
        email,
        password,
        firstName,
        lastName,
        ...(phone ? { phone } : {}),
      }).unwrap();
      const checkEmailUrl = `/auth/check-email?email=${encodeURIComponent(data.email)}${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""}`;
      router.replace(checkEmailUrl);
    } catch { /* surfaced via isError */ }
  };

  return (
    <AuthShell
      heading="Create your account"
      subAction={
        <>
          Already have one?{" "}
          <Link href={loginUrl(redirect)} className="font-medium text-[#5C4AE6] hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <AuthInput
            name="firstName"
            type="text"
            autoComplete="given-name"
            placeholder="First name"
            required
            autoFocus
          />
          <AuthInput
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="Last name"
            required
          />
        </div>

        <AuthInput
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Email address"
          required
        />

        <AuthPasswordInput
          name="password"
          autoComplete="new-password"
          placeholder="Password (8+ characters)"
          required
          minLength={8}
          label="Password"
        />

        <AuthInput
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="Phone (optional)"
        />

        {(formError || isError) && (
          <p className="px-1 text-xs text-red-500">
            {formError || getErrorMessage(error)}
          </p>
        )}

        <AuthButton type="submit" disabled={isLoading}>
          {isLoading ? "Creating account…" : "Create account"}
        </AuthButton>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterPageInner />
    </Suspense>
  );
}
