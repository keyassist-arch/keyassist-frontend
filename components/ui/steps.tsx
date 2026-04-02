import Link from "next/link";

export function Steps({
  current,
  steps,
}: {
  current: number;
  steps: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav aria-label="Checkout steps" className="flex flex-wrap gap-3">
      {steps.map((s, idx) => {
        const isActive = idx === current;
        const isDone = idx < current;
        const common =
          "flex items-center gap-2 rounded-none border px-4 py-2 text-sm transition dark:border-white/10";
        const cls = isActive
          ? "border-black bg-black text-white dark:border-white"
          : isDone
            ? "border-black/15 bg-black/5 text-black/80 dark:border-white/15 dark:bg-white/5 dark:text-white/80"
            : "border-black/10 bg-white text-black/60 dark:border-white/10 dark:bg-neutral-950 dark:text-white/60";

        const content = (
          <>
            <span className={`inline-flex h-7 w-7 items-center justify-center rounded-none ${isDone ? "bg-black text-white" : "bg-black/5 text-black dark:bg-white/5 dark:text-white"}`}>
              {isDone ? "✓" : idx + 1}
            </span>
            <span className="font-medium">{s.label}</span>
          </>
        );

        return (
          <div key={s.label} className={common + " " + cls}>
            {s.href ? (
              <Link href={s.href} className="flex items-center gap-2">
                {content}
              </Link>
            ) : (
              content
            )}
          </div>
        );
      })}
    </nav>
  );
}

