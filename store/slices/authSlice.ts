import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { JwtRole, TokenResponse } from "@/types/api";

const STORAGE_KEY = "uc_auth";

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: string | null;
  email: string | null;
  userId: string | null;
  role: JwtRole | null;
}

const emptyState: AuthState = {
  accessToken: null,
  refreshToken: null,
  expiresIn: null,
  email: null,
  userId: null,
  role: null,
};

function readPersisted(): AuthState {
  if (typeof window === "undefined") return { ...emptyState };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...emptyState };
    return { ...emptyState, ...JSON.parse(raw) };
  } catch {
    return { ...emptyState };
  }
}

function persist(state: AuthState) {
  if (typeof window === "undefined") return;
  if (!state.refreshToken && !state.accessToken) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      expiresIn: state.expiresIn,
      email: state.email,
      userId: state.userId,
      role: state.role,
    })
  );
}

const authSlice = createSlice({
  name: "auth",
  initialState: emptyState,
  reducers: {
    credentialsReceived(
      state,
      action: PayloadAction<TokenResponse & { email?: string; userId?: string; role?: JwtRole }>
    ) {
      const { accessToken, refreshToken, expiresIn, email, userId, role } = action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.expiresIn = expiresIn;
      if (email !== undefined) state.email = email;
      if (userId !== undefined) state.userId = userId;
      if (role !== undefined) state.role = role;
      persist(state);
    },
    tokensRefreshed(state, action: PayloadAction<TokenResponse>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.expiresIn = action.payload.expiresIn;
      persist(state);
    },
    profileSynced(state, action: PayloadAction<{ id: string; email: string; role: JwtRole }>) {
      state.userId = action.payload.id;
      state.email = action.payload.email;
      state.role = action.payload.role;
      persist(state);
    },
    loggedOut: () => {
      if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
      return { ...emptyState };
    },
    rehydrateFromStorage: () => readPersisted(),
  },
});

export const { credentialsReceived, tokensRefreshed, profileSynced, loggedOut, rehydrateFromStorage } =
  authSlice.actions;
export default authSlice.reducer;
