"use client";

import Link from "next/link";
import { useState } from "react";
import { Layers, Plus, ArrowRight, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { useAppSelector } from "@/store/hooks";
import {
  useGetAdminBatchesQuery,
  useCreateAdminBatchMutation,
  usePatchAdminBatchStatusMutation,
  useNudgeUnpaidBatchItemsMutation,
} from "@/store/routes/unified-commerce-api";
import { ErrorState } from "@/components/feedback/query-state";
import { AdminListSkeleton } from "@/components/dashboard/admin-list-skeleton";
import { UnpaidItemsModal } from "@/components/admin/unpaid-items-modal";
import { getErrorMessage, getUnpaidItemsConflict } from "@/lib/rtk-error";
import type { Batch, BatchStatus, UnpaidItemsConflict } from "@/types/index";

/** Mirrors the backend's strictly-sequential, forward-only transition map (`BATCH_STATUS_TRANSITIONS`). */
const NEXT_STATUS: Partial<Record<BatchStatus, BatchStatus>> = {
  collecting: "processing",
  processing: "placing_orders",
  placing_orders: "in_transit",
  in_transit: "at_warehouse",
  at_warehouse: "shipped",
  shipped: "delivered",
};

const STATUS_LABEL: Record<BatchStatus, string> = {
  collecting:     "Collecting",
  processing:     "Processing quotes",
  placing_orders: "Placing orders",
  in_transit:     "In transit",
  at_warehouse:   "At warehouse",
  shipped:        "Shipped",
  delivered:      "Delivered",
  cancelled:      "Cancelled",
};

const STATUS_COLOR: Record<BatchStatus, { color: string; bg: string }> = {
  collecting:     { color: "#d97706", bg: "#fef3c7" },
  processing:     { color: "#2563eb", bg: "#dbeafe" },
  placing_orders: { color: "#7c3aed", bg: "#ede9fe" },
  in_transit:     { color: "#0891b2", bg: "#cffafe" },
  at_warehouse:   { color: "#059669", bg: "#d1fae5" },
  shipped:        { color: "#065f46", bg: "#ecfdf5" },
  delivered:      { color: "#374151", bg: "#f3f4f6" },
  cancelled:      { color: "#dc2626", bg: "#fee2e2" },
};

function StatusBadge({ status }: { status: BatchStatus }) {
  const { color, bg } = STATUS_COLOR[status] ?? STATUS_COLOR.collecting;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ color, background: bg }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function BatchStatusSelect({
  batch,
  onUnpaidConflict,
}: {
  batch: Batch;
  onUnpaidConflict: (batch: Batch, conflict: UnpaidItemsConflict) => void;
}) {
  const [patch, { isLoading }] = usePatchAdminBatchStatusMutation();
  const [open, setOpen] = useState(false);

  const nextStatus = NEXT_STATUS[batch.status];
  const next = nextStatus ? [nextStatus] : [];

  const handleChange = async (status: BatchStatus) => {
    setOpen(false);
    try {
      await patch({ id: batch.id, status }).unwrap();
      toast.success(`Batch moved to "${STATUS_LABEL[status]}"`);
    } catch (err) {
      const conflict = getUnpaidItemsConflict(err);
      if (conflict) {
        onUnpaidConflict(batch, conflict);
        return;
      }
      toast.error(getErrorMessage(err));
    }
  };

  if (batch.status === "delivered" || batch.status === "cancelled") {
    return <StatusBadge status={batch.status} />;
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={isLoading}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition hover:opacity-80 disabled:opacity-60"
        style={{
          color: STATUS_COLOR[batch.status].color,
          background: STATUS_COLOR[batch.status].bg,
        }}
      >
        {STATUS_LABEL[batch.status]}
        <ChevronDown className="h-3 w-3" aria-hidden />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-xl border border-black/[0.06] bg-white py-1 shadow-lg">
            {next.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { void handleChange(s); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: STATUS_COLOR[s].color }}
                />
                {STATUS_LABEL[s]}
              </button>
            ))}
            <div className="my-1 border-t border-gray-100" />
            <button
              type="button"
              onClick={() => { void handleChange("cancelled"); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Cancel batch
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminBatchesPage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: batches, isLoading, isError, error } = useGetAdminBatchesQuery(undefined, { skip: !token });
  const [createBatch, { isLoading: creating }] = useCreateAdminBatchMutation();
  const [labelInput, setLabelInput] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [conflictBatch, setConflictBatch] = useState<Batch | null>(null);
  const [conflict, setConflict] = useState<UnpaidItemsConflict | null>(null);
  const [nudgeUnpaid, { isLoading: nudging }] = useNudgeUnpaidBatchItemsMutation();
  const [patchStatus, { isLoading: advancing }] = usePatchAdminBatchStatusMutation();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBatch({ label: labelInput.trim() || undefined }).unwrap();
      toast.success("Batch created");
      setShowCreate(false);
      setLabelInput("");
    } catch {
      toast.error("Failed to create batch");
    }
  };

  const handleUnpaidConflict = (batch: Batch, c: UnpaidItemsConflict) => {
    setConflictBatch(batch);
    setConflict(c);
  };

  const closeConflictModal = () => {
    setConflictBatch(null);
    setConflict(null);
  };

  const handleNudge = async () => {
    if (!conflictBatch) return;
    try {
      const result = await nudgeUnpaid(conflictBatch.id).unwrap();
      toast.success(`Reminder sent to ${result.nudged} item(s)`);
      closeConflictModal();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleContinueAnyway = async () => {
    if (!conflictBatch) return;
    try {
      await patchStatus({ id: conflictBatch.id, status: "placing_orders", resolveUnpaid: "reassign" }).unwrap();
      toast.success("Batch advanced — unpaid items moved to the next batch");
      closeConflictModal();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (isLoading) return <AdminListSkeleton />;
  if (isError) return <ErrorState error={error} title="Could not load batches" />;

  const active = batches?.filter((b) => !["delivered", "cancelled"].includes(b.status)) ?? [];
  const past = batches?.filter((b) => ["delivered", "cancelled"].includes(b.status)) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Wanna Buy Batches</h1>
          <p className="mt-1 text-sm text-gray-500">Manage weekly order batches and process customer quotes.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: "#059669" }}
        >
          <Plus className="h-4 w-4" aria-hidden />
          New batch
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form
          onSubmit={(e) => { void handleCreate(e); }}
          className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4"
        >
          <input
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="Batch label (optional) — e.g. Week 27"
            className="flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-[#059669]/20"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
            style={{ background: "#059669" }}
          >
            {creating ? "Creating…" : "Create"}
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(false)}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Active batches */}
      {batches?.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-gray-50/60 py-16 text-center">
          <Layers className="mx-auto h-8 w-8 text-gray-300" aria-hidden />
          <p className="mt-3 text-sm font-medium text-gray-500">No batches yet</p>
          <p className="mt-1 text-xs text-gray-400">Create a new batch to start collecting Wanna Buy items.</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-2">
              {active.map((batch) => (
                <BatchRow key={batch.id} batch={batch} onUnpaidConflict={handleUnpaidConflict} />
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Past batches</h2>
              {past.map((batch) => (
                <BatchRow key={batch.id} batch={batch} onUnpaidConflict={handleUnpaidConflict} />
              ))}
            </div>
          )}
        </>
      )}

      <UnpaidItemsModal
        conflict={conflict}
        batchLabel={conflictBatch ? (conflictBatch.label ?? `Batch ${conflictBatch.id.slice(0, 8)}`) : undefined}
        nudging={nudging}
        advancing={advancing}
        onNudge={() => { void handleNudge(); }}
        onContinue={() => { void handleContinueAnyway(); }}
        onClose={closeConflictModal}
      />
    </div>
  );
}

function BatchRow({
  batch,
  onUnpaidConflict,
}: {
  batch: Batch;
  onUnpaidConflict: (batch: Batch, conflict: UnpaidItemsConflict) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-black/[0.06] bg-white px-5 py-4 shadow-sm">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900">
          {batch.label ?? `Batch ${batch.id.slice(0, 8)}`}
        </p>
        <p className="mt-0.5 text-[11px] text-gray-400">
          Created {new Date(batch.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          {batch.status === "collecting" && batch.collectingEndsAt && (
            <> · Closes for new items {new Date(batch.collectingEndsAt).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</>
          )}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <BatchStatusSelect batch={batch} onUnpaidConflict={onUnpaidConflict} />
        <Link
          href={`/admin/batches/${batch.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#059669] hover:underline"
        >
          View items <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
