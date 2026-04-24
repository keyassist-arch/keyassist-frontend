"use client";

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import type { OrderUpdatedEvent } from "@/types/api";

function apiOrigin(): string | null {
  const b = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return b ? b.replace(/\/$/, "") : null;
}

/**
 * Subscribe to `/realtime` `order.updated` events with a JWT.
 * Server keeps import events public; this hook only targets user order updates.
 */
export function useOrderRealtime(accessToken: string | null | undefined, onOrderUpdated: (event: OrderUpdatedEvent) => void) {
  const cb = useRef(onOrderUpdated);

  useEffect(() => {
    cb.current = onOrderUpdated;
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

    const onUpdated = (payload: OrderUpdatedEvent) => cb.current(payload);
    socket.on("order.updated", onUpdated);

    return () => {
      socket.off("order.updated", onUpdated);
      socket.disconnect();
    };
  }, [accessToken]);
}
