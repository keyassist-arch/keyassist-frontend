export function InnerShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-(--shop-layout-max) px-4 py-8 sm:px-8">{children}</div>
  );
}
