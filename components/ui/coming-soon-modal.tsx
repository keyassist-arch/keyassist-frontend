"use client";

import { Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  feature: string;
}

export function ComingSoonModal({ open, onClose, feature }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent showCloseButton className="max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-shop-accent-soft">
          <Sparkles className="h-6 w-6 text-shop-accent" />
        </div>

        <DialogTitle className="text-xl font-bold text-shop-ink">Coming soon</DialogTitle>
        <p className="mt-2 text-sm leading-relaxed text-shop-muted">
          <span className="font-semibold text-shop-ink">{feature}</span> is on its way.
          We&rsquo;re building something great — stay tuned.
        </p>

        <button type="button" onClick={onClose} className="btn-primary mt-6 w-full">
          Got it
        </button>
      </DialogContent>
    </Dialog>
  );
}
