export function MetricsRow() {
  const metrics = [
    { value: "4+", label: "Marketplaces supported" },
    { value: "1", label: "Unified checkout flow" },
    { value: "2–8", label: "Delivery estimate ranges" },
    { value: "Staff", label: "Secure tools for your team" },
  ];

  return (
    <section className="rounded-3xl border p-6 md:p-10" style={{ background: "var(--shop-surface)", borderColor: "var(--shop-border)" }}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="shop-muted-card rounded-2xl p-6">
            <p className="text-3xl font-semibold tracking-tight">{m.value}</p>
            <p className="mt-2 text-sm text-black/60">{m.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

