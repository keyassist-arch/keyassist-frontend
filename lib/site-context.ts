/**
 * Key Assist — storefront copy and positioning (reference: full-page marketplace layout).
 * Single source for hero, nav labels, and trust messaging.
 */
export const siteContext = {
  brand: "Key Assist",
  tagline: "One cart. Many marketplaces.",
  topBar: {
    left: "Track orders in your dashboard · Paste product URLs to add from Amazon, Apple, Nike, GOAT & more",
  },
  hero: {
    /** Small uppercase promo line (Woodisa-style rail). */
    promoTag: "FLAT 10% OFF ALL ITEMS",
    /** Text-only carousel slides (no product image). */
    slides: [
      {
        title: "Choose from listings across every marketplace you use.",
        body:
          "Search or paste a product link from Amazon, Apple, Nike, GOAT, and more. See titles, prices, and options clearly so you can compare before you buy.",
      },
      {
        title: "One cart. One checkout. Real seller context.",
        body:
          "Review delivery estimates, retailer availability, and your choices in one place. Sign in to save your bag and pay securely at checkout.",
      },
      {
        title: "Paste a link — we pull the listing for you.",
        body:
          "Paste a marketplace URL in the search bar, open the product, choose your options, and add it to your cart.",
      },
    ],
    ctaLabel: "Shop now",
    ctaHref: "/shop",
  },
} as const;
