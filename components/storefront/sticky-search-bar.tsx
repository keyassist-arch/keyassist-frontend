"use client";

import { FormEvent, useId, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const BRAND_COLOR = "#5C4AE6";

export function StickySearchBar() {
  const router = useRouter();
  const searchId = useId();
  const [q, setQ] = useState("");
  const [visible, setVisible] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const hero = document.getElementById("hero-search");

    if (!hero) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [mobileOpen]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setMobileOpen(false);
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Desktop/tablet: full sticky search bar */}
          <motion.div
            key="sticky-search-desktop"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="fixed bottom-6 left-0 right-0 z-40 hidden justify-center px-4 md:flex lg:left-[84px]"
          >
            <form onSubmit={onSubmit} className="w-full max-w-xl">
              <div className="flex items-center rounded-full border border-gray-200 bg-white px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.14)]">
                <label htmlFor={searchId} className="sr-only">
                  What are you shopping for today?
                </label>
                <input
                  id={searchId}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="What are you shopping for today?"
                  className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition hover:opacity-90"
                  style={{ background: BRAND_COLOR }}
                  aria-label="Search"
                >
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </form>
          </motion.div>

          {/* Mobile: floating search icon (FAB) */}
          <motion.button
            key="sticky-search-mobile-fab"
            type="button"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            onClick={() => setMobileOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-[0_10px_36px_rgba(0,0,0,0.22)] md:hidden"
            style={{ background: BRAND_COLOR }}
            aria-label="Open search"
          >
            <Search className="h-5 w-5" aria-hidden />
          </motion.button>

          <AnimatePresence>
            {mobileOpen && (
              <>
                <motion.div
                  key="sticky-search-mobile-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="fixed inset-0 z-50 bg-black/40 md:hidden"
                  onClick={() => setMobileOpen(false)}
                />
                <motion.div
                  key="sticky-search-mobile-modal"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                  className="fixed inset-x-0 bottom-0 z-[60] p-4 md:hidden"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Search"
                >
                  <form onSubmit={onSubmit} className="rounded-2xl border border-gray-200 bg-white p-3 shadow-[0_16px_60px_rgba(0,0,0,0.22)]">
                    <div className="flex items-center gap-2">
                      <label htmlFor={`${searchId}-mobile`} className="sr-only">
                        What are you shopping for today?
                      </label>
                      <input
                        ref={inputRef}
                        id={`${searchId}-mobile`}
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search or paste a product URL…"
                        className="h-11 w-full rounded-xl bg-gray-50 px-4 text-sm text-gray-800 outline-none placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => setMobileOpen(false)}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="submit"
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-white transition hover:opacity-90"
                        style={{ background: BRAND_COLOR }}
                        aria-label="Search"
                      >
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </form>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
