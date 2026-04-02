"use client";

import { useEffect, useState } from "react";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function endOfWeekTimestamp() {
  const d = new Date();
  const day = d.getDay();
  const daysUntilSun = day === 0 ? 7 : 7 - day;
  const end = new Date(d);
  end.setDate(d.getDate() + daysUntilSun);
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}

export function ProductPdpCountdown() {
  const [tick, setTick] = useState<{ now: number; end: number } | null>(null);

  useEffect(() => {
    const end = endOfWeekTimestamp();
    const pulse = () => setTick({ now: Date.now(), end });
    pulse();
    const id = setInterval(pulse, 1000);
    return () => clearInterval(id);
  }, []);

  const diff = tick == null ? 0 : Math.max(0, tick.end - tick.now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  const cells = [
    { label: "Days", v: d },
    { label: "Hour", v: h },
    { label: "Min", v: m },
    { label: "Sec", v: s },
  ];

  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-red-600">Hurry Up! Deals End In:</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {cells.map((u) => (
          <div
            key={u.label}
            className="flex min-w-[4.5rem] flex-col items-center border border-black/15 bg-white px-3 py-2 text-center"
          >
            <span className="text-lg font-semibold tabular-nums text-shop-ink">{tick == null ? "00" : pad(u.v)}</span>
            <span className="text-[11px] text-black/50">{u.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
