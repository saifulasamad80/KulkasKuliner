"use client";

import { useEffect, useState } from "react";

export default function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Tangkap event bawaan Chrome sebelum pop-up default muncul
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Cegah pop-up bawaan browser
      setDeferredPrompt(e); // Simpan event-nya
      setIsInstallable(true); // Tampilkan tombol kustom kita
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Tembakkan pop-up instalasi
    deferredPrompt.prompt();
    
    // Tunggu keputusan user (Install atau Cancel)
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("User menerima instalasi PWA");
    }
    
    // Reset state
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // Jika tidak bisa di-install (karena iOS atau belum menuhi syarat), sembunyikan tombol
  if (!isInstallable) return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
      <div className="bg-blue-900 text-white shadow-2xl rounded-full px-4 py-2 flex items-center gap-3 pointer-events-auto border-2 border-yellow-400 animate-bounce">
        <span className="text-sm font-bold">Aplikasi KulkasKuliner Tersedia!</span>
        <button 
          onClick={handleInstallClick}
          className="bg-yellow-400 text-blue-900 px-3 py-1 rounded-full text-xs font-black hover:bg-yellow-300 transition-colors"
        >
          INSTALL
        </button>
      </div>
    </div>
  );
}