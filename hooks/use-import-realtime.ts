"use client";

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import type { ProductImportResponse } from "@/types/api";

function apiOrigin(): string | null {
  const b = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return b ? b.replace(/\/$/, "") : null;
}

/**
 * Namespace `/realtime`, path `/socket.io`.
 * `import.updated` works without JWT. Pass `accessToken` so the same socket can also receive `order.updated` (user room).
 */
export function useImportRealtime(
  importId: string | null,
  onImportUpdated: (payload: ProductImportResponse) => void,
  accessToken?: string | null
) {
  const cb = useRef(onImportUpdated);

  useEffect(() => {
    cb.current = onImportUpdated;
  });

  useEffect(() => {
    if (!importId) return;
    const origin = apiOrigin();
    if (!origin) return;

    const socket = io(`${origin}/realtime`, {
      path: "/socket.io",
      autoConnect: true,
      ...(accessToken ? { auth: { token: accessToken } } : {}),
    });

    const subscribe = () => {
      socket.emit("import.subscribe", { importId }, (ack: { ok: boolean; error?: string }) => {
        if (!ack?.ok) {
          console.warn("[import] import.subscribe failed", ack);
        }
      });
    };

    socket.on("connect", subscribe);
    socket.on("import.updated", (payload: ProductImportResponse) => {
      cb.current(payload);
    });

    if (socket.connected) {
      subscribe();
    }

    return () => {
      socket.off("connect", subscribe);
      socket.off("import.updated");
      socket.disconnect();
    };
  }, [importId, accessToken]);
}
