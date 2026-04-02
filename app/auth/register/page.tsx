"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useRegisterMutation } from "@/store/routes/unified-commerce-api";
import { InnerShell } from "@/components/layout/inner-shell";
import { ErrorState, LoadingState } from "@/components/feedback/query-state";
import { PasswordField } from "@/components/ui/password-field";

export default function RegisterPage() {
  const router = useRouter();
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
      router.replace(`/auth/check-email?email=${encodeURIComponent(data.email)}`);
    } catch {
      /* surfaced via isError */
    }
  };

  return (
    <InnerShell>
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Create account</h1>
          <p className="mt-2 text-sm text-black/70">Create an account to save your cart and check out faster next time.</p>
        </div>

        <form className="card space-y-4" onSubmit={onSubmit}>
          {isLoading ? <LoadingState label="Creating account…" /> : null}
          {(isError || formError) && <ErrorState error={formError || error} title="Registration failed" />}

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="input"
              name="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="First name"
              required
            />
            <input
              className="input"
              name="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Last name"
              required
            />
          </div>
          <input className="input" name="email" type="email" autoComplete="email" placeholder="Email" required />
          <PasswordField
            name="password"
            autoComplete="new-password"
            placeholder="Password (min 8 characters)"
            required
            minLength={8}
          />
          <input className="input" name="phone" type="tel" autoComplete="tel" placeholder="Phone (optional)" />

          <button className="btn-primary w-full" type="submit" disabled={isLoading}>
            {isLoading ? "Please wait…" : "Register"}
          </button>
        </form>

        <p className="text-center text-sm text-black/70">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium text-shop-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </InnerShell>
  );
}
