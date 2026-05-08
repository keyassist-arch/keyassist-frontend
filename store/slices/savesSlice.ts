import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const STORAGE_KEY = "uc_saves_v1";

export interface SavesState {
  /** Anonymous/local saves (persisted). */
  localSavedIds: string[];
  /** Last fetched server saves (persisted for fast reload UI). */
  serverSavedIds: string[];
}

const emptyState: SavesState = {
  localSavedIds: [],
  serverSavedIds: [],
};

function uniqStrings(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const x of v) {
    if (typeof x !== "string") continue;
    if (seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}

function readPersisted(): SavesState {
  if (typeof window === "undefined") return { ...emptyState };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...emptyState };
    const parsed = JSON.parse(raw) as Partial<SavesState>;
    return {
      localSavedIds: uniqStrings(parsed.localSavedIds),
      serverSavedIds: uniqStrings(parsed.serverSavedIds),
    };
  } catch {
    return { ...emptyState };
  }
}

function persist(state: SavesState) {
  if (typeof window === "undefined") return;
  try {
    if (!state.localSavedIds.length && !state.serverSavedIds.length) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ localSavedIds: state.localSavedIds, serverSavedIds: state.serverSavedIds })
    );
  } catch {
    /* ignore */
  }
}

export const savesSlice = createSlice({
  name: "saves",
  initialState: emptyState,
  reducers: {
    rehydrateFromStorage: () => readPersisted(),
    toggleLocalSave: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const set = new Set(state.localSavedIds);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      state.localSavedIds = Array.from(set);
      persist(state);
    },
    addLocalSave: (state, action: PayloadAction<string>) => {
      const set = new Set(state.localSavedIds);
      set.add(action.payload);
      state.localSavedIds = Array.from(set);
      persist(state);
    },
    removeLocalSave: (state, action: PayloadAction<string>) => {
      state.localSavedIds = state.localSavedIds.filter((x) => x !== action.payload);
      persist(state);
    },
    /** Overwrite server snapshot (from GET /saves). */
    serverSavesSet: (state, action: PayloadAction<string[]>) => {
      state.serverSavedIds = uniqStrings(action.payload);
      persist(state);
    },
  },
});

export const {
  rehydrateFromStorage: rehydrateSavesFromStorage,
  toggleLocalSave: savesToggleLocalSave,
  addLocalSave: savesAddLocalSave,
  removeLocalSave: savesRemoveLocalSave,
  serverSavesSet: savesServerSet,
} = savesSlice.actions;

export default savesSlice.reducer;

