import { Suspense } from "react";
import { CheckoutClient } from "./checkout-client";

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutClient />
    </Suspense>
  );
}

