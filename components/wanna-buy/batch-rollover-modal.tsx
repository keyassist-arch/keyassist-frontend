"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PackageCheck } from "lucide-react";
import type { BatchRolloverInfo } from "@/types/index";

interface Props {
  info: BatchRolloverInfo | null;
  onClose: () => void;
}

/** Shown right after adding a Wanna Buy item when the current batch had already closed. */
export function BatchRolloverModal({ info, onClose }: Props) {
  const open = info != null;

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

  const closesAt = info?.collectingEndsAt
    ? new Date(info.collectingEndsAt).toLocaleString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <AnimatePresence>
      {open && info && (
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
            aria-labelledby="batch-rollover-title"
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50">
                <PackageCheck className="h-5 w-5 text-[#059669]" aria-hidden />
              </div>
              <h3 id="batch-rollover-title" className="mt-3 text-base font-semibold text-gray-900">
                Added to the next batch
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {info.previousBatchLabel} already closed for new items. Your item is now in{" "}
                <strong className="text-gray-900">{info.newBatchLabel}</strong>
                {closesAt ? (
                  <>
                    , open for new items until <strong className="text-gray-900">{closesAt}</strong>
                  </>
                ) : null}
                .
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: "#059669" }}
              >
                Got it
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
