"use client";

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  open: boolean;
  onClose: () => void;
  onRetry: () => void;
  onManualImport: () => void;
  errorMessage?: string | null;
}

export function ImportFailedModal({ open, onClose, onRetry, onManualImport, errorMessage }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            key="modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="import-failed-title"
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>

              <h2 id="import-failed-title" className="text-xl font-bold text-shop-ink">
                Import failed
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-shop-muted">
                {errorMessage ?? "We couldn't import that product. It may not be supported or the link may be invalid."}
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <button type="button" onClick={onRetry} className="btn-primary w-full">
                  Try again
                </button>
                <button type="button" onClick={onManualImport} className="btn-secondary w-full">
                  Enter details manually
                </button>
              </div>

              <button type="button" onClick={onClose} className="mt-4 text-xs text-shop-muted underline hover:text-shop-ink">
                Dismiss
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
