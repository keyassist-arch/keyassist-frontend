import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import authReducer from "@/store/slices/authSlice";
import cartReducer from "@/store/slices/cartSlice";
import savesReducer from "@/store/slices/savesSlice";
import { unifiedCommerceApi } from "@/store/routes/unified-commerce-api";

export function makeStore() {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
      saves: savesReducer,
      [unifiedCommerceApi.reducerPath]: unifiedCommerceApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }).concat(unifiedCommerceApi.middleware),
  });
  setupListeners(store.dispatch);
  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
