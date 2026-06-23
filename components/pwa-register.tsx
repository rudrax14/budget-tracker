"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // Dev: self-heal. Remove any service worker + caches left over from an
      // earlier production run, which would otherwise serve stale pages.
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
      return;
    }

    const register = () =>
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
