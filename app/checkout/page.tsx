import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutClient />
    </Suspense>
  );
}

