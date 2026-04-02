import { redirect } from "next/navigation";

/** Legacy `/product/:id` → canonical `/products/:idOrSlug` (matches `GET /products/:idOrSlug`). */
export default async function LegacyProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/products/${encodeURIComponent(id)}`);
}
