@AGENTS.md

---

# Design System — Key Assist Storefront

## Guiding principle
Rounded, warm, and human. Every interactive surface should feel approachable: no hard square corners on buttons or inputs. Cards breathe with consistent padding. Colors pull from the indigo-stone palette defined in `globals.css`.

---

## Radius scale

| Token | Value | Apply to |
|---|---|---|
| `rounded-lg` | 8 px | Small chips, thumbnail borders, inline badges |
| `rounded-xl` | 12 px | **Buttons, inputs, textareas, selects** |
| `rounded-2xl` | 16 px | **Cards, panels, drawers, modals, product images** |
| `rounded-3xl` | 24 px | Large marketing / hero panels |
| `rounded-full` | 9999 px | Pills, avatars, icon-only buttons, dot indicators |

**Never use `rounded-none` on user-facing interactive elements.** The only exceptions are deliberate full-bleed dividers or decorative rules.

---

## Color tokens (`app/globals.css`)

```
Background / Surface
  --background / --shop-surface   #fafaf9   warm stone-50
  --shop-white                    #ffffff
  --shop-border                   #e7e5e4   stone-200

Text
  --shop-ink                      #1c1917   stone-900  (headings, strong)
  --shop-muted                    #78716c   stone-500  (secondary text)

Primary action (buttons, key links)
  --shop-primary                  #065f46   emerald-800
  --shop-primary-hover            #064e3b   emerald-900

Accent (highlights, focus rings, hover states)
  --shop-accent                   #10b981   emerald-500
  --shop-accent-hover             #059669   emerald-600
  --shop-accent-soft              #ecfdf5   emerald-50

Dark sections (footer, top-bar)
  --shop-dark                     #1c1917   stone-900
  --shop-dark-soft                #292524   stone-800

Semantic
  --shop-sale                     #dc2626   red-600
  --shop-star                     #f59e0b   amber-500
```

Do **not** use `--shop-green` / `--shop-green-hover` / `--shop-green-soft` — those are stale aliases for indigo and should be removed.

---

## Typography

| Role | Classes |
|---|---|
| Display / Hero | `text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight` |
| Section heading | `text-2xl font-semibold tracking-tight` |
| Card title | `text-lg font-semibold` |
| Body | `text-sm leading-relaxed text-shop-ink` |
| Muted / caption | `text-xs text-shop-muted` |
| Label / badge | `text-[11px] font-semibold uppercase tracking-widest` |

Font family: Geist Sans (`var(--font-geist-sans)`).

---

## Buttons

| Class | Use |
|---|---|
| `.btn-primary` | Primary CTA — indigo fill, `rounded-xl` |
| `.btn-secondary` | Secondary — outlined, `rounded-xl` |
| `.btn-ghost` | Low-emphasis — transparent, hover background |
| `.btn-danger` | Destructive — red fill, `rounded-xl` |

All buttons: `rounded-xl px-5 py-2.5 text-sm font-medium transition`.

---

## Cards / surfaces

| Class | Description |
|---|---|
| `.card` | White, `rounded-2xl border p-6` |
| `.shop-surface` | Stone-50 background section |
| `.shop-dark-section` | Stone-900 full-bleed section |
| `.shop-dark-card` | Stone-800 card inside dark sections |

---

## Form inputs

All `.input` elements: `rounded-xl border border-shop-border bg-white px-4 py-2.5 text-sm`.  
Focus: indigo accent border + `box-shadow` ring (already defined in globals).

---

# Redesign Checklist

Work through these in order. Mark each `[x]` when done.

## Phase 1 — Foundations (`app/globals.css`)
- [x] `btn-primary`: change `rounded-none` → `rounded-xl`
- [x] `btn-secondary`: change `rounded-none` → `rounded-xl`
- [x] `.input`: remove `rounded-none` and `border-radius: 0`, add `rounded-xl`
- [x] Remove stale aliases: `--shop-green`, `--shop-green-hover`, `--shop-green-soft`
- [x] Add `.btn-ghost` utility class
- [x] Add `.btn-danger` utility class

## Phase 2 — Global UI components
- [x] `components/ui/steps.tsx` — step buttons `rounded-none` → `rounded-xl`; step circles → `rounded-full`
- [x] `components/ui/accordion.tsx` — unify dark/light variants; both should use `rounded-2xl`
- [x] `components/ui/badge.tsx` — audit; ensure uses `rounded-full` and correct color tokens
- [x] `components/ui/status-badge.tsx` — align with badge.tsx tokens
- [x] `components/feedback/query-state.tsx` — confirm error/success/loading states use `rounded-xl`

## Phase 3 — Storefront shell
- [x] `components/storefront/store-main-header.tsx` — search input → `rounded-xl`; icon button → `rounded-xl`
- [x] `components/storefront/store-sub-nav.tsx` — nav filter chips → `rounded-full`
- [x] `components/storefront/store-top-bar.tsx` — review, tighten spacing
- [x] `components/storefront/store-product-card.tsx` — card `rounded-none` → `rounded-2xl`; add `hover:shadow-md` transition
- [x] `components/storefront/newsletter.tsx` — input + button → `rounded-xl`
- [x] `components/storefront/promo-banners.tsx` — verify consistent with new card tokens
- [x] `components/storefront/promo-three.tsx` — verify consistent with new card tokens
- [x] `components/storefront/how-it-works.tsx` — step/icon containers → `rounded-2xl`
- [x] `components/storefront/testimonials.tsx` — review card padding and radius
- [x] `components/storefront/blog-teasers.tsx` — image radius → `rounded-2xl`; card → `rounded-2xl`

## Phase 4 — Product
- [x] `components/product/product-card.tsx` — image `rounded-xl`; card hover shadow
- [x] `components/product/product-detail-gallery.tsx` — main image + thumbnails all `rounded-xl`
- [x] `components/product/product-detail-tabs.tsx` — tab buttons `rounded-none` → `rounded-xl` pill style
- [x] `components/product/product-quantity-stepper.tsx` — wrapper → `rounded-xl`; inner buttons → `rounded-lg`
- [x] `components/product/product-detail-zones.tsx` — compliance callout → `rounded-xl` (remove raw `border-l-4` only style)
- [x] `components/product/product-detail-layout.tsx` — audit spacing, ensure section dividers consistent

## Phase 5 — Cart & Checkout
- [x] `components/cart/cart-content.tsx` — cart item cards → confirm `rounded-2xl`; buttons → `rounded-xl`
- [x] `components/cart/pending-order-banner.tsx` — banner → `rounded-xl`
- [x] `app/checkout/checkout-client.tsx` — all inputs/buttons → `rounded-xl`

## Phase 6 — Auth
- [x] `app/auth/login/page.tsx` — inputs + submit button → `rounded-xl`
- [x] `app/auth/register/page.tsx` — inputs + submit button → `rounded-xl`
- [x] `app/auth/forgot-password/page.tsx` — inputs + submit button → `rounded-xl`

## Phase 7 — Dashboard
- [x] `app/dashboard/page.tsx` — audit card usage, ensure `.card` class used consistently
- [x] `components/dashboard/order-card.tsx` — confirm `rounded-2xl` hover state correct
- [x] `app/dashboard/orders/[id]/page.tsx` — audit
- [x] `app/dashboard/profile/page.tsx` — form inputs → `rounded-xl`
- [x] `app/dashboard/settings/page.tsx` — form inputs → `rounded-xl`

## Phase 8 — Marketing & misc
- [x] `components/marketing/faq-section.tsx` — review accordion radius
- [x] `components/marketing/marketing-hero.tsx` — audit radius + button styles
- [x] `components/marketing/feature-grid.tsx` — cards → `rounded-2xl`
- [x] `components/marketing/metrics-row.tsx` — cards → `rounded-2xl`
- [x] `components/marketing/support-section.tsx` — audit buttons + cards
- [x] `app/contact/page.tsx` — form inputs + button → `rounded-xl`
- [x] `app/shop/page.tsx` — audit filter/sort controls
