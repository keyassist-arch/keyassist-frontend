const KEY = "ka_passkey_enabled";

export const passkeyPref = {
  set: () => {
    try { localStorage.setItem(KEY, "1"); } catch { /* private browsing */ }
  },
  clear: () => {
    try { localStorage.removeItem(KEY); } catch { /* private browsing */ }
  },
  get: (): boolean => {
    try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
  },
};
