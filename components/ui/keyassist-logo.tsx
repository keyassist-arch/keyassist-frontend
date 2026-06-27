const FONT_SIZE_RATIO = 0.55;

export function KeyAssistMark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center border bg-white font-extrabold  leading-none text-emerald-600 ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        borderRadius: "20%",
        borderColor: "#d1d5db",
        fontSize: Math.round(size * FONT_SIZE_RATIO),
      }}
      aria-hidden
    >
      ka
    </span>
  );
}

export function KeyAssistWordmark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`} aria-label="Key Assist">
      <KeyAssistMark size={36} />
    </span>
  );
}
