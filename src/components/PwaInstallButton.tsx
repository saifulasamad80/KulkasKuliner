"use client";

import { useEffect, useState, useRef } from "react";

export default function PwaInstallButton() {
  const [isVisible, setIsVisible] = useState(false);
  
  // Menggunakan useRef alih-alih useState untuk menghindari kehilangan referensi
  // event akibat re-rendering komponen React.
  const deferredPromptRef = useRef<any>(null);

  useEffect(() => {
    // Fungsi ini menangkap sinyal dari browser Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      // 1. Mencegah mini-infobar atau pop-up default Chrome
      e.preventDefault(); 
      // 2. Simpan event mentah ke dalam brankas useRef (anti-hilang)
      deferredPromptRef.current = e; 
      // 3. Tampilkan UI kustom kita
      setIsVisible(true); 
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Tangkap jika user sudah berhasil install sebelumnya
    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      deferredPromptRef.current = null;
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPromptRef.current;
    
    // Jika event hilang atau tidak valid, abaikan eksekusi
    if (!promptEvent) return;

    // Tembakkan trigger instalasi langsung ke Chrome (Synchronous Execution)
    promptEvent.prompt();

    // Sembunyikan UI kita secara instan (UX lebih baik)
    setIsVisible(false);

    // Tunggu hasil konfirmasi dari kotak dialog OS Android
    try {
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        console.log('User menerima PWA KulkasKuliner');
      } else {
        console.log('User membatalkan instalasi');
      }
    } catch (error) {
      console.error('Gagal membaca outcome:', error);
    } finally {
      // Hancurkan referensi event (karena browser hanya mengizinkan dipanggil sekali)
      deferredPromptRef.current = null;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-[9999] flex justify-center pointer-events-none px-4">
      <div className="bg-blue-900 text-white shadow-2xl rounded-full px-5 py-3 flex items-center gap-4 pointer-events-auto border-2 border-yellow-400 animate-bounce">
        <span className="text-sm font-bold">Instal KulkasKuliner App!</span>
        <button 
          onClick={handleInstallClick}
          className="bg-yellow-400 text-blue-900 px-4 py-1.5 rounded-full text-xs font-black hover:bg-yellow-300 transition-colors shadow-sm focus:ring-2 focus:ring-white outline-none"
        >
          INSTALL
        </button>
      </div>
    </div>
  );
}