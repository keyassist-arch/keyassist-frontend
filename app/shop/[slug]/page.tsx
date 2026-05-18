import type { Metadata } from "next";
import { CategoryPageClient } from "./category-page-client";
import type { Category } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

async function fetchCategoryMeta(slug: string): Promise<Category | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategoryMeta(slug);

  if (!category) return { title: "Category" };

  const description =
    category.description?.trim() ||
    `Shop ${category.productCount} ${category.name} products on Key Assist. Browse and compare from top marketplaces.`;

  return {
    title: category.name,
    description,
    openGraph: {
      title: category.name,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: category.name,
      description,
    },
  };
}

export default function CategoryPage() {
  return <CategoryPageClient />;
}
