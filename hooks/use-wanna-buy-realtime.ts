"use client";

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import type { WannaBuyItemUpdatedEvent } from "@/types/api";

function apiOrigin(): string | null {
  const b = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return b ? b.replace(/\/$/, "") : null;
}

/**
 * Subscribe to `/realtime` `wannaBuyItem.updated` events with a JWT.
 * Fires when an admin quotes an item, the user confirms it, or payment completes.
 */
export function useWannaBuyRealtime(accessToken: string | null | undefined, onItemUpdated: (event: WannaBuyItemUpdatedEvent) => void) {
  const cb = useRef(onItemUpdated);

  useEffect(() => {
    cb.current = onItemUpdated;
  });

  useEffect(() => {
    if (!accessToken) return;
    const origin = apiOrigin();
    if (!origin) return;

    const socket = io(`${origin}/realtime`, {
      path: "/socket.io",
      autoConnect: true,
      auth: { token: accessToken },
    });

    const onUpdated = (payload: WannaBuyItemUpdatedEvent) => cb.current(payload);
    socket.on("wannaBuyItem.updated", onUpdated);

    return () => {
      socket.off("wannaBuyItem.updated", onUpdated);
      socket.disconnect();
    };
  }, [accessToken]);
}
