"use client";

import { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import type { OrderResponse } from "@/types/api";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export type TrackingFormValues = { trackingNumber: string; carrier: string; trackingMessage?: string };

export function OrderTrackingModal({
  order,
  open,
  busy,
  onClose,
  onSave,
}: {
  order: OrderResponse | null;
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onSave: (values: TrackingFormValues) => void;
}) {
  const latest = order?.tracking?.[order.tracking.length - 1];
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open || !order) return;
    setTrackingNumber(latest?.trackingNumber ?? "");
    setCarrier(latest?.carrier ?? "");
    setMessage("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order?.id]);

  if (!order) return null;

  const canSave = trackingNumber.trim().length > 0 && carrier.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent showCloseButton={false} className="max-w-md">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "var(--shop-accent-soft)" }}
          >
            <Truck className="h-5 w-5" style={{ color: "#059669" }} aria-hidden />
          </span>
          <div className="min-w-0">
            <DialogTitle className="text-base font-semibold text-gray-900">Tracking details</DialogTitle>
            <p className="truncate font-mono text-xs text-gray-400">{order.id}</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-gray-700">Tracking number</span>
            <input
              className="input"
              placeholder="e.g. 1Z999…"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              autoFocus
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-gray-700">Carrier</span>
            <input
              className="input"
              placeholder="e.g. DHL"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-gray-700">Note for customer</span>
            <input
              className="input"
              placeholder="e.g. Arrived at local hub"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave || busy}
            onClick={() =>
              onSave({
                trackingNumber: trackingNumber.trim(),
                carrier: carrier.trim(),
                trackingMessage: message.trim() || undefined,
              })
            }
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "#059669" }}
          >
            {busy ? "Saving…" : "Save tracking"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
