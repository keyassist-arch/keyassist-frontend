"use client";

import type { ButtonHTMLAttributes } from "react";
import { useCart } from "@/context/cart-context";

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

/** Opens the side cart drawer (and runs any additional onClick). */
export function OpenCartTrigger({ className, children, onClick, type = "button", ...rest }: Props) {
  const { openCartDrawer } = useCart();
  return (
    <button
      type={type}
      className={className}
      {...rest}
      onClick={(e) => {
        openCartDrawer();
        onClick?.(e);
      }}
    >
      {children}
    </button>
  );
}
