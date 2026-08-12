"use client";

import { useEffect } from "react";

/** Dev-only Reticle sensor — tree-shaken / unmounted outside development. */
export function ReticleDev() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const token = process.env.NEXT_PUBLIC_RETICLE_TOKEN;
    void import("@reticlehq/react").then(({ reticle, SESSION_AUTO, install }) => {
      install();
      reticle.connect({
        session: SESSION_AUTO,
        ...(token ? { token } : {}),
      });
    });
  }, []);

  return null;
}
