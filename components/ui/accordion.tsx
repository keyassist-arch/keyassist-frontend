"use client";

import { useId, useState } from "react";

export function Accordion({
  items,
  tone = "light",
}: {
  items: Array<{
    question: string;
    answer: string;
  }>;
  tone?: "light" | "dark";
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const groupId = useId();

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        const btnId = `${groupId}-btn-${idx}`;
        const panelId = `${groupId}-panel-${idx}`;
        const wrapperClass =
          tone === "dark"
            ? "border-b border-white/10 pb-3"
            : "card p-5";

        return (
          <div key={item.question} className={wrapperClass}>
            <button
              id={btnId}
              type="button"
              className="flex w-full items-center justify-between gap-3 text-left"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? null : idx)}
            >
              <span className={tone === "dark" ? "text-2xl font-medium text-white" : "text-sm font-semibold"}>
                {item.question}
              </span>
              <span
                aria-hidden
                className={
                  tone === "dark"
                    ? "inline-flex h-9 w-9 items-center justify-center rounded-none border border-shop-accent/50 text-xl leading-none text-shop-accent"
                    : "text-lg leading-none"
                }
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen ? (
              <div
                id={panelId}
                role="region"
                aria-labelledby={btnId}
                className={tone === "dark" ? "mt-3 max-w-3xl text-sm text-white/70" : "mt-3 text-sm text-black/70 dark:text-white/70"}
              >
                {item.answer}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

