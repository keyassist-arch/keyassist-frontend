"use client";

import { ArrowRight } from "lucide-react";

export function FooterNewsletter() {
  return (
    <form
      className="flex w-full items-center gap-2 rounded-full py-1.5 pl-4 pr-1.5"
      style={{ background: "#2A2523", border: "1px solid #3A3532" }}
      onSubmit={(e) => e.preventDefault()}
    >
      <label htmlFor="footer-newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="footer-newsletter-email"
        type="email"
        placeholder="Email address"
        className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-[#8A847E]"
      />
      <button
        type="submit"
        aria-label="Subscribe"
        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full transition hover:opacity-90"
        style={{ background: "var(--shop-primary)" }}
      >
        <ArrowRight className="h-4 w-4 text-white" aria-hidden />
      </button>
    </form>
  );
}
