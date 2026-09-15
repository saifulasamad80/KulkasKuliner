"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js", { scope: '/' }).catch((error: unknown) => {
      console.error("Registrasi service worker gagal:", error);
    });
  }, []);

  return null;
}
