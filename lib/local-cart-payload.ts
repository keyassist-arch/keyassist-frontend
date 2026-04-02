import type { LocalCartLine } from "@/types/api";
import type { CartItem } from "@/types";

export function mapCartItemsToLocalCart(items: CartItem[]): LocalCartLine[] {
  return items.map((item) => {
    const line: LocalCartLine = { productId: item.productId, quantity: item.quantity };
    if (item.variant?.name && item.variant?.value) {
      line.variantSelection = { [item.variant.name]: item.variant.value };
    }
    return line;
  });
}
