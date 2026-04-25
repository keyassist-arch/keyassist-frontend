"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { getErrorMessage } from "@/lib/rtk-error";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-black/60" role="status" aria-live="polite">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-shop-accent border-t-transparent" />
      {label}
    </div>
  );
}

export function ErrorState({ error, title = "Something went wrong" }: { error: unknown; title?: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-red-800">{getErrorMessage(error)}</p>
      </div>
    </div>
  );
}

export function SuccessState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
      {message}
    </div>
  );
}
