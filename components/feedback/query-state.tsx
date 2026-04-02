"use client";

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
    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-red-800">{getErrorMessage(error)}</p>
    </div>
  );
}

export function SuccessState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800" role="status">
      {message}
    </div>
  );
}
