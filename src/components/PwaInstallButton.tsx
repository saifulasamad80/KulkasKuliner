"use client";

import { useEffect, useState, useRef } from "react";

export default function PwaInstallButton() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIosPrompt, setIsIosPrompt] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  
  const deferredPromptRef = useRef<any>(null);

  useEffect(() => {
    // 1. Cek apakah Aplikasi sudah terinstal di HP
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
    });

    // 2. RADAR ANDROID/CHROME
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); 
      deferredPromptRef.current = e; 
      setIsIosPrompt(false);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 3. RADAR iOS / SAFARI
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    const isInStandaloneMode = () => {
      return ('standalone' in window.navigator) && (window.navigator as any).standalone;
    };
    if (isIos() && !isInStandaloneMode()) {
      setIsIosPrompt(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPromptRef.current;
    
    // JIKA CHROME LEMOT / BELUM SIAP (Taktik Fallback)
    if (!promptEvent) {
      setShowFallback(true);
      setTimeout(() => setShowFallback(false), 8000); 
      return;
    }

    // JIKA CHROME SUDAH SIAP
    promptEvent.prompt();
    try {
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch (error) {
      console.error('Gagal instalasi:', error);
    } finally {
      deferredPromptRef.current = null;
    }
  };

  // Jika aplikasi sudah di dalam HP, musnahkan tombolnya
  if (isInstalled) return null;

  return (
    <div className="w-full sm:w-auto relative flex flex-col items-center">
      {/* UI UNTUK ANDROID / CHROME (DIPERBARUI KE GAYA FOODDASH SECONDARY) */}
      {!isIosPrompt && (
        <button 
          onClick={handleInstallClick}
          className="flex items-center justify-center gap-2 w-full sm:w-auto bg-white text-red-600 border-2 border-red-100 px-8 py-3.5 rounded-full font-bold hover:bg-red-50 hover:border-red-200 transition-all shadow-sm active:scale-[0.96]"
        >
          {/* Ikon diubah warnanya mengikuti teks (currentColor) */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 currentColor" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Instal Aplikasi
        </button>
      )}

      {/* NOTIFIKASI FALLBACK CHROME (Kosmetik disesuaikan dengan tema terang) */}
      {showFallback && !isIosPrompt && (
        <div className="absolute top-16 w-64 bg-white text-gray-800 p-3 rounded-xl shadow-2xl border border-red-200 text-xs text-center animate-bounce z-50">
          <p className="font-bold text-red-600 mb-1">Sedang memproses...</p>
          <p>Jika popup tidak muncul, instal manual dengan klik ikon <strong className="bg-gray-100 border border-gray-200 px-1 py-0.5 rounded">Titik Tiga (⋮)</strong> di pojok kanan atas browser, lalu pilih <strong className="text-red-600">Tambahkan ke Layar Utama</strong>.</p>
        </div>
      )}

      {/* UI UNTUK iOS / SAFARI (DIPERBARUI KE TEMA MERAH TIPIS) */}
      {isIosPrompt && (
        <div className="bg-red-50 border border-red-100 p-3 rounded-xl w-full sm:w-auto text-center text-red-900 shadow-sm">
          <p className="text-xs leading-relaxed font-medium">
            <span className="font-bold text-red-600">Pengguna iPhone:</span><br/>
            Tekan <strong className="inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-red-200 mx-1 shadow-sm">Share</strong> di bawah,<br/>
            lalu pilih <strong>➕ Add to Home Screen</strong>.
          </p>
        </div>
      )}
    </div>
  );
}