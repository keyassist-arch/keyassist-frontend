"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useGetAdminProductsQuery, useUpdateAdminProductMutation } from "@/store/routes/unified-commerce-api";
import { LoadingState, ErrorState } from "@/components/feedback/query-state";
import { ProductForm } from "@/components/admin/product-form";
import { getErrorMessage } from "@/lib/rtk-error";
import type { AdminCreateProductRequest } from "@/types/api";

export default function EditAdminProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: products, isLoading, isError, error } = useGetAdminProductsQuery();
  const [updateProduct, { isLoading: saving }] = useUpdateAdminProductMutation();

  const product = products?.find((p) => p.id === id);

  const handleSubmit = async (body: AdminCreateProductRequest) => {
    try {
      await updateProduct({ id, body }).unwrap();
      toast.success("Product updated");
      router.push("/admin/products");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (isLoading) return <LoadingState label="Loading product…" />;
  if (isError) return <ErrorState error={error} title="Could not load product" />;
  if (!product) return <ErrorState error="Product not found" title="Could not load product" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Products
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 truncate">Edit {product.title}</h1>
      </div>

      <ProductForm
        initial={product}
        submitLabel="Save changes"
        submitting={saving}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
