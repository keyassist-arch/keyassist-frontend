import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";

/** `POST /auth/login` when password is correct but email is not verified (`403`). */
export function getEmailNotVerifiedPayload(error: unknown): {
  email?: string;
  verificationEmailSent?: boolean;
  message: string;
} | null {
  const e = error as FetchBaseQueryError;
  if (e?.status !== 403 || !e.data || typeof e.data !== "object") return null;
  const d = e.data as { code?: string; email?: string; verificationEmailSent?: boolean; message?: string };
  if (d.code !== "EMAIL_NOT_VERIFIED") return null;
  return {
    email: d.email,
    verificationEmailSent: d.verificationEmailSent,
    message: typeof d.message === "string" ? d.message : "Please verify your email before signing in.",
  };
}

/** `POST /orders` when phone verification is required but missing (`403`). */
export function isPhoneVerificationRequiredError(error: unknown): boolean {
  const e = error as FetchBaseQueryError;
  if (e?.status !== 403 || !e.data || typeof e.data !== "object") return false;
  const d = e.data as { code?: string };
  return d.code === "PHONE_VERIFICATION_REQUIRED";
}

export function getErrorMessage(error: unknown): string {
  if (!error) return "Something went wrong.";
  if (typeof error === "string") return error;
  const e = error as FetchBaseQueryError | SerializedError;
  if ("status" in e && e.status === "CUSTOM_ERROR" && "error" in e && typeof (e as { error?: string }).error === "string") {
    return (e as { error: string }).error;
  }
  if ("status" in e && e.status === "FETCH_ERROR") return "Connection failed. Check your internet and try again.";
  if ("data" in e && e.data && typeof e.data === "object") {
    const data = e.data as { message?: string | string[]; error?: string };
    if (Array.isArray(data.message)) return data.message.join(", ");
    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;
  }
  if ("message" in e && typeof e.message === "string") return e.message;
  return "Something went wrong. Please try again.";
}
