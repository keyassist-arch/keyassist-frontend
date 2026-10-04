"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { CheckCircle, ExternalLink, Package, ShoppingCart } from "lucide-react";
import { useApproveAdminManualImportToCartMutation } from "@/store/routes/unified-commerce-api";
import type { ManualImportRequestSummary } from "@/types/api";
import { getErrorMessage } from "@/lib/rtk-error";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  request: ManualImportRequestSummary | null;
  onClose: () => void;
  onApproved: () => void;
}

export function AdminManualImportApproveModal({ request, onClose, onApproved }: Props) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [errorMsg, setErrorMsg] = useState("");

  const [approveToCart, { isLoading: approving }] = useApproveAdminManualImportToCartMutation();

  useEffect(() => {
    if (request?.product) {
      setTitle(request.product.title || "");
      const parsedPrice = parseFloat(request.product.salePrice || "0");
      setPrice(parsedPrice > 0 ? String(parsedPrice) : "");
      setCurrency(request.product.currency || "USD");
      setErrorMsg("");
    }
  }, [request]);

  const close = () => {
    setErrorMsg("");
    onClose();
  };

  const onConfirm = async () => {
    if (!request?.product) return;
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setErrorMsg("Please enter a valid verified price greater than 0.");
      return;
    }

    setErrorMsg("");
    try {
      await approveToCart({
        id: request.id,
        body: {
          price: numPrice,
          currency: currency.trim() || "USD",
          title: title.trim() || undefined,
        },
      }).unwrap();

      toast.success("Quote approved and added to customer's cart! Notification email sent.");
      onApproved();
      close();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  };

  if (!request) return null;

  const product = request.product;
  const image = product?.images?.[0];
  const requester = request.requestedByUser;
  const requesterDisplay = requester
    ? [requester.firstName, requester.lastName].filter(Boolean).join(" ") || requester.email
    : "Customer";

  return (
    <Dialog open={Boolean(request)} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-gray-900">
                Approve & Add to Cart
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Set the verified item price and deposit directly into {requesterDisplay}&apos;s cart.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Product Summary Preview */}
          <div className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-white">
              {image ? (
                <Image src={image} alt="" fill unoptimized className="object-contain p-1" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-300">
                  <Package className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 text-xs">
              <p className="font-semibold text-gray-900 truncate">{product?.title || "Manual Product"}</p>
              <div className="mt-1 flex items-center gap-1 text-gray-500">
                <a
                  href={request.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-700 hover:underline max-w-[220px] truncate"
                >
                  <span>{request.sourceUrl}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
              <p className="mt-1 text-gray-400">
                Customer: <span className="text-gray-700 font-medium">{requesterDisplay}</span> ({requester?.email})
              </p>
            </div>
          </div>

          {/* Customer notes if any */}
          {product?.description && (
            <div className="rounded-lg bg-amber-50/70 border border-amber-200/60 p-2.5 text-xs text-amber-900">
              <span className="font-semibold">Customer notes: </span>
              {product.description}
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Product Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Product name"
                className="input w-full text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Verified Unit Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 49.99"
                  className="input w-full text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="input w-full text-sm uppercase"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="NGN">NGN (₦)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Flow information callout */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-xs text-emerald-900 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
              What happens on approval:
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-emerald-700">
              <li>Item is added directly into {requesterDisplay}&apos;s active cart at the verified price.</li>
              <li>An email notification is automatically dispatched (&ldquo;Manual Import added&rdquo;).</li>
              <li>Customer can combine it with any other cart items and checkout seamlessly.</li>
            </ul>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
          )}
        </div>

        <DialogFooter className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={close}
            disabled={approving}
            className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={approving || !price}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {approving ? "Approving..." : "Approve & Add to Cart"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
