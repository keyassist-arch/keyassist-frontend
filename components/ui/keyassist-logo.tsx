/**
 * KeyAssist logomark — shopping bag with a keyhole cutout.
 * The bag represents commerce; the keyhole represents the "key" in Key Assist.
 *
 * Usage:
 *   <KeyAssistMark size={36} />          — icon only (rounded square)
 *   <KeyAssistWordmark className="h-7" /> — full horizontal wordmark
 */

const PURPLE = "#5C4AE6";

export function KeyAssistMark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Rounded square background */}
      <rect width="40" height="40" rx="10" fill={PURPLE} />

      {/* Bag body */}
      <rect x="8" y="17" width="24" height="15" rx="3" stroke="white" strokeWidth="2" fill="none" />

      {/* Bag handle arc */}
      <path
        d="M14 17C14 11.5 16.5 9 20 9C23.5 9 26 11.5 26 17"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Keyhole — circle bow */}
      <circle cx="20" cy="22.5" r="2.6" fill="white" />

      {/* Keyhole — shaft */}
      <rect x="18.8" y="24.4" width="2.4" height="3.6" rx="1.2" fill="white" />
    </svg>
  );
}

export function KeyAssistWordmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Key Assist"
    >
      {/* Mark */}
      <rect width="36" height="36" rx="9" fill={PURPLE} />
      <rect x="7" y="15.5" width="22" height="13.5" rx="2.8" stroke="white" strokeWidth="1.8" fill="none" />
      <path
        d="M12.5 15.5C12.5 10.5 14.8 8.5 18 8.5C21.2 8.5 23.5 10.5 23.5 15.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="18" cy="20.8" r="2.3" fill="white" />
      <rect x="17" y="22.5" width="2" height="3.2" rx="1" fill="white" />

      {/* Wordmark text */}
      <text
        x="46"
        y="25"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="16"
        fill="#111827"
        letterSpacing="-0.3"
      >
        key assist
      </text>
    </svg>
  );
}
