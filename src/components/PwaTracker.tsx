"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  alreadyTrackedToday,
  getDisplayMode,
  getVisitorId,
  isInternalDevice,
  markInternalDevice,
  rememberTrackedToday,
} from "@/lib/pwa-client";

/**
 * Melaporkan "perangkat ini membuka katalog hari ini" (PWA atau browser),
 * maksimal sekali per hari per mode. Tidak mengirim data pribadi apa pun.
 * Halaman /admin tidak dihitung; perangkat yang pernah buka /admin juga
 * dikecualikan supaya pemakaian admin tidak tercampur dengan pelanggan.
 */
export default function PwaTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) {
      markInternalDevice();
      return;
    }
    if (isInternalDevice()) return;

    const report = () => {
      const mode = getDisplayMode();
      if (alreadyTrackedToday(mode)) return;

      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: getVisitorId(), displayMode: mode }),
        keepalive: true,
      })
        .then((response) => {
          if (response.ok) rememberTrackedToday(mode);
        })
        .catch(() => {
          // Pelacakan tidak boleh mengganggu pembeli: gagal ya sudah, coba lagi lain kali.
        });
    };

    report();

    // PWA sering dibiarkan terbuka berhari-hari; hitung lagi saat dibuka kembali di hari baru.
    const onVisible = () => {
      if (document.visibilityState === "visible") report();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [pathname]);

  return null;
}
