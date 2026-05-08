"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { useAppSelector } from "@/store/hooks";
import {
  useGetSavesQuery,
  useSaveProductMutation,
} from "@/store/routes/unified-commerce-api";
import { isUuid } from "@/lib/uuid";
import { useAppDispatch } from "@/store/hooks";
import {
  rehydrateSavesFromStorage,
  savesAddLocalSave,
  savesRemoveLocalSave,
  savesServerSet,
  savesToggleLocalSave,
} from "@/store/slices/savesSlice";

type SavesContextValue = {
  localSavedIds: Set<string>;
  isSavedLocal: (productId: string) => boolean;
  toggleLocalSave: (productId: string) => void;
  addLocalSave: (productId: string) => void;
  removeLocalSave: (productId: string) => void;
};

const SavesContext = createContext<SavesContextValue | undefined>(undefined);

export function SavesProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.accessToken);
  const localSavedIdsArr = useAppSelector((s) => s.saves.localSavedIds);
  const localSavedIds = useMemo(() => new Set(localSavedIdsArr), [localSavedIdsArr]);

  const { data: serverSaves } = useGetSavesQuery(undefined, { skip: !token });
  const [saveProduct] = useSaveProductMutation();

  const hasSyncedRef = useRef(false);

  useEffect(() => {
    dispatch(rehydrateSavesFromStorage());
  }, [dispatch]);

  useEffect(() => {
    if (!token) return;
    if (!serverSaves) return;
    dispatch(savesServerSet(serverSaves.map((s) => s.productId).filter((x): x is string => typeof x === "string")));
  }, [token, serverSaves, dispatch]);

  useEffect(() => {
    if (!token) {
      hasSyncedRef.current = false;
      return;
    }
    if (hasSyncedRef.current) return;
    if (!serverSaves) return;

    const serverIds = new Set(serverSaves.map((s) => s.productId).filter((x): x is string => typeof x === "string"));
    const toAdd = Array.from(localSavedIds).filter((id) => id && !serverIds.has(id) && isUuid(id));

    if (toAdd.length === 0) {
      hasSyncedRef.current = true;
      return;
    }

    hasSyncedRef.current = true;
    void (async () => {
      await Promise.allSettled(toAdd.map((id) => saveProduct(id).unwrap()));
    })();
  }, [token, serverSaves, localSavedIds, saveProduct]);

  const isSavedLocal = useCallback((productId: string) => localSavedIds.has(productId), [localSavedIds]);

  const addLocalSave = useCallback((productId: string) => {
    dispatch(savesAddLocalSave(productId));
  }, [dispatch]);

  const removeLocalSave = useCallback((productId: string) => {
    dispatch(savesRemoveLocalSave(productId));
  }, [dispatch]);

  const toggleLocalSave = useCallback((productId: string) => {
    dispatch(savesToggleLocalSave(productId));
  }, [dispatch]);

  const value = useMemo<SavesContextValue>(
    () => ({ localSavedIds, isSavedLocal, toggleLocalSave, addLocalSave, removeLocalSave }),
    [localSavedIds, isSavedLocal, toggleLocalSave, addLocalSave, removeLocalSave]
  );

  return <SavesContext.Provider value={value}>{children}</SavesContext.Provider>;
}

export function useLocalSaves() {
  const ctx = useContext(SavesContext);
  if (!ctx) throw new Error("useLocalSaves must be used inside SavesProvider.");
  return ctx;
}
