"use client";

import { useEffect, useMemo } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/store/root/configure-store";
import { rehydrateFromStorage } from "@/store/slices/authSlice";
import { useAppDispatch } from "@/store/hooks";

function AuthRehydrate() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(rehydrateFromStorage());
  }, [dispatch]);
  return null;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const store = useMemo(() => makeStore(), []);

  return (
    <Provider store={store}>
      <AuthRehydrate />
      {children}
    </Provider>
  );
}
