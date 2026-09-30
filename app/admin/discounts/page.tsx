"use client";

import { useState } from "react";
import { FormEvent } from "react";
import { useAppSelector } from "@/store/hooks";
import {
  useGetAdminDiscountSettingsQuery,
  usePatchAdminDiscountSettingsMutation,
} from "@/store/routes/unified-commerce-api";
import { ErrorState, SuccessState } from "@/components/feedback/query-state";
import { AdminListSkeleton } from "@/components/dashboard/admin-list-skeleton";
import { getErrorMessage } from "@/lib/rtk-error";
import type { DiscountSettingsResponse } from "@/types/api";

const INPUT_CLASS =
  "w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10";

/** API stores rates as fractions; the form edits them as percentages. */
function toPercent(rate: string | number | undefined): string {
  const n = Number(rate ?? 0);
  return Number.isFinite(n) ? String(Math.round(n * 10_000) / 100) : "0";
}

function toNumber(value: string | number | undefined): string {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? String(n) : "0";
}

export default function AdminDiscountsPage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data, isLoading, isError, error } = useGetAdminDiscountSettingsQuery(undefined, { skip: !token });

  if (isError) return <ErrorState error={error} title="Could not load discount settings" />;
  if (isLoading || !data) return <AdminListSkeleton />;

  return <DiscountSettingsForm settings={data} />;
}

function DiscountSettingsForm({ settings }: { settings: DiscountSettingsResponse }) {
  const [patchSettings, { isLoading: saving }] = usePatchAdminDiscountSettingsMutation();

  const [firstOrderPct, setFirstOrderPct] = useState(() => toPercent(settings.firstOrderDiscountRate));
  const [volumePct, setVolumePct] = useState(() => toPercent(settings.volumeDiscountRate));
  const [threshold, setThreshold] = useState(() => toNumber(settings.volumeDiscountThresholdUsd));
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNotice(null);
    const first = Number(firstOrderPct);
    const volume = Number(volumePct);
    const min = Number(threshold);
    if (![first, volume].every((n) => Number.isFinite(n) && n >= 0 && n <= 100)) {
      setNotice({ ok: false, text: "Discount percentages must be between 0 and 100." });
      return;
    }
    if (!Number.isFinite(min) || min < 0) {
      setNotice({ ok: false, text: "Threshold must be 0 or more." });
      return;
    }
    try {
      await patchSettings({
        firstOrderDiscountRate: Math.round(first * 100) / 10_000,
        volumeDiscountRate: Math.round(volume * 100) / 10_000,
        volumeDiscountThresholdUsd: min,
      }).unwrap();
      setNotice({ ok: true, text: "Discount settings saved. New carts and quotes use them immediately." });
    } catch (err) {
      setNotice({ ok: false, text: getErrorMessage(err) });
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Discounts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Discounts are off (0%) unless set here. Changes apply to new carts, quotes, and orders, not to
          orders already placed.
        </p>
      </section>

      {notice?.ok && <SuccessState message={notice.text} />}
      {notice && !notice.ok && <ErrorState error={notice.text} title="Save failed" />}

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <form className="space-y-6" onSubmit={onSubmit}>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">First-order discount</h2>
            <p className="mt-1 text-xs text-gray-500">
              Percentage off the platform service fee on a customer&apos;s first order.
            </p>
            <label className="mt-3 block max-w-xs space-y-1 text-xs">
              <span className="font-medium text-gray-500">Discount (%)</span>
              <input
                className={INPUT_CLASS}
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={firstOrderPct}
                onChange={(e) => setFirstOrderPct(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h2 className="text-lg font-semibold text-gray-900">Volume discount</h2>
            <p className="mt-1 text-xs text-gray-500">
              Percentage off the product subtotal when it exceeds the threshold.
            </p>
            <div className="mt-3 grid max-w-xl gap-3 sm:grid-cols-2">
              <label className="block space-y-1 text-xs">
                <span className="font-medium text-gray-500">Discount (%)</span>
                <input
                  className={INPUT_CLASS}
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={volumePct}
                  onChange={(e) => setVolumePct(e.target.value)}
                  required
                />
              </label>
              <label className="block space-y-1 text-xs">
                <span className="font-medium text-gray-500">Applies above subtotal (USD)</span>
                <input
                  className={INPUT_CLASS}
                  type="number"
                  min={0}
                  step="0.01"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  required
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[#059669] px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save discounts"}
          </button>
        </form>
      </section>
    </div>
  );
}
