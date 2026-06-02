"use client";

import { useId, useMemo, useState } from "react";

const allowedSources = ["nike", "amazon", "apple", "goat", "zara", "ebay", "stockx", "converse"];

interface SearchInputProps {
  onSearch?: (query: string) => void;
  variant?: "default" | "hero";
}

export function SearchInput({ onSearch, variant = "default" }: SearchInputProps) {
  const [value, setValue] = useState("");
  const inputId = useId();

  const sourceHint = useMemo(() => {
    const lower = value.toLowerCase();
    const matched = allowedSources.find((source) => lower.includes(source));
    return matched ? `Detected source: ${matched}` : "Paste any product URL or keyword";
  }, [value]);

  const wrapper = variant === "hero" ? "w-full" : "card flex flex-col gap-3";

  return (
    <div className={wrapper}>
      <label htmlFor={inputId} className="sr-only">
        Search or paste marketplace URL
      </label>

      <div className={variant === "hero" ? "flex flex-col gap-2 sm:flex-row" : "flex flex-col gap-2 sm:flex-row"}>
        <input
          id={inputId}
          type="search"
          enterKeyHint="search"
          className={variant === "hero" ? "input flex-1" : "input"}
          placeholder="Paste: Amazon / Apple / Nike / GOAT URL"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <button className="btn-primary" type="button" onClick={() => onSearch?.(value)}>
          Paste URL
        </button>
      </div>

      {variant === "default" ? (
        <p className="text-xs text-black/60 dark:text-white/60">{sourceHint}</p>
      ) : (
        <p className="mt-2 text-xs text-black/60 dark:text-white/60">{sourceHint}</p>
      )}
    </div>
  );
}
