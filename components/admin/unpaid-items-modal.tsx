"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { UnpaidItemsConflict } from "@/types/index";

interface Props {
  conflict: UnpaidItemsConflict | null;
  batchLabel?: string;
  nudging?: boolean;
  advancing?: boolean;
  onNudge: () => void;
  onContinue: () => void;
  onClose: () => void;
}

/** Shown when advancing a batch to Placing Orders while it still has unpaid items. */
export function UnpaidItemsModal({ conflict, batchLabel, nudging, advancing, onNudge, onContinue, onClose }: Props) {
  const open = conflict != null;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && conflict && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            key="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unpaid-items-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <h3 id="unpaid-items-title" className="text-base font-semibold text-gray-900">
                {conflict.unpaidCount} item{conflict.unpaidCount === 1 ? "" : "s"} still unpaid
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {batchLabel ?? "This batch"}{" "}
                can&apos;t move to Placing Orders while these items haven&apos;t been paid for:
              </p>
              <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
                {conflict.unpaidItems.map((item) => (
                  <li key={item.id} className="truncate">
                    {item.productTitle}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-gray-400">
                Nudge them to pay now, or continue anyway — unpaid items will move to the next batch automatically and those
                users will be notified.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  disabled={nudging || advancing}
                  onClick={onNudge}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  {nudging ? "Sending…" : "Nudge them"}
                </button>
                <button
                  type="button"
                  disabled={nudging || advancing}
                  onClick={onContinue}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  style={{ background: "#059669" }}
                >
                  {advancing ? "Advancing…" : "Continue anyway"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
