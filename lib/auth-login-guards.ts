import type { LocalCartLine, TokenResponse, TwoFactorPreAuthResponse } from "@/types/api";

export function isTokenLoginResult(data: unknown): data is TokenResponse & { cart?: unknown } {
  return (
    typeof data === "object" &&
    data !== null &&
    "accessToken" in data &&
    typeof (data as { accessToken?: string }).accessToken === "string" &&
    (data as { accessToken: string }).accessToken.length > 0
  );
}

export function isTwoFactorRequiredResult(data: unknown): data is TwoFactorPreAuthResponse {
  if (typeof data !== "object" || data === null) return false;
  const d = data as { requiresTwoFactor?: boolean; preAuthToken?: string };
  return d.requiresTwoFactor === true && typeof d.preAuthToken === "string" && d.preAuthToken.length > 0;
}

export function normalizeTotpCode(raw: string): string {
  return raw.replace(/\s+/g, "");
}

export type LoginFlowContext = { email: string; localLines: LocalCartLine[] };
