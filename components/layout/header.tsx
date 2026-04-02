import { StoreTopBar } from "@/components/storefront/store-top-bar";
import { StoreMainHeader } from "@/components/storefront/store-main-header";
import { StoreSubNav } from "@/components/storefront/store-sub-nav";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white">
      <StoreTopBar />
      <StoreMainHeader />
      <StoreSubNav />
    </header>
  );
}
