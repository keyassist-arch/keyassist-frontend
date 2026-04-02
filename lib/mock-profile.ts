import type { ShippingAddress } from "@/types/api";

/** Demo data until profile APIs expose saved payments / multi-address. */
export const MOCK_PERSONAL = {
  firstName: "Alex",
  lastName: "Merchant",
  email: "alex.merchant@example.com",
  phone: "+1 (555) 010-2844",
  emailVerified: true,
};

export const MOCK_SHIPPING_DEFAULT: ShippingAddress = {
  fullName: "Alex Merchant",
  line1: "1200 Market Street",
  line2: "Suite 400",
  city: "San Francisco",
  state: "CA",
  country: "US",
  postalCode: "94102",
  phone: "+1 (555) 010-2844",
};

export const MOCK_SHIPPING_ALT: ShippingAddress = {
  fullName: "Alex Merchant",
  line1: "88 Wharf Road",
  line2: "",
  city: "Lagos",
  state: "LA",
  country: "NG",
  postalCode: "101233",
  phone: "+234 800 000 0000",
};

export type MockPaymentProvider = "stripe" | "paypal";

export interface MockStripeMethod {
  provider: "stripe";
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export interface MockPayPalMethod {
  provider: "paypal";
  id: string;
  payerEmail: string;
  status: "linked" | "needs_attention";
  isDefault: boolean;
}

export type MockPaymentMethod = MockStripeMethod | MockPayPalMethod;

export const MOCK_PAYMENT_METHODS: MockPaymentMethod[] = [
  {
    provider: "stripe",
    id: "pm_mock_visa",
    brand: "Visa",
    last4: "4242",
    expMonth: 12,
    expYear: 2027,
    isDefault: true,
  },
  {
    provider: "paypal",
    id: "pp_mock_primary",
    payerEmail: "alex.merchant@example.com",
    status: "linked",
    isDefault: false,
  },
];
