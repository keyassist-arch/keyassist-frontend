"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, Phone } from "lucide-react";
import { FormEvent, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRegisterMutation } from "@/store/routes/unified-commerce-api";
import { getErrorMessage } from "@/lib/rtk-error";
import { loginUrl } from "@/lib/auth-redirect";
import {
  AuthShell,
  AuthField,
  AuthInput,
  AuthPasswordInput,
  AuthButton,
} from "@/components/auth/auth-shell";

function passwordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "var(--shop-border)" };
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password) || password.length >= 12,
  ];
  const score = checks.filter(Boolean).length;
  if (score <= 1) return { score, label: "Weak", color: "var(--shop-sale)" };
  if (score === 2) return { score, label: "Fair", color: "var(--shop-star)" };
  if (score === 3) return { score, label: "Good", color: "var(--shop-primary)" };
  return { score, label: "Strong", color: "var(--shop-primary)" };
}

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "";
  const [register, { isLoading, isError, error }] = useRegisterMutation();
  const [formError, setFormError] = useState("");
  const [password, setPassword] = useState("");
  const strength = useMemo(() => passwordStrength(password), [password]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    const fd = new FormData(e.currentTarget);
    const firstName = String(fd.get("firstName") ?? "").trim();
    const lastName = String(fd.get("lastName") ?? "").trim();
    const email = String(fd.get("email") ?? "");
    const pw = String(fd.get("password") ?? "");
    const phone = String(fd.get("phone") ?? "").trim();

    if (!firstName || !lastName) {
      setFormError("First name and last name are required.");
      return;
    }
    if (pw.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    try {
      const data = await register({
        email,
        password: pw,
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
      subhead="Join thousands shopping US stores from Nigeria."
      formWidth={400}
      topRight={
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-shop-muted">Already have one?</span>
          <Link
            href={loginUrl(redirect)}
            className="rounded-full border border-shop-border bg-white px-4 py-[9px] text-[13px] font-semibold text-shop-ink transition hover:bg-black/5"
          >
            Sign in
          </Link>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex gap-3">
          <AuthField label="First name">
            <AuthInput name="firstName" type="text" autoComplete="given-name" placeholder="Jane" required autoFocus />
          </AuthField>
          <AuthField label="Last name">
            <AuthInput name="lastName" type="text" autoComplete="family-name" placeholder="Doe" required />
          </AuthField>
        </div>

        <AuthField label="Email address">
          <AuthInput icon={Mail} name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        </AuthField>

        <AuthPasswordInput
          icon={Lock}
          label="Password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {password && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 4 }, (_, i) => (
              <span
                key={i}
                className="h-1 flex-1 rounded-full transition"
                style={{ background: i < strength.score ? strength.color : "var(--shop-border)" }}
              />
            ))}
            <span className="shrink-0 pl-1 text-[11px] font-semibold" style={{ color: strength.color }}>
              {strength.label}
            </span>
          </div>
        )}

        <AuthField label="Phone (optional)">
          <AuthInput icon={Phone} name="phone" type="tel" autoComplete="tel" placeholder="+234 …" />
        </AuthField>

        {(formError || isError) && (
          <p className="px-1 text-xs text-red-500">
            {formError || getErrorMessage(error)}
          </p>
        )}

        <AuthButton type="submit" disabled={isLoading} icon={ArrowRight}>
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
