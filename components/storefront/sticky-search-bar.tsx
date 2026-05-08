"use client";

import { FormEvent, useId, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const BRAND_COLOR = "#5C4AE6";

export function StickySearchBar() {
  const router = useRouter();
  const searchId = useId();
  const [q, setQ] = useState("");
  const [visible, setVisible] = useState(false);

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

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="sticky-search"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
          className="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-4 lg:left-[84px]"
        >
          <form
            onSubmit={onSubmit}
            className="w-full max-w-xl"
          >
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
      )}
    </AnimatePresence>
  );
}
