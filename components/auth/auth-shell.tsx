"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";

const DEFAULT_FOOT_NOTE = (
  <>
    By continuing, you agree to the{" "}
    <Link href="/terms" className="underline hover:text-shop-ink">terms</Link>
    {" "}and acknowledge the{" "}
    <Link href="/privacy" className="underline hover:text-shop-ink">privacy policy</Link>.
  </>
);

export function AuthShell({
  heading,
  subhead,
  topRight,
  backHref,
  backLabel,
  icon,
  formWidth = 380,
  footNote = DEFAULT_FOOT_NOTE,
  children,
}: {
  heading: ReactNode;
  subhead?: ReactNode;
  topRight?: ReactNode;
  backHref?: string;
  backLabel?: string;
  icon?: ReactNode;
  formWidth?: number;
  footNote?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex overflow-y-auto bg-white">
      <AuthBrandPanel />

      <div className="flex w-full flex-1 flex-col items-center justify-between gap-8 overflow-y-auto p-9">
        <div className="flex w-full items-center justify-between">
          {backLabel ? (
            <Link
              href={backHref ?? "/auth/login"}
              className="flex items-center gap-2 rounded-full border border-shop-border bg-white py-[9px] pl-3 pr-4 text-[13px] font-semibold text-shop-ink transition hover:bg-black/5"
            >
              <ArrowLeft className="h-[15px] w-[15px]" aria-hidden />
              {backLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => (backHref ? router.push(backHref) : router.back())}
              aria-label="Go back"
              className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-shop-border bg-white text-shop-ink transition hover:bg-black/5"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </button>
          )}
          {topRight}
        </div>

        <div className="flex w-full flex-col gap-5" style={{ maxWidth: formWidth }}>
          {icon && (
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--shop-accent-soft)" }}>
              {icon}
            </span>
          )}
          <div className="flex flex-col gap-2">
            <h1 className="text-[30px] font-extrabold leading-[1.15] tracking-[-0.8px] text-shop-ink">{heading}</h1>
            {subhead && <p className="text-[15px] leading-[1.5] text-shop-muted">{subhead}</p>}
          </div>
          {children}
        </div>

        <p className="max-w-[340px] text-center text-[11px] leading-[1.5] text-[#A8A29E]">{footNote}</p>
      </div>
    </div>
  );
}

function fieldWrapCls(hasIcon: boolean) {
  return `flex h-[50px] w-full items-center gap-2.5 rounded-full border-[1.5px] border-shop-border bg-white ${hasIcon ? "pl-[18px] pr-[18px]" : "px-[18px]"} transition focus-within:border-shop-accent`;
}

export function AuthField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <span className="text-[13px] font-semibold text-shop-ink">{label}</span>
      {children}
    </div>
  );
}

export function AuthInput({
  icon: Icon,
  className: _cls,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: LucideIcon }) {
  return (
    <div className={fieldWrapCls(Boolean(Icon))}>
      {Icon && <Icon className="h-[17px] w-[17px] shrink-0 text-shop-muted" aria-hidden />}
      <input
        {...props}
        className="w-full bg-transparent text-sm text-shop-ink outline-none placeholder:text-[#A8A29E] disabled:opacity-50"
      />
    </div>
  );
}

export function AuthPasswordInput({
  label,
  icon: Icon,
  className: _cls,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; icon?: LucideIcon }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-[13px] font-semibold text-shop-ink">{label}</span>}
      <div className={fieldWrapCls(Boolean(Icon))}>
        {Icon && <Icon className="h-[17px] w-[17px] shrink-0 text-shop-muted" aria-hidden />}
        <input
          {...props}
          type={visible ? "text" : "password"}
          className="w-full bg-transparent text-sm text-shop-ink outline-none placeholder:text-[#A8A29E] disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="shrink-0 text-shop-muted transition hover:text-shop-ink"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-[17px] w-[17px]" aria-hidden /> : <Eye className="h-[17px] w-[17px]" aria-hidden />}
        </button>
      </div>
    </div>
  );
}

export function AuthButton({
  icon: Icon,
  className = "",
  style,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: LucideIcon }) {
  return (
    <button
      {...rest}
      className={`flex w-full items-center justify-center gap-2 rounded-full py-[15px] text-[15px] font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      style={{ background: "var(--shop-primary)", ...style }}
    >
      {children}
      {Icon && <Icon className="h-4 w-4" aria-hidden />}
    </button>
  );
}

export function AuthGhostButton({
  icon: Icon,
  className = "",
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: LucideIcon }) {
  return (
    <button
      {...rest}
      className={`flex w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-shop-border bg-white py-[13px] text-sm font-semibold text-shop-ink transition hover:bg-black/5 disabled:opacity-50 ${className}`}
    >
      {Icon && <Icon className="h-[18px] w-[18px]" aria-hidden />}
      {children}
    </button>
  );
}
