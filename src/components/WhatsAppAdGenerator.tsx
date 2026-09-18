"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import {
  getAvailableProducts,
  getCatalogUrl,
  getJakartaTimeContext,
  getProductLabel,
  getTimeGreeting,
  selectRotatingProducts,
} from "@/lib/marketing";

type WhatsAppAdGeneratorProps = {
  products: Product[];
};

function getAudienceMoment(hour: number, dayName: string) {
  if (hour >= 4 && hour < 11) {
    return {
      headline: `${getTimeGreeting(hour)}! Siapin stok makan buat ${dayName}, yuk.`,
      urgency: "Frozen food enak, tinggal masak.",
      action: "Cek menu dan pesan sekarang.",
    };
  }

  if (hour >= 11 && hour < 15) {
    return {
      headline: `${getTimeGreeting(hour)}! Lagi lapar tapi nggak mau ribet?`,
      urgency: "Pilih menu, masak sebentar, langsung makan.",
      action: "Pilih menu buat makan hari ini.",
    };
  }

  if (hour >= 15 && hour < 19) {
    return {
      headline: `${getTimeGreeting(hour)}! Siapin menu makan malam dari sekarang.`,
      urgency: "Biar lapar nanti tinggal masak.",
      action: "Cek stok dan amankan menu favorit.",
    };
  }

  return {
    headline: `${getTimeGreeting(hour)}! Besok mau makan praktis?`,
    urgency: "Stok malam ini, besok tinggal masak.",
    action: "Pilih stok buat besok.",
  };
}

function formatProductLine(product: Product) {
  return `• ${getProductLabel(product)} — Rp ${Number(product.price).toLocaleString("id-ID")}`;
}

function createAdvertisement(products: Product[], generation: number) {
  const now = new Date();
  const context = getJakartaTimeContext(now);
  const availableProducts = getAvailableProducts(products);
  const lowStockProducts = availableProducts.filter((product) => product.stock <= 5);
  const rotationSeed = context.hour + now.getMinutes() + context.dayOfMonth + generation * 3;
  const featuredProducts = selectRotatingProducts(availableProducts, rotationSeed);
  const greeting = getTimeGreeting(context.hour);
  const audienceMoment = getAudienceMoment(context.hour, context.dayName);
  const siteUrl = getCatalogUrl();

  const openings = [
    audienceMoment.headline,
    `${greeting}! Freezer kosong? Isi stok, yuk.`,
    `${greeting}! Mau makan enak tanpa ribet?`,
    `${greeting}! Stok frozen food siap buat hari ini.`,
  ];
  const callsToAction = [
    audienceMoment.action,
    "Pesan sekarang. Kurir siap jalan dari Jakarta Timur.",
    "Chat sekarang, pilih menu, beres.",
    "Klik katalog dan pilih favoritmu.",
  ];

  const featuredText = featuredProducts.length > 0
    ? ["\nMenu siap:", ...featuredProducts.map(formatProductLine)].join("\n")
    : "\nMenu sedang di-update. Chat kami buat cek stok.";
  const lowStockText = lowStockProducts.length > 0
    ? `\n⚡ Stok terbatas: ${lowStockProducts.slice(0, 2).map(getProductLabel).join(" dan ")}.`
    : "";
  const rotation = rotationSeed % openings.length;

  return [
    "🍽️ *KULKASKULINER*",
    openings[rotation],
    "",
    audienceMoment.urgency,
    featuredText,
    lowStockText,
    "",
    callsToAction[rotation],
    `👉 ${siteUrl}`,
  ].join("\n").replace(/\n{3,}/g, "\n\n");
}

function getWhatsAppShareUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export default function WhatsAppAdGenerator({ products }: WhatsAppAdGeneratorProps) {
  const [generation, setGeneration] = useState(0);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const availableProducts = getAvailableProducts(products);
  const availableCount = availableProducts.length;
  const lowStockCount = availableProducts.filter((product) => product.stock <= 5).length;

  const generateNewAd = () => {
    setCopied(false);
    const nextGeneration = generation + 1;
    setGeneration(nextGeneration);
    setMessage(createAdvertisement(products, nextGeneration));
  };

  const copyMessage = async () => {
    if (!message) return;

    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_500);
    } catch {
      alert("Copy otomatis ditolak browser. Blok teks iklannya lalu copy manual, ya.");
    }
  };

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-green-200 bg-linear-to-br from-green-50 via-white to-emerald-50 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-green-100 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full bg-green-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">Marketing</span>
            <span className="text-xs font-semibold text-green-700">Live dari katalog aktif</span>
          </div>
          <h2 className="text-xl font-black text-gray-900 sm:text-2xl">Generator Iklan WhatsApp</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Copy singkat berdasarkan jam Jakarta dan stok aktif. Tinggal share.
          </p>
        </div>
        <button
          type="button"
          onClick={generateNewAd}
          className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 sm:w-auto"
        >
          <span className="text-lg leading-none">✦</span>
          Buat Iklan Baru
        </button>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <label htmlFor="whatsapp-ad-copy" className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-600">
            Preview pesan — bebas diedit
          </label>
          <textarea
            id="whatsapp-ad-copy"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={10}
            disabled={!message}
            className="w-full resize-y rounded-xl border border-gray-300 bg-white p-4 text-sm leading-6 text-gray-800 shadow-inner outline-none transition-shadow focus:border-green-500 focus:ring-2 focus:ring-green-200 disabled:cursor-wait disabled:bg-gray-50"
            aria-label="Preview teks iklan WhatsApp"
          />
          <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={() => void copyMessage()}
              disabled={!message}
              className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? "✓ Tersalin" : "Salin Teks"}
            </button>
            <a
              href={message ? getWhatsAppShareUrl(message) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!message}
              className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-center text-sm font-bold text-white transition-colors ${message ? "bg-[#25D366] hover:bg-[#1ebe5d]" : "pointer-events-none bg-gray-300"}`}
            >
              Buka WhatsApp &amp; Share →
            </a>
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-green-100 bg-white/80 p-4">
          <p className="mb-3 text-xs font-black uppercase tracking-wider text-green-800">Kondisi yang dipakai</p>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-500">Produk aktif &amp; ada stok</dt>
              <dd className="font-black text-gray-900">{availableCount}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-500">Stok menipis (≤ 5)</dt>
              <dd className={`font-black ${lowStockCount > 0 ? "text-orange-600" : "text-gray-900"}`}>{lowStockCount}</dd>
            </div>
          </dl>
          <p className="mt-4 border-t border-gray-100 pt-3 text-xs leading-5 text-gray-500">
            Link share nggak mengirim otomatis. WhatsApp akan kebuka dengan teks siap kirim supaya admin tetap bisa pilih kontak atau grup tujuan.
          </p>
        </aside>
      </div>
    </section>
  );
}