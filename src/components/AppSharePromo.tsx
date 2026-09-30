"use client";

import { useState, useSyncExternalStore } from "react";
import { getSiteOrigin } from "@/lib/marketing";

/** Setiap varian sudah diverifikasi tetap di bawah limit WhatsApp Status (700 karakter / 10 baris). */
function createAppInviteMessage(generation: number) {
  const siteUrl = `${getSiteOrigin()}/`;

  const variants = [
    [
      "📲 KulkasKuliner sekarang bisa jadi aplikasi di HP kamu!",
      "",
      "Nggak perlu download dari Play Store — buka lebih cepat, langsung lihat menu dan promo terbaru.",
      "",
      "Caranya:",
      'Android: buka link, tekan "Instal Aplikasi"',
      'iPhone: buka link, tekan Share, pilih "Add to Home Screen"',
      "",
      siteUrl,
    ],
    [
      "🔔 Biar nggak ribet cari-cari chat tiap mau pesan frozen food...",
      "",
      "Pasang aplikasi KulkasKuliner di HP kamu — tinggal 1 ketuk dari layar utama, langsung buka menu.",
      "",
      `👉 ${siteUrl}`,
      '(Android: tombol "Instal Aplikasi" / iPhone: Share lalu "Add to Home Screen")',
    ],
    [
      "🍽️ Mau pesan tanpa buka browser dulu?",
      "",
      "Aplikasi KulkasKuliner bisa nempel di layar utama HP kamu, kayak aplikasi beneran — tapi nggak makan memori HP.",
      "",
      `👉 ${siteUrl}`,
      'Tekan "Instal Aplikasi" (Android) atau Share lalu "Add to Home Screen" (iPhone).',
    ],
  ];

  return { message: variants[generation % variants.length].join("\n"), siteUrl };
}

function getWhatsAppShareUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function subscribeToNothing() {
  return () => {};
}
function getCanShareSnapshot() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}
function getCanShareServerSnapshot() {
  return false;
}

export default function AppSharePromo() {
  const [generation, setGeneration] = useState(0);
  const [message, setMessage] = useState(() => createAppInviteMessage(0).message);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const canShare = useSyncExternalStore(subscribeToNothing, getCanShareSnapshot, getCanShareServerSnapshot);

  const regenerate = () => {
    const nextGeneration = generation + 1;
    setGeneration(nextGeneration);
    setMessage(createAppInviteMessage(nextGeneration).message);
    setCopied(false);
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_500);
    } catch {
      alert("Copy otomatis ditolak browser. Blok teksnya lalu copy manual, ya.");
    }
  };

  const shareNative = async () => {
    setIsSharing(true);
    try {
      await navigator.share({ title: "KulkasKuliner", text: message });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      alert("Share langsung nggak didukung di sini. Pakai tombol Salin Teks atau Buka WhatsApp sebagai gantinya.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-cyan-200 bg-linear-to-br from-cyan-50 via-white to-blue-50 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-cyan-100 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full bg-cyan-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">Aplikasi</span>
            <span className="text-xs font-semibold text-cyan-700">Ajak pelanggan pasang PWA</span>
          </div>
          <h2 className="text-xl font-black text-gray-900 sm:text-2xl">Ajakan Pasang Aplikasi</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Makin banyak pelanggan pasang aplikasinya, makin gampang kamu pantau minatnya di Modul Statistik.
          </p>
        </div>
        <button
          type="button"
          onClick={regenerate}
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 sm:w-auto"
        >
          <span className="text-lg leading-none">✦</span>
          Ganti Ajakan
        </button>
      </div>

      <div className="p-5 sm:p-6">
        <label htmlFor="app-invite-copy" className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-600">
          Preview pesan — bebas diedit
        </label>
        <textarea
          id="app-invite-copy"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={7}
          className="w-full resize-y rounded-xl border border-gray-300 bg-white p-4 text-sm leading-6 text-gray-800 shadow-inner outline-none transition-shadow focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          aria-label="Preview teks ajakan pasang aplikasi"
        />

        <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={() => void copyMessage()}
            className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
          >
            {copied ? "✓ Tersalin" : "Salin Teks"}
          </button>
          <a
            href={getWhatsAppShareUrl(message)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#25D366] px-4 py-2 text-center text-sm font-bold text-white transition-colors hover:bg-[#1ebe5d]"
          >
            Buka WhatsApp &amp; Share →
          </a>
          {canShare && (
            <button
              type="button"
              onClick={() => void shareNative()}
              disabled={isSharing}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSharing ? "Menyiapkan…" : "📤 Share ke Lainnya"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
