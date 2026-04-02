"use client";

import { FormEvent, useState } from "react";

export function Newsletter() {
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section className="w-full border-b bg-white py-12" style={{ borderColor: "var(--shop-border)" }}>
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-8">
        <h2 className="text-xl font-semibold">Join the list for product tips</h2>
        <p className="mt-2 text-sm text-shop-muted">Occasional updates on new marketplace connectors and checkout improvements.</p>
        {sent ? (
          <p className="mt-6 text-sm font-medium text-shop-accent">Thanks — you&apos;re on the list.</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <input name="email" type="email" required placeholder="Email address" className="input max-w-md sm:min-w-[280px]" />
            <button type="submit" className="btn-primary uppercase tracking-wide">
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
