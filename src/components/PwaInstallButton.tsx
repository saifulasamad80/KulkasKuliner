"use client";

import { useEffect, useState, useRef } from "react";

export default function PwaInstallButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isIosPrompt, setIsIosPrompt] = useState(false);
  
  const deferredPromptRef = useRef<any>(null);

  useEffect(() => {
    // 1. RADAR ANDROID/CHROME (Otomatis)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); 
      deferredPromptRef.current = e; 
      setIsVisible(true); 
      setIsIosPrompt(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setIsIosPrompt(false);
      deferredPromptRef.current = null;
    });

    // 2. RADAR iOS / SAFARI (Manual Prompt)
    // Deteksi apakah perangkat adalah iPhone/iPad dan belum di-install
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };

    // PWA di iOS dijalankan dalam mode "standalone" jika sudah di-install
    const isInStandaloneMode = () => {
      return ('standalone' in window.navigator) && (window.navigator as any).standalone;
    };

    if (isIos() && !isInStandaloneMode()) {
      // Munculkan banner petunjuk manual untuk pengguna iPhone
      setIsVisible(true);
      setIsIosPrompt(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPromptRef.current;
    
    if (!promptEvent) return;

    promptEvent.prompt();
    setIsVisible(false);

    try {
      await promptEvent.userChoice;
    } catch (error) {
      console.error('Gagal membaca outcome:', error);
    } finally {
      deferredPromptRef.current = null;
    }
  };

  // Fungsi tutup banner (jika user merasa terganggu)
  const dismissPrompt = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* UI UNTUK ANDROID / CHROME */}
      {!isIosPrompt && (
        <div className="fixed top-4 left-0 right-0 z-[9999] flex justify-center pointer-events-none px-4">
          <div className="bg-blue-900 text-white shadow-2xl rounded-full px-5 py-3 flex items-center gap-4 pointer-events-auto border-2 border-yellow-400 animate-bounce">
            <span className="text-sm font-bold">Instal KulkasKuliner App!</span>
            <button 
              onClick={handleInstallClick}
              className="bg-yellow-400 text-blue-900 px-4 py-1.5 rounded-full text-xs font-black hover:bg-yellow-300 transition-colors shadow-sm focus:ring-2 focus:ring-white outline-none"
            >
              INSTALL
            </button>
            <button onClick={dismissPrompt} className="ml-1 text-gray-300 hover:text-white p-1">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* UI UNTUK iOS / SAFARI (Banner Bawah dengan Petunjuk) */}
      {isIosPrompt && (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] p-4 transform transition-transform duration-300 rounded-t-2xl">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-gray-900 text-sm">Instal App KulkasKuliner</h3>
            <button onClick={dismissPrompt} className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center">
              ✕
            </button>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Pasang di layar HP Anda untuk akses lebih cepat: 
            <br/>1. Tekan tombol <strong className="text-blue-600 inline-flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg> Share</strong> di bawah.
            <br/>2. Pilih <strong className="text-gray-900 border border-gray-300 px-1 rounded shadow-sm">➕ Add to Home Screen</strong>.
          </p>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-gray-200"></div>
        </div>
      )}
    </>
  );
}