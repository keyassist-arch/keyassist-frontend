"use client";

import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  onRetry: () => void;
  onManualImport: () => void;
  errorMessage?: string | null;
}

export function ImportFailedModal({ open, onClose, onRetry, onManualImport, errorMessage }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent role="alertdialog" showCloseButton className="max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>

        <DialogTitle className="text-xl font-bold text-shop-ink">Import failed</DialogTitle>
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
      </DialogContent>
    </Dialog>
  );
}
