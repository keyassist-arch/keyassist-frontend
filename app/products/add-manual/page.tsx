import { Suspense } from "react";
import type { Metadata } from "next";
import { InnerShell } from "@/components/layout/inner-shell";
import { AddManualProductForm } from "@/components/storefront/add-manual-product-form";

export const metadata: Metadata = {
  title: "Add product manually",
};

export default function AddManualProductPage() {
  return (
    <InnerShell>
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/50">
            Add product
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-shop-ink sm:text-3xl">
            Enter product details
          </h1>
          <p className="mt-2 text-sm text-black/60">
            We couldn&apos;t automatically import this product. Fill in the details below and
            we&apos;ll add it to your catalog.
          </p>
        </header>

        <Suspense>
          <AddManualProductForm />
        </Suspense>
      </div>
    </InnerShell>
  );
}
