"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  useGetLandedCostQuoteMutation,
  usePlaceAdminManualImportOrderMutation,
} from "@/store/routes/unified-commerce-api";
import type {
  LandedCostCategory,
  LandedCostDestination,
  LandedCostQuoteResponse,
  LandedCostService,
  ManualImportRequestSummary,
  OrderResponse,
  ShippingAddress,
} from "@/types/api";
import { getErrorMessage } from "@/lib/rtk-error";
import { formatApiMoney } from "@/lib/format-price";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  request: ManualImportRequestSummary | null;
  onClose: () => void;
  onPlaced: (order: OrderResponse) => void;
}

const EMPTY_ADDRESS = { fullName: "", line1: "", line2: "", city: "", state: "", country: "NG", postalCode: "", phone: "" };

export function AdminManualImportOrderModal({ request, onClose, onPlaced }: Props) {
  const [destination, setDestination] = useState<LandedCostDestination>("lagos");
  const [shippingService, setShippingService] = useState<LandedCostService>("air");
  const [category, setCategory] = useState<LandedCostCategory>("generic");
  const [insurance, setInsurance] = useState(false);
  const [quote, setQuote] = useState<LandedCostQuoteResponse | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [overrideAddress, setOverrideAddress] = useState(false);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [placeError, setPlaceError] = useState("");

  const [getLandedCostQuote, { isLoading: quoting }] = useGetLandedCostQuoteMutation();
  const [placeOrder, { isLoading: placing }] = usePlaceAdminManualImportOrderMutation();

  const reset = () => {
    setQuote(null);
    setQuoteError("");
    setPlaceError("");
    setOverrideAddress(false);
    setAddress(EMPTY_ADDRESS);
    setInsurance(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const onGetQuote = async () => {
    if (!request?.product) return;
    setQuoteError("");
    try {
      const result = await getLandedCostQuote({
        productId: request.product.id,
        quantity: 1,
        destination,
        shippingService,
        category,
        displayCurrency: "USD",
        insurance,
      }).unwrap();
      setQuote(result);
    } catch (err) {
      setQuoteError(getErrorMessage(err));
      setQuote(null);
    }
  };

  const onConfirm = async () => {
    if (!request) return;
    setPlaceError("");
    const shippingAddress: ShippingAddress | undefined = overrideAddress
      ? {
          fullName: address.fullName.trim(),
          line1: address.line1.trim(),
          line2: address.line2.trim() || undefined,
          city: address.city.trim(),
          state: address.state.trim() || undefined,
          country: address.country.trim(),
          postalCode: address.postalCode.trim() || undefined,
          phone: address.phone.trim() || undefined,
        }
      : undefined;
    try {
      const order = await placeOrder({
        id: request.id,
        body: { landedCost: { destination, shippingService, category, insurance }, shippingAddress },
      }).unwrap();
      toast.success("Order placed for the customer.");
      close();
      onPlaced(order);
    } catch (err) {
      setPlaceError(getErrorMessage(err));
    }
  };

  return (
    <Dialog open={request != null} onOpenChange={(next) => { if (!next) close(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Place order for customer</DialogTitle>
          <DialogDescription>
            {request?.product?.title ?? "Manual import"} — for {request?.requestedByUser?.email ?? "unknown customer"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="text-shop-muted">Destination</span>
              <select
                className="input w-full"
                value={destination}
                onChange={(e) => {
                  const next = e.target.value as LandedCostDestination;
                  setDestination(next);
                  if (next !== "lagos") setInsurance(false);
                  setQuote(null);
                }}
              >
                <option value="lagos">Lagos</option>
                <option value="outside_lagos">Outside Lagos</option>
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-shop-muted">Shipping service</span>
              <select
                className="input w-full"
                value={shippingService}
                onChange={(e) => { setShippingService(e.target.value as LandedCostService); setQuote(null); }}
              >
                <option value="air">Air (faster)</option>
                <option value="ocean_small">Ocean small box</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1 text-sm">
            <span className="text-shop-muted">Product category</span>
            <select
              className="input w-full"
              value={category}
              onChange={(e) => { setCategory(e.target.value as LandedCostCategory); setQuote(null); }}
            >
              <option value="generic">General / Other</option>
              <option value="sneakers">Sneakers</option>
              <option value="clothing">Clothing</option>
              <option value="phone">Phone</option>
              <option value="laptop">Laptop</option>
              <option value="tablet">Tablet</option>
              <option value="tv">TV</option>
              <option value="electronics_small">Electronics (small)</option>
              <option value="electronics_large">Electronics (large)</option>
              <option value="accessories">Accessories</option>
              <option value="books">Books</option>
            </select>
          </label>

          {destination === "lagos" && (
            <label className="flex items-center gap-2 text-sm text-shop-ink">
              <input
                type="checkbox"
                checked={insurance}
                onChange={(e) => { setInsurance(e.target.checked); setQuote(null); }}
              />
              Add cargo insurance (3% of item cost)
            </label>
          )}

          <button
            type="button"
            onClick={() => void onGetQuote()}
            disabled={quoting || !request?.product}
            className="btn-secondary w-full"
          >
            {quoting ? "Getting estimate…" : "Get cost estimate"}
          </button>

          {quoteError && <p className="text-sm text-red-600">{quoteError}</p>}

          {quote && (
            <div className="rounded-xl border border-shop-border bg-shop-surface p-4 text-sm">
              <ul className="space-y-1 text-shop-muted">
                {quote.breakdown.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
              <p className="mt-2 font-semibold text-shop-ink">
                Estimated total: {formatApiMoney(quote.totalUsd, "USD")}
              </p>
            </div>
          )}

          <div className="border-t border-shop-border pt-3">
            <label className="flex items-center gap-2 text-sm text-shop-ink">
              <input
                type="checkbox"
                checked={overrideAddress}
                onChange={(e) => setOverrideAddress(e.target.checked)}
              />
              Override shipping address (defaults to the customer&apos;s saved address)
            </label>

            {overrideAddress && (
              <div className="mt-3 space-y-2">
                <input className="input w-full" placeholder="Full name" value={address.fullName} onChange={(e) => setAddress((a) => ({ ...a, fullName: e.target.value }))} />
                <input className="input w-full" placeholder="Address line 1" required value={address.line1} onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))} />
                <input className="input w-full" placeholder="Address line 2" value={address.line2} onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))} />
                <div className="grid grid-cols-2 gap-2">
                  <input className="input w-full" placeholder="City" required value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} />
                  <input className="input w-full" placeholder="State / region" value={address.state} onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="input w-full" placeholder="Country code" required value={address.country} onChange={(e) => setAddress((a) => ({ ...a, country: e.target.value }))} />
                  <input className="input w-full" placeholder="Postal code" value={address.postalCode} onChange={(e) => setAddress((a) => ({ ...a, postalCode: e.target.value }))} />
                </div>
                <input className="input w-full" placeholder="Phone" value={address.phone} onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))} />
              </div>
            )}
          </div>

          {placeError && <p className="text-sm text-red-600">{placeError}</p>}
        </div>

        <DialogFooter className="flex-row gap-3">
          <button type="button" onClick={close} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={placing || !request?.product}
            className="btn-primary flex-1"
          >
            {placing ? "Placing order…" : "Confirm & place order"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
