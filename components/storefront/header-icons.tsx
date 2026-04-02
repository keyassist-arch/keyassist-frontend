import { ShoppingBag, User } from "lucide-react";

export function IconCart({ className }: { className?: string }) {
  return <ShoppingBag className={className} strokeWidth={1.5} aria-hidden />;
}

export function IconUser({ className }: { className?: string }) {
  return <User className={className} strokeWidth={1.5} aria-hidden />;
}
