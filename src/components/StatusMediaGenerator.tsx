"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { FavoriteMenu, Product } from "@/lib/types";
import {
  getAvailableProducts,
  getFavoriteProducts,
  getJakartaTimeContext,
  getProductLabel,
  getSiteOrigin,
  getTimeGreeting,
} from "@/lib/marketing";
import { COLLAGE_MAX_PHOTOS, renderCollage, type CollageStyle } from "@/lib/collage-image";
import { generateSlideshowVideo, getVideoExtension, type SlideshowProgress } from "@/lib/slideshow-video";

type StatusMediaGeneratorProps = {
  products: Product[];
  favoriteMenus?: FavoriteMenu[];
};

type MediaResult = { url: string; file: File; kind: "image" | "video" };

function subscribeToNothing() {
  return () => {};
}
function getCanShareFilesSnapshot() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function" && typeof navigator.canShare === "function";
}
function getCanShareFilesServerSnapshot() {
  return false;
}

/** Urutan foto: menu terlaris dulu, lalu stok menipis, lalu sisanya. Hanya produk aktif, ada stok, dan punya foto. */
function getCandidates(products: Product[], favoriteMenus: FavoriteMenu[]) {
  const withPhoto = getAvailableProducts(products).filter((product) => Boolean(product.image_url?.trim()));
  const favorites = getFavoriteProducts(favoriteMenus, true);
  const lowStock = withPhoto.filter((product) => product.stock <= 5).sort((a, b) => a.stock - b.stock);

  const seen = new Set<string>();
  const ordered: Product[] = [];
  for (const product of [...favorites, ...lowStock, ...withPhoto]) {
    if (seen.has(product.id) || !withPhoto.some((item) => item.id === product.id)) continue;
    seen.add(product.id);
    ordered.push(product);
  }
  return ordered;
}

/** Ambil `count` produk acak (Fisher-Yates), supaya kolase harian nggak itu-itu terus. */
function pickRandom(products: Product[], count: number) {
  const pool = [...products];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function buildCaption() {
  const origin = getSiteOrigin();
  return [
    "🍽️ KULKASKULINER — frozen food siap kirim",
    `Pesan langsung di: ${origin}`,
    "",
    "💌 Share ke temen atau keluarga kamu juga ya!",
  ].join("\n");
}

export default function StatusMediaGenerator({ products, favoriteMenus = [] }: StatusMediaGeneratorProps) {
  const candidates = getCandidates(products, favoriteMenus);
  const [style, setStyle] = useState<CollageStyle>("label");
  const [selectedIds, setSelectedIds] = useState<string[]>(() => candidates.slice(0, COLLAGE_MAX_PHOTOS.label).map((product) => product.id));
  const [result, setResult] = useState<MediaResult | null>(null);
  const [busy, setBusy] = useState<"image" | "video" | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const canShareFiles = useSyncExternalStore(subscribeToNothing, getCanShareFilesSnapshot, getCanShareFilesServerSnapshot);

  // Bersihkan URL blob lama supaya memori HP nggak bocor.
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  const maxPhotos = COLLAGE_MAX_PHOTOS[style];
  const selectedProducts = selectedIds
    .map((id) => candidates.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product));

  const changeStyle = (next: CollageStyle) => {
    setStyle(next);
    setResult(null);
    setMessage(null);
    // Isi otomatis sampai batas gaya baru, pertahankan pilihan yang sudah ada.
    setSelectedIds((current) => {
      const kept = current.slice(0, COLLAGE_MAX_PHOTOS[next]);
      const extra = candidates.filter((product) => !kept.includes(product.id)).slice(0, COLLAGE_MAX_PHOTOS[next] - kept.length);
      return [...kept, ...extra.map((product) => product.id)];
    });
  };

  const shufflePhotos = () => {
    setResult(null);
    setMessage(null);
    setSelectedIds(pickRandom(candidates, maxPhotos).map((product) => product.id));
  };

  const resetToBestSellers = () => {
    setResult(null);
    setMessage(null);
    setSelectedIds(candidates.slice(0, maxPhotos).map((product) => product.id));
  };

  const togglePhoto = (id: string) => {
    setResult(null);
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : current.length >= maxPhotos ? current : [...current, id]
    );
  };

  const toPhotos = () =>
    selectedProducts.map((product) => ({
      url: product.image_url as string,
      title: getProductLabel(product),
      price: Number(product.price),
    }));

  const makeImage = async () => {
    setBusy("image");
    setMessage(null);
    setResult(null);
    try {
      const footer = `Pesan: ${getSiteOrigin().replace(/^https?:\/\//, "")}`;
      const { blob, failedCount } = await renderCollage(toPhotos(), style, footer);
      const file = new File([blob], `kulkaskuliner-${style}.jpg`, { type: "image/jpeg" });
      setResult({ url: URL.createObjectURL(blob), file, kind: "image" });
      if (failedCount > 0) setMessage(`${failedCount} foto gagal dimuat dan diganti kotak abu-abu. Cek koneksi atau ganti fotonya.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gambar gagal dibuat.");
    } finally {
      setBusy(null);
    }
  };

  const makeVideo = async () => {
    setBusy("video");
    setProgress(0);
    setMessage(null);
    setResult(null);
    try {
      const context = getJakartaTimeContext(new Date());
      const hook = `${getTimeGreeting(context.hour)}! Stok frozen food ready, tinggal pilih:`;
      const photos = toPhotos().map((photo) => ({
        url: photo.url,
        title: photo.title,
        subtitle: `Rp ${photo.price.toLocaleString("id-ID")}`,
      }));
      const { blob, mimeType } = await generateSlideshowVideo(photos, hook, "Pesan sekarang di", getSiteOrigin(), (value: SlideshowProgress) => {
        setProgress(value.ratio);
      });
      const extension = getVideoExtension(mimeType);
      const file = new File([blob], `kulkaskuliner-status.${extension}`, { type: mimeType.split(";")[0] });
      setResult({ url: URL.createObjectURL(blob), file, kind: "video" });
      if (extension === "webm") {
        setMessage("Browser ini cuma bisa bikin video .webm — WhatsApp kadang nolak format ini. Kalau gagal diunggah ke Status, coba bikin dari Chrome versi terbaru.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Video gagal dibuat.");
    } finally {
      setBusy(null);
    }
  };

  const shareResult = async () => {
    if (!result) return;
    setIsSharing(true);
    try {
      if (!navigator.canShare({ files: [result.file] })) {
        throw new Error("Browser ini belum bisa share file langsung. Pakai tombol Download, lalu unggah dari galeri.");
      }
      await navigator.share({ files: [result.file], text: buildCaption() });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage(error instanceof Error ? error.message : "Gagal membagikan file.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 via-white to-orange-50 shadow-sm">
      <div className="border-b border-amber-100 p-5 sm:p-6">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-amber-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">Status &amp; Pesan WA</span>
          <span className="text-xs font-semibold text-amber-800">Gambar kolase atau video bertulisan</span>
        </div>
        <h2 className="text-xl font-black text-gray-900 sm:text-2xl">Gambar &amp; Video untuk Status</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-600">
          Pilih foto menu, lalu bikin satu gambar kolase atau video slideshow. Nama &amp; harga diambil otomatis dari katalog.
        </p>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-gray-600">1. Pilih gaya gambar</p>
          <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2">
            <button
              type="button"
              onClick={() => changeStyle("label")}
              aria-pressed={style === "label"}
              className={`min-h-16 rounded-xl border-2 p-3 text-left transition ${style === "label" ? "border-amber-600 bg-amber-50 ring-4 ring-amber-100" : "border-gray-200 bg-white hover:border-gray-300"}`}
            >
              <span className="block text-base font-black text-gray-900">🏷️ Label Nama</span>
              <span className="mt-0.5 block text-sm text-gray-600">2 kolom, foto besar + nama. Maks 6 foto.</span>
            </button>
            <button
              type="button"
              onClick={() => changeStyle("katalog")}
              aria-pressed={style === "katalog"}
              className={`min-h-16 rounded-xl border-2 p-3 text-left transition ${style === "katalog" ? "border-amber-600 bg-amber-50 ring-4 ring-amber-100" : "border-gray-200 bg-white hover:border-gray-300"}`}
            >
              <span className="block text-base font-black text-gray-900">💰 Katalog Harga</span>
              <span className="mt-0.5 block text-sm text-gray-600">3 kolom, ada harga. Maks 9 foto.</span>
            </button>
          </div>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-wider text-gray-600">
              2. Pilih foto ({selectedProducts.length}/{maxPhotos}) — urutan sesuai angka
            </p>
            {candidates.length > maxPhotos && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={shufflePhotos}
                  disabled={busy !== null}
                  className="min-h-10 rounded-lg bg-amber-600 px-3 text-sm font-black text-white transition hover:bg-amber-700 disabled:opacity-50"
                >
                  🔀 Acak Foto
                </button>
                <button
                  type="button"
                  onClick={resetToBestSellers}
                  disabled={busy !== null}
                  className="min-h-10 rounded-lg border border-amber-300 bg-white px-3 text-sm font-black text-amber-800 transition hover:bg-amber-50 disabled:opacity-50"
                >
                  🏆 Terlaris
                </button>
              </div>
            )}
          </div>
          {candidates.length === 0 ? (
            <p className="rounded-lg border border-dashed border-orange-300 bg-orange-50 p-3 text-sm text-orange-800">
              Belum ada menu aktif yang punya foto dan stok. Isi foto di Modul Menu dulu.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {candidates.map((product) => {
                const order = selectedIds.indexOf(product.id);
                const isSelected = order !== -1;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => togglePhoto(product.id)}
                    title={getProductLabel(product)}
                    aria-pressed={isSelected}
                    aria-label={`${isSelected ? "Batalkan" : "Pilih"} ${getProductLabel(product)}`}
                    className={`relative overflow-hidden rounded-lg border-2 transition ${isSelected ? "border-amber-600" : "border-transparent opacity-60 hover:opacity-100"}`}
                  >
                    <img src={product.image_url as string} alt={getProductLabel(product)} className="aspect-square w-full object-cover" />
                    {isSelected && (
                      <span className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-xs font-black text-white">{order + 1}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-gray-600">3. Buat</p>
          <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2">
            <button
              type="button"
              onClick={() => void makeImage()}
              disabled={selectedProducts.length === 0 || busy !== null}
              className="min-h-12 rounded-xl bg-amber-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "image" ? "Menyusun gambar…" : "🖼️ Buat Gambar Kolase"}
            </button>
            <button
              type="button"
              onClick={() => void makeVideo()}
              disabled={selectedProducts.length === 0 || busy !== null}
              className="min-h-12 rounded-xl bg-gray-900 px-4 text-sm font-black text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "video" ? `Merekam video… ${Math.round(progress * 100)}%` : "🎬 Buat Video Bertulisan"}
            </button>
          </div>
          {busy === "video" && (
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full bg-gray-900 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
          )}
          <p className="mt-2 text-xs text-gray-500">Video ±3 detik per foto. Biarkan layar tetap menyala selama perekaman.</p>
        </div>

        {message && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900">{message}</p>}

        {result && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="mb-3 text-sm font-black text-gray-900">Hasil — cek dulu sebelum dibagikan</p>
            {result.kind === "image" ? (
              <img src={result.url} alt="Hasil gambar kolase" className="mx-auto max-h-[520px] w-auto rounded-lg border border-gray-200" />
            ) : (
              <video src={result.url} controls loop muted playsInline className="mx-auto max-h-[520px] w-auto rounded-lg border border-gray-200" />
            )}
            <div className="mt-4 grid grid-cols-1 gap-2 min-[480px]:grid-cols-2">
              {canShareFiles && (
                <button
                  type="button"
                  onClick={() => void shareResult()}
                  disabled={isSharing}
                  className="min-h-12 rounded-xl bg-[#25D366] px-4 text-sm font-black text-white transition hover:bg-[#1ebe5d] disabled:opacity-50"
                >
                  {isSharing ? "Membuka menu share…" : "📤 Bagikan ke WhatsApp / Status"}
                </button>
              )}
              <a
                href={result.url}
                download={result.file.name}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-black text-gray-800 transition hover:bg-gray-50"
              >
                ⬇️ Download {result.kind === "image" ? "Gambar" : "Video"}
              </a>
            </div>
            {!canShareFiles && (
              <p className="mt-2 text-xs text-gray-500">Share langsung cuma jalan di HP. Di laptop: download dulu, kirim ke HP, lalu unggah dari galeri.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
