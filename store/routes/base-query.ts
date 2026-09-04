import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import type { AuthState } from "@/store/slices/authSlice";
import { loggedOut, tokensRefreshed } from "@/store/slices/authSlice";
import type { TokenResponse } from "@/types/api";

type StateWithAuth = { auth: AuthState };

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const MISSING_BASE_MSG =
  "We’re having trouble connecting right now. Please try again shortly.";

function missingBaseError(): { error: FetchBaseQueryError } {
  return {
    error: {
      status: "CUSTOM_ERROR",
      error: MISSING_BASE_MSG,
    } as FetchBaseQueryError,
  };
}

const rawFetch = apiBase
  ? fetchBaseQuery({
      baseUrl: apiBase,
      prepareHeaders: (headers, { getState, endpoint }) => {
        const token = (getState() as StateWithAuth).auth.accessToken;
        if (token) headers.set("Authorization", `Bearer ${token}`);
        // Multipart uploads (FormData body) need the browser-set boundary — leave Content-Type unset.
        if (endpoint !== "uploadProductImage") {
          headers.set("Content-Type", "application/json");
        }
        return headers;
      },
    })
  : null;

const refreshFetch = apiBase
  ? fetchBaseQuery({
      baseUrl: apiBase,
      prepareHeaders: (headers) => {
        headers.set("Content-Type", "application/json");
        return headers;
      },
    })
  : null;

/** Bearer requests — no network call if API base URL is missing. */
export const rawBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extra
) => {
  if (!rawFetch) return missingBaseError();
  return rawFetch(args, api, extra);
};

/** Register / login / refresh — must not send stale Bearer; same base URL rules as rawBaseQuery. */
export const refreshBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extra
) => {
  if (!refreshFetch) return missingBaseError();
  return refreshFetch(args, api, extra);
};

export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  if (!rawFetch) return missingBaseError();

  let result = await rawFetch(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshToken = (api.getState() as StateWithAuth).auth.refreshToken;
    if (refreshToken && refreshFetch) {
      const refreshResult = await refreshFetch(
        {
          url: "/auth/refresh",
          method: "POST",
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        api.dispatch(tokensRefreshed(refreshResult.data as TokenResponse));
        result = await rawFetch(args, api, extraOptions);
      } else {
        api.dispatch(loggedOut());
      }
    }
  }

  return result;
};
