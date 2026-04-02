import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/store/slices/authSlice";
import { unifiedCommerceApi } from "@/store/routes/unified-commerce-api";

export function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [unifiedCommerceApi.reducerPath]: unifiedCommerceApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }).concat(unifiedCommerceApi.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
