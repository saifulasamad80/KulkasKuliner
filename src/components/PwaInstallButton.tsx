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
    <div className="w-full sm:w-auto">
      {/* UI UNTUK ANDROID / CHROME (Desain Menyatu dengan Hero) */}
      {!isIosPrompt && (
        <button 
          onClick={handleInstallClick}
          className="flex items-center justify-center gap-2 w-full sm:w-auto bg-white/10 text-white border border-white/20 px-8 py-3.5 rounded-full font-bold hover:bg-white/20 transition-all backdrop-blur-sm shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Instal Aplikasi
        </button>
      )}

      {/* UI UNTUK iOS / SAFARI (Desain Transparan) */}
      {isIosPrompt && (
        <div className="bg-white/10 border border-white/20 p-3 rounded-xl backdrop-blur-sm w-full sm:w-auto text-center text-white shadow-lg">
          <p className="text-xs leading-relaxed">
            <span className="font-bold text-yellow-400">Pengguna iPhone:</span><br/>
            Tekan <strong className="inline-flex items-center gap-1 bg-white/20 px-1 py-0.5 rounded mx-1">Share</strong> di bawah,<br/>
            lalu pilih <strong>➕ Add to Home Screen</strong>.
          </p>
        </div>
      )}
    </div>
  );
}