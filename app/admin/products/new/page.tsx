"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useCreateAdminProductMutation } from "@/store/routes/unified-commerce-api";
import { ProductForm } from "@/components/admin/product-form";
import { getErrorMessage } from "@/lib/rtk-error";
import type { AdminCreateProductRequest } from "@/types/api";

export default function NewAdminProductPage() {
  const router = useRouter();
  const [createProduct, { isLoading }] = useCreateAdminProductMutation();

  const handleSubmit = async (body: AdminCreateProductRequest) => {
    try {
      await createProduct(body).unwrap();
      toast.success("Product created");
      router.push("/admin/products");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

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
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Add product</h1>
      </div>

      <ProductForm submitLabel="Create product" submitting={isLoading} onSubmit={handleSubmit} />
    </div>
  );
}
