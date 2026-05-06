"use client";

import { FormEvent, useState } from "react";
import toast from "react-hot-toast";

const TOPICS = [
  { value: "general", label: "General question" },
  { value: "order", label: "Order or delivery" },
  { value: "payment", label: "Payments & refunds" },
  { value: "account", label: "Account & sign-in" },
  { value: "partnership", label: "Partnership or press" },
  { value: "other", label: "Other" },
] as const;

export function ContactForm() {
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 400));
    setSending(false);
    toast.success("Thanks — we received your message and will reply by email.");
    e.currentTarget.reset();
  };

  return (
    <div className="card border-shop-border/80">
      <h2 className="text-lg font-semibold text-shop-ink">Send a message</h2>
      <p className="mt-1 text-sm text-black/65">
        Fill in the form and we&apos;ll respond to the email you provide. For urgent order issues, include your order ID if you have one.
      </p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block space-y-1 text-sm">
          <span className="text-black/70">Full name</span>
          <input className="input w-full" name="name" type="text" autoComplete="name" required placeholder="Jane Doe" />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-black/70">Email</span>
          <input
            className="input w-full"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-black/70">Topic</span>
          <select className="input w-full" name="topic" required defaultValue="">
            <option value="" disabled>
              Select a topic
            </option>
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-black/70">Order ID (optional)</span>
          <input className="input w-full" name="orderId" type="text" placeholder="e.g. the order number from your confirmation email" />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-black/70">Message</span>
          <textarea
            className="input min-h-[140px] w-full resize-y py-2.5"
            name="message"
            required
            rows={5}
            placeholder="How can we help?"
          />
        </label>
        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={sending}>
          {sending ? "Sending…" : "Send message"}
        </button>
      </form>
    </div>
  );
}
