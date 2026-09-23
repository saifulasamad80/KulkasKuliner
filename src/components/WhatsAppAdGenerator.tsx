"use client";

import { useState, useSyncExternalStore } from "react";
import type { FavoriteMenu, Product } from "@/lib/types";
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
  favoriteMenus?: FavoriteMenu[];
};

type ShareMode = "chat" | "status";

/** WhatsApp's own hard limit for a text Status — enforced natively, not by us. */
const STATUS_MAX_CHARS = 700;
const STATUS_MAX_LINES = 10;

function getAudienceMoment(hour: number, dayName: string) {
  if (hour >= 4 && hour < 11) {
    return {
      headline: `${getTimeGreeting(hour)}! Siapin stok makan buat ${dayName}, yuk.`,
      urgency: "Frozen food enak, tinggal masak.",
      action: "Cek menu dan amankan sebelum kehabisan.",
    };
  }

  if (hour >= 11 && hour < 15) {
    return {
      headline: `${getTimeGreeting(hour)}! Lagi lapar? Jangan sampai kehabisan stok.`,
      urgency: "Pilih menu, masak sebentar, langsung makan.",
      action: "Chat sekarang sebelum kehabisan.",
    };
  }

  if (hour >= 15 && hour < 19) {
    return {
      headline: `${getTimeGreeting(hour)}! Buruan siapin menu makan malam.`,
      urgency: "Biar lapar nanti tinggal masak, bukan mikir stok habis.",
      action: "Amankan menu favorit sebelum kehabisan.",
    };
  }

  return {
    headline: `${getTimeGreeting(hour)}! Stok malam ini terbatas.`,
    urgency: "Order sekarang, besok tinggal masak.",
    action: "Pesan sekarang, jangan sampai kehabisan.",
  };
}

function formatProductLine(product: Product) {
  return `• ${getProductLabel(product)} — Rp ${Number(product.price).toLocaleString("id-ID")}`;
}

/** Real scarcity/social-proof line — never a fabricated claim, always sourced from actual data. */
function getFomoLine(lowStockProducts: Product[], favoriteMenus: FavoriteMenu[]) {
  if (lowStockProducts.length > 0) {
    const top = lowStockProducts[0];
    return `⚡ Tinggal ${top.stock} porsi ${getProductLabel(top)}! Buruan sebelum kehabisan.`;
  }
  const topFavorite = favoriteMenus.find((menu) => menu.soldQuantity > 0);
  if (topFavorite) {
    return `🔥 Paling laris hari ini: ${topFavorite.label}. Buruan sebelum kehabisan.`;
  }
  return "🔥 Stok terbatas tiap hari — jangan sampai kehabisan.";
}

/** Full version for chat/group share — no hard length limit, but scarcity now leads, not trails. */
function createChatAdvertisement(products: Product[], favoriteMenus: FavoriteMenu[], generation: number) {
  const now = new Date();
  const context = getJakartaTimeContext(now);
  const availableProducts = getAvailableProducts(products);
  const lowStockProducts = availableProducts.filter((product) => product.stock <= 5).sort((a, b) => a.stock - b.stock);
  const rotationSeed = context.hour + now.getMinutes() + context.dayOfMonth + generation * 3;
  const featuredProducts = selectRotatingProducts(availableProducts, rotationSeed);
  const audienceMoment = getAudienceMoment(context.hour, context.dayName);
  const siteUrl = getCatalogUrl();

  const callsToAction = [
    audienceMoment.action,
    "Pesan sekarang sebelum kehabisan. Kurir siap jalan dari Jakarta Timur.",
    "Chat sekarang, pilih menu, beres.",
    "Klik katalog dan amankan favoritmu sebelum kehabisan.",
  ];

  const fomoLine = getFomoLine(lowStockProducts, favoriteMenus);
  const featuredText = featuredProducts.length > 0
    ? ["\nMenu siap:", ...featuredProducts.map(formatProductLine)].join("\n")
    : "\nMenu sedang di-update. Chat kami buat cek stok.";
  const rotation = rotationSeed % callsToAction.length;

  return [
    "🍽️ *KULKASKULINER*",
    audienceMoment.headline,
    fomoLine,
    "",
    audienceMoment.urgency,
    featuredText,
    "",
    callsToAction[rotation],
    `👉 ${siteUrl}`,
  ].join("\n").replace(/\n{3,}/g, "\n\n");
}

/** Short version built to always fit WhatsApp Status's 700-char/10-line limit. */
function createStatusAdvertisement(products: Product[], favoriteMenus: FavoriteMenu[], generation: number) {
  const now = new Date();
  const context = getJakartaTimeContext(now);
  const availableProducts = getAvailableProducts(products);
  const lowStockProducts = availableProducts.filter((product) => product.stock <= 5).sort((a, b) => a.stock - b.stock);
  const rotationSeed = context.hour + now.getMinutes() + context.dayOfMonth + generation * 3;
  const audienceMoment = getAudienceMoment(context.hour, context.dayName);
  const siteUrl = getCatalogUrl();

  const ctas = [
    "Chat sekarang sebelum kehabisan",
    "Buruan order, kurir siap jalan",
    "Amankan menu favoritmu sekarang",
  ];

  return [
    "🍽️ *KULKASKULINER*",
    audienceMoment.headline,
    getFomoLine(lowStockProducts, favoriteMenus),
    `${ctas[rotationSeed % ctas.length]} 👇`,
    siteUrl,
  ].join("\n");
}

function getWhatsAppShareUrl(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

type PhotoCandidate = { id: string; label: string; url: string };

/** Browser support for sharing files varies (mobile yes, most desktop no) and can't be known during SSR. */
function subscribeToNothing() {
  return () => {};
}
function getCanShareFilesSnapshot() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}
function getCanShareFilesServerSnapshot() {
  return false;
}

/** Photos to offer, best match first: the low-stock item driving the FOMO line, then the top favorite, then the rest. */
function getPhotoCandidates(availableProducts: Product[], favoriteMenus: FavoriteMenu[]): PhotoCandidate[] {
  const lowStockFirst = [...availableProducts].filter((product) => product.stock <= 5).sort((a, b) => a.stock - b.stock)[0];
  const topFavorite = favoriteMenus
    .find((menu) => menu.soldQuantity > 0)
    ?.products.find((product) => product.is_active && product.stock > 0);

  const seen = new Set<string>();
  const candidates: PhotoCandidate[] = [];
  for (const product of [lowStockFirst, topFavorite, ...availableProducts]) {
    if (!product || !product.image_url?.trim() || seen.has(product.id)) continue;
    seen.add(product.id);
    candidates.push({ id: product.id, label: getProductLabel(product), url: product.image_url });
    if (candidates.length >= 6) break;
  }
  return candidates;
}

export default function WhatsAppAdGenerator({ products, favoriteMenus = [] }: WhatsAppAdGeneratorProps) {
  const [mode, setMode] = useState<ShareMode>("chat");
  const [generation, setGeneration] = useState(0);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [isSharingPhoto, setIsSharingPhoto] = useState(false);
  const canShareFiles = useSyncExternalStore(subscribeToNothing, getCanShareFilesSnapshot, getCanShareFilesServerSnapshot);

  const availableProducts = getAvailableProducts(products);
  const availableCount = availableProducts.length;
  const lowStockCount = availableProducts.filter((product) => product.stock <= 5).length;
  const photoCandidates = getPhotoCandidates(availableProducts, favoriteMenus);
  const selectedPhoto = photoCandidates.find((candidate) => candidate.id === selectedPhotoId) ?? photoCandidates[0] ?? null;

  const buildMessage = (nextMode: ShareMode, nextGeneration: number) =>
    nextMode === "status"
      ? createStatusAdvertisement(products, favoriteMenus, nextGeneration)
      : createChatAdvertisement(products, favoriteMenus, nextGeneration);

  const generateNewAd = () => {
    setCopied(false);
    const nextGeneration = generation + 1;
    setGeneration(nextGeneration);
    setMessage(buildMessage(mode, nextGeneration));
  };

  const changeMode = (nextMode: ShareMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    setCopied(false);
    if (message) setMessage(buildMessage(nextMode, generation));
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

  const shareWithPhoto = async () => {
    if (!message || !selectedPhoto) return;
    setIsSharingPhoto(true);
    try {
      const response = await fetch(selectedPhoto.url);
      if (!response.ok) throw new Error("Foto gagal diambil.");
      const blob = await response.blob();
      const extension = blob.type.split("/")[1]?.split("+")[0] || "jpg";
      const fileName = `${selectedPhoto.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.${extension}`;
      const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });

      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        throw new Error("Browser ini belum bisa share foto langsung.");
      }

      await navigator.share({ files: [file], text: message });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      alert(
        "Share foto langsung nggak didukung di browser/perangkat ini. Buka fotonya (tombol di bawah thumbnail), simpan, lalu lampirkan manual pas kirim di WhatsApp."
      );
    } finally {
      setIsSharingPhoto(false);
    }
  };

  const charCount = message.length;
  const lineCount = message ? message.split("\n").length : 0;
  const overStatusLimit = mode === "status" && (charCount > STATUS_MAX_CHARS || lineCount > STATUS_MAX_LINES);

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
            Copy singkat berdasarkan jam Jakarta, stok aktif, dan menu paling laris. Bisa sertakan foto juga.
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
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-gray-600">Dipakai buat:</span>
            <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
              <button
                type="button"
                onClick={() => changeMode("chat")}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${mode === "chat" ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >
                Chat / Grup
              </button>
              <button
                type="button"
                onClick={() => changeMode("status")}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${mode === "status" ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >
                Status WA
              </button>
            </div>
            {mode === "status" && (
              <span className="text-xs text-gray-500">Otomatis dibuat pendek biar nggak kena limit Status (700 karakter / 10 baris).</span>
            )}
          </div>

          <label htmlFor="whatsapp-ad-copy" className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-600">
            Preview pesan — bebas diedit
          </label>
          <textarea
            id="whatsapp-ad-copy"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={mode === "status" ? 6 : 10}
            disabled={!message}
            className={`w-full resize-y rounded-xl border bg-white p-4 text-sm leading-6 text-gray-800 shadow-inner outline-none transition-shadow focus:ring-2 disabled:cursor-wait disabled:bg-gray-50 ${overStatusLimit ? "border-red-400 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-green-500 focus:ring-green-200"}`}
            aria-label="Preview teks iklan WhatsApp"
          />

          {mode === "status" && message && (
            <p className={`mt-2 text-xs font-bold ${overStatusLimit ? "text-red-600" : "text-gray-500"}`}>
              {charCount}/{STATUS_MAX_CHARS} karakter · {lineCount}/{STATUS_MAX_LINES} baris
              {overStatusLimit ? " — kepanjangan buat Status, WhatsApp bakal nolak. Potong dulu teksnya." : " — aman buat Status."}
            </p>
          )}

          {photoCandidates.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-black uppercase tracking-wider text-gray-600">Foto buat disertakan (opsional)</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photoCandidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => setSelectedPhotoId(candidate.id)}
                    title={candidate.label}
                    aria-label={`Pakai foto ${candidate.label}`}
                    aria-pressed={selectedPhoto?.id === candidate.id}
                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${selectedPhoto?.id === candidate.id ? "border-green-600" : "border-transparent hover:border-green-300"}`}
                  >
                    <img src={candidate.url} alt={candidate.label} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

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
              href={message && !overStatusLimit ? getWhatsAppShareUrl(message) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!message || overStatusLimit}
              title={overStatusLimit ? "Potong teksnya dulu supaya muat di Status WhatsApp" : undefined}
              className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-center text-sm font-bold text-white transition-colors ${message && !overStatusLimit ? "bg-[#25D366] hover:bg-[#1ebe5d]" : "pointer-events-none bg-gray-300"}`}
            >
              Buka WhatsApp &amp; Share →
            </a>
            {canShareFiles && selectedPhoto && (
              <button
                type="button"
                onClick={() => void shareWithPhoto()}
                disabled={!message || overStatusLimit || isSharingPhoto}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#1ebe5d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSharingPhoto ? "Menyiapkan foto…" : "📷 Share dengan Foto"}
              </button>
            )}
          </div>

          {!canShareFiles && selectedPhoto && (
            <p className="mt-2 text-xs text-gray-500">
              Share foto otomatis cuma jalan di HP.{" "}
              <a href={selectedPhoto.url} target="_blank" rel="noopener noreferrer" className="font-bold text-green-700 underline">
                Buka fotonya di sini
              </a>
              , simpan (tekan lama gambarnya), lalu lampirkan manual pas kirim di WhatsApp.
            </p>
          )}
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
            Link teks nggak mengirim otomatis — WhatsApp kebuka dengan teks siap kirim, admin tetap pilih kontak, grup, atau Status tujuan. Tombol foto membuka menu share HP; WhatsApp muncul sebagai salah satu pilihannya.
          </p>
        </aside>
      </div>
    </section>
  );
}
