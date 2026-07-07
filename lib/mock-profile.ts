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
