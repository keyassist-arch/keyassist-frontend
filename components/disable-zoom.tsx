"use client";

import { useEffect } from "react";

function isZoomKey(key: string) {
  return key === "+" || key === "-" || key === "=" || key === "_" || key === "0";
}

/** Keeps the page at 1:1. Viewport meta alone does not stop trackpad or keyboard zoom. */
export function DisableZoom() {
  useEffect(() => {
    const blockWheelZoom = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) event.preventDefault();
    };

    const blockKeyZoom = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && isZoomKey(event.key)) {
        event.preventDefault();
      }
    };

    const blockGesture = (event: Event) => {
      event.preventDefault();
    };

    const blockMultiTouch = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };

    document.addEventListener("wheel", blockWheelZoom, { passive: false });
    document.addEventListener("keydown", blockKeyZoom);
    document.addEventListener("gesturestart", blockGesture);
    document.addEventListener("gesturechange", blockGesture);
    document.addEventListener("touchmove", blockMultiTouch, { passive: false });

    return () => {
      document.removeEventListener("wheel", blockWheelZoom);
      document.removeEventListener("keydown", blockKeyZoom);
      document.removeEventListener("gesturestart", blockGesture);
      document.removeEventListener("gesturechange", blockGesture);
      document.removeEventListener("touchmove", blockMultiTouch);
    };
  }, []);

  return null;
}
