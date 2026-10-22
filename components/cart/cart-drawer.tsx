"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { CartPanelBody } from "@/components/cart/cart-content";
import { useAppSelector } from "@/store/hooks";

const PANEL_MS = 320;

export function CartDrawer() {
  const { drawerOpen, closeCartDrawer } = useCart();
  const token = useAppSelector((s) => s.auth.accessToken);
  const [present, setPresent] = useState(false);
  const [enter, setEnter] = useState(false);

  useEffect(() => {
    if (drawerOpen) {
      setPresent(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEnter(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setEnter(false);
    const t = window.setTimeout(() => setPresent(false), PANEL_MS);
    return () => window.clearTimeout(t);
  }, [drawerOpen]);

  useEffect(() => {
    if (!present) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [present]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCartDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, closeCartDrawer]);

  if (!present) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end overscroll-contain" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
      <button
        type="button"
        className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 ease-out ${
          enter ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close cart"
        onClick={closeCartDrawer}
      />
      <aside
        className={`relative flex h-dvh w-full flex-col bg-white shadow-[-8px_0_24px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out will-change-transform sm:max-w-[420px] sm:rounded-l-2xl ${
          enter ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="shrink-0 border-b border-black/10 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="cart-drawer-title" className="text-base font-bold uppercase tracking-wide text-shop-ink">
                Your cart
              </h2>
              {token ? (
                <p className="mt-0.5 text-xs text-black/50">Synced with your account</p>
              ) : null}
            </div>
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-shop-ink transition hover:bg-black/5"
              aria-label="Close cart"
              onClick={closeCartDrawer}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <CartPanelBody layout="drawer" onCheckoutNavigate={closeCartDrawer} />
        </div>
      </aside>
    </div>
  );
}
