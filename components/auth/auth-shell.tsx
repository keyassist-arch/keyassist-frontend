"use client";

import Link from "next/link";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { KeyAssistMark } from "@/components/ui/keyassist-logo";

export function AuthShell({
  heading,
  subAction,
  children,
}: {
  heading: React.ReactNode;
  subAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
        <Link href="/" aria-label="Key Assist home">
          <KeyAssistMark size={40} />
        </Link>

        <h1 className="mt-5 max-w-[300px] text-center text-[1.75rem] font-bold leading-tight text-gray-900">
          {heading}
        </h1>

        {subAction && (
          <p className="mt-2 text-sm text-gray-500">{subAction}</p>
        )}

        <div className="mt-8 w-full max-w-[360px]">{children}</div>

        <p className="mt-8 max-w-[280px] text-center text-[11px] leading-relaxed text-gray-400">
          By continuing, you agree to the{" "}
          <Link href="#" className="underline hover:text-gray-600">terms</Link>
          {" "}and acknowledge the{" "}
          <Link href="#" className="underline hover:text-gray-600">privacy policy</Link>.
        </p>

        <div className="absolute bottom-5">
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-gray-400 transition hover:text-gray-600"
          >
            English <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full rounded-full border border-gray-200 px-5 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#5C4AE6] focus:ring-2 focus:ring-[#5C4AE6]/10 disabled:opacity-50 ${className}`}
    />
  );
}

export function AuthPasswordInput({
  label,
  className: _cls,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      {label && <p className="px-1 text-xs font-medium text-gray-500">{label}</p>}
      <div className="relative">
        <input
          {...props}
          type={visible ? "text" : "password"}
          className="w-full rounded-full border border-gray-200 px-5 py-3 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#5C4AE6] focus:ring-2 focus:ring-[#5C4AE6]/10 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible
            ? <EyeOff className="h-4 w-4" aria-hidden />
            : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      </div>
    </div>
  );
}

export function AuthButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", style, children, ...rest } = props;
  return (
    <button
      {...rest}
      className={`w-full rounded-full py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      style={{ background: "#5C4AE6", ...style }}
    >
      {children}
    </button>
  );
}

export function AuthGhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", children, ...rest } = props;
  return (
    <button
      {...rest}
      className={`w-full rounded-full border border-gray-200 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
