"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";

type WhatsAppAdGeneratorProps = {
  products: Product[];
};

type TimeContext = {
  hour: number;
  dayName: string;
  dayOfMonth: number;
};

const JAKARTA_TIME_ZONE = "Asia/Jakarta";

function getJakartaTimeContext(date: Date): TimeContext {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = Number(values.hour === "24" ? "0" : values.hour);

  return {
    hour,
    dayName: new Intl.DateTimeFormat("id-ID", {
      timeZone: JAKARTA_TIME_ZONE,
      weekday: "long",
    }).format(date),
    dayOfMonth: Number(values.day),
  };
}

function getTimeGreeting(hour: number) {
  if (hour >= 4 && hour < 11) return "Selamat pagi";
  if (hour >= 11 && hour < 15) return "Selamat siang";
  if (hour >= 15 && hour < 19) return "Selamat sore";
  return "Selamat malam";
}

function getAudienceMoment(hour: number, dayName: string) {
  if (hour >= 4 && hour < 11) {
    return {
      headline: `${getTimeGreeting(hour)}! Sebelum hari makin padat, siapin stok makan praktis buat ${dayName}.`,
      urgency: "Ambil keputusan dari sekarang—nanti saat mulai lapar, tinggal masak tanpa perlu keluar cari makan.",
      action: "Cek menu pagi ini dan amankan stok yang paling cocok buat aktivitas hari ini.",
    };
  }

  if (hour >= 11 && hour < 15) {
    return {
      headline: `${getTimeGreeting(hour)}! Lagi butuh makan enak yang nggak makan waktu?`,
      urgency: "Pas energi dan fokus lagi kebagi, menu praktis bikin waktu istirahat tetap nyaman tanpa mikir panjang.",
      action: "Pilih sekarang—biar urusan makan hari ini langsung beres.",
    };
  }

  if (hour >= 15 && hour < 19) {
    return {
      headline: `${getTimeGreeting(hour)}! Energi mulai turun? Jangan sampai makan malam berujung pesan seadanya.`,
      urgency: "Ini momen yang pas buat siapin menu malam sebelum rasa lapar bikin pilihan jadi terburu-buru.",
      action: "Lihat stok yang tersedia dan amankan menu favorit sebelum jam makan malam.",
    };
  }

  return {
    headline: `${getTimeGreeting(hour)}! Besok mau lebih siap tanpa drama soal makan?`,
    urgency: "Siapkan stok malam ini—besok tinggal ambil dari freezer saat waktu dan energi lagi terbatas.",
    action: "Pilih stok untuk besok sekarang, supaya pagi nggak mulai hari dengan keputusan yang ribet.",
  };
}

function getProductLabel(product: Product) {
  return `${product.name}${product.variant_name ? ` ${product.variant_name}` : ""}`.trim();
}

function formatProductLine(product: Product) {
  return `• ${getProductLabel(product)} — Rp ${Number(product.price).toLocaleString("id-ID")}`;
}

function createAdvertisement(products: Product[], generation: number) {
  const now = new Date();
  const context = getJakartaTimeContext(now);
  const availableProducts = products.filter((product) => product.is_active && product.stock > 0);
  const lowStockProducts = availableProducts.filter((product) => product.stock <= 5);
  const rotationSeed = context.hour + now.getMinutes() + context.dayOfMonth + generation * 3;
  const availableCount = Math.min(3, availableProducts.length);
  const featuredProducts = Array.from({ length: availableCount }, (_, index) => {
    return availableProducts[(rotationSeed + index) % availableProducts.length];
  });
  const greeting = getTimeGreeting(context.hour);
  const audienceMoment = getAudienceMoment(context.hour, context.dayName);
  const siteOrigin = typeof window === "undefined" ? "https://kulkaskuliner.vercel.app" : window.location.origin;
  const siteUrl = `${siteOrigin}/#katalog`;

  const openings = [
    audienceMoment.headline,
    `${greeting}! Freezer kosong jangan dibiarin sampai lapar datang, nih.`,
    `${greeting}! Waktunya siapin makanan enak tanpa bikin fokus hari ini buyar.`,
    `${greeting}! Ada stok frozen food premium buat nemenin ritme harian yang makin padat.`,
  ];
  const callsToAction = [
    audienceMoment.action,
    "Pesan sekarang, kurir Instan/Sameday siap jalan dari Jakarta Timur.",
    "Chat sekarang, pilih menu yang pas, lalu lanjutkan aktivitas tanpa urusan makan yang berlarut.",
    "Klik katalog, pilih menu favorit, dan bereskan stok sebelum nanti lupa.",
  ];

  const featuredText = featuredProducts.length > 0
    ? ["\nPilihan yang lagi siap dipesan:", ...featuredProducts.map(formatProductLine)].join("\n")
    : "\nKatalog lagi di-update. Chat kami buat cek menu yang tersedia hari ini.";
  const lowStockText = lowStockProducts.length > 0
    ? `\n\n⚡ *Stok menipis:* ${lowStockProducts.slice(0, 2).map(getProductLabel).join(" dan ")}. Kalau memang cocok, lebih aman diamankan sekarang sebelum pilihan ini habis.`
    : "";
  const rotation = rotationSeed % openings.length;

  return [
    "🍽️ *KULKASKULINER*",
    openings[rotation],
    "",
    audienceMoment.urgency,
    "Frozen food premium buat stok dapur, bekal keluarga, atau makan praktis kapan aja.",
    featuredText,
    lowStockText,
    "",
    callsToAction[rotation],
    siteUrl,
    "",
    "#FrozenFood #KulkasKuliner #JakartaTimur",
  ].join("\n").replace(/\n{3,}/g, "\n\n");
}

function getWhatsAppShareUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export default function WhatsAppAdGenerator({ products }: WhatsAppAdGeneratorProps) {
  const [generation, setGeneration] = useState(0);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const availableCount = products.filter((product) => product.is_active && product.stock > 0).length;
  const lowStockCount = products.filter((product) => product.is_active && product.stock > 0 && product.stock <= 5).length;

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
            Bikin copy iklan baru berdasarkan jam Jakarta, hari, dan kondisi stok. Tinggal edit kalau perlu lalu share.
          </p>
        </div>
        <button
          type="button"
          onClick={generateNewAd}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
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
            rows={13}
            disabled={!message}
            className="w-full resize-y rounded-xl border border-gray-300 bg-white p-4 text-sm leading-6 text-gray-800 shadow-inner outline-none transition-shadow focus:border-green-500 focus:ring-2 focus:ring-green-200 disabled:cursor-wait disabled:bg-gray-50"
            aria-label="Preview teks iklan WhatsApp"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyMessage()}
              disabled={!message}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? "✓ Tersalin" : "Salin Teks"}
            </button>
            <a
              href={message ? getWhatsAppShareUrl(message) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!message}
              className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors ${message ? "bg-[#25D366] hover:bg-[#1ebe5d]" : "pointer-events-none bg-gray-300"}`}
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