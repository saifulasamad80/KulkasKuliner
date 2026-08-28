"use client";

import { useEffect, useState, useRef } from "react";

export default function PwaInstallButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isIosPrompt, setIsIosPrompt] = useState(false);
  
  const deferredPromptRef = useRef<any>(null);

  useEffect(() => {
    // 1. RADAR ANDROID/CHROME
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

    // 2. RADAR iOS / SAFARI
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };

    const isInStandaloneMode = () => {
      return ('standalone' in window.navigator) && (window.navigator as any).standalone;
    };

    if (isIos() && !isInStandaloneMode()) {
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

    try {
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Gagal membaca outcome:', error);
    } finally {
      deferredPromptRef.current = null;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="flex flex-col items-center justify-center mt-4 mb-16 px-4">
      
      {/* UI UNTUK ANDROID / CHROME (Tombol Sopan) */}
      {!isIosPrompt && (
        <button 
          onClick={handleInstallClick}
          className="flex items-center justify-center gap-2 bg-white text-gray-800 border-2 border-gray-200 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm w-full max-w-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Instal Aplikasi KulkasKuliner
        </button>
      )}

      {/* UI UNTUK iOS / SAFARI (Kotak Instruksi Sopan) */}
      {isIosPrompt && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl shadow-sm w-full max-w-sm text-center">
          <h3 className="font-bold text-blue-900 text-sm mb-2">Akses Cepat KulkasKuliner</h3>
          <p className="text-xs text-blue-800 leading-relaxed">
            Instal di iPhone Anda:<br/>
            1. Tekan tombol <strong className="inline-flex items-center gap-1 bg-white px-1 py-0.5 rounded shadow-sm mx-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg> Share</strong> di bawah.<br/>
            2. Pilih menu <strong>➕ Add to Home Screen</strong>.
          </p>
        </div>
      )}
    </div>
  );
}