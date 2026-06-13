const SKIP = new Set(["/", "/auth/login", "/auth/register", "/auth/forgot-password", "/auth/check-email"]);

function shouldSkip(path: string) {
  return !path || SKIP.has(path) || path.startsWith("/auth/");
}

export function loginUrl(redirect?: string | null) {
  if (!redirect || shouldSkip(redirect)) return "/auth/login";
  return `/auth/login?redirect=${encodeURIComponent(redirect)}`;
}

export function registerUrl(redirect?: string | null) {
  if (!redirect || shouldSkip(redirect)) return "/auth/register";
  return `/auth/register?redirect=${encodeURIComponent(redirect)}`;
}
