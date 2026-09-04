import { Check, Globe, KeyRound, Star } from "lucide-react";

const PROPS = [
  "100% authenticity checks in the US",
  "One transparent all-in price",
  "Live tracking to your Lagos doorstep",
];

const AVATAR_COLORS = ["#C8956C", "#4A7C59", "#3A7CA8", "#E8547A"];

export function AuthBrandPanel() {
  return (
    <div
      className="relative hidden h-full w-[560px] shrink-0 flex-col justify-between overflow-hidden p-[52px] lg:flex"
      style={{ background: "linear-gradient(125deg, #064E3B 0%, #059669 55%, #10B981 100%)" }}
    >
      <div
        className="pointer-events-none absolute left-[240px] top-[-160px] h-[460px] w-[520px] rounded-full"
        style={{ background: "radial-gradient(circle, #6EE7B766 0%, #10B98100 100%)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[-200px] top-[560px] h-[420px] w-[480px] rounded-full"
        style={{ background: "radial-gradient(circle, #05966955 0%, #05966900 100%)" }}
        aria-hidden
      />

      <div className="relative z-10 flex items-center gap-[11px]">
        <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-white">
          <KeyRound className="h-5 w-5" style={{ color: "var(--shop-primary)" }} aria-hidden />
        </span>
        <span className="text-[22px] font-bold text-white">key assist</span>
      </div>

      <div className="relative z-10 flex flex-col gap-[22px]">
        <span className="inline-flex w-fit items-center gap-2 rounded-full px-[15px] py-2 text-xs font-semibold text-white" style={{ background: "#FFFFFF26" }}>
          <Globe className="h-3.5 w-3.5" aria-hidden />
          US marketplaces → delivered to Nigeria
        </span>
        <h2 className="text-[44px] font-extrabold leading-[1.1] tracking-[-1.2px] text-white">
          Shop the world. Delivered to your door.
        </h2>
        <p className="max-w-[400px] text-base leading-[1.55]" style={{ color: "#E4F7EE" }}>
          One cart for every US store — Amazon, Apple, Nike, GOAT and more. We buy, verify, and air-freight it to Lagos.
        </p>
        <div className="flex flex-col gap-[14px] pt-2">
          {PROPS.map((label) => (
            <div key={label} className="flex items-center gap-3">
              <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full" style={{ background: "#FFFFFF26" }}>
                <Check className="h-[15px] w-[15px] text-white" aria-hidden />
              </span>
              <span className="text-[15px] font-medium text-white">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-3 rounded-[18px] p-5" style={{ background: "#FFFFFF1F", border: "1px solid #FFFFFF29" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {AVATAR_COLORS.map((c, i) => (
              <span
                key={c}
                className="h-[34px] w-[34px] shrink-0 rounded-full"
                style={{ background: c, border: "2px solid #0B5D45", marginLeft: i === 0 ? 0 : -10 }}
              />
            ))}
          </div>
          <div className="flex items-center gap-[3px]">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className="h-[15px] w-[15px]" style={{ color: "#FDE68A" }} fill="#FDE68A" aria-hidden />
            ))}
          </div>
        </div>
        <p className="text-sm leading-[1.5] text-white">
          &ldquo;Landed in Lagos in 9 days, sealed and genuine.&rdquo; Loved by thousands of shoppers across Nigeria.
        </p>
      </div>
    </div>
  );
}
