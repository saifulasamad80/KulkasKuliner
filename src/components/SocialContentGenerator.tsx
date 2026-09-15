"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import {
  getAvailableProducts,
  getCatalogUrl,
  getJakartaTimeContext,
  getProductLabel,
  getTimeGreeting as getGreeting,
  selectRotatingProducts,
  type TimeContext,
} from "@/lib/marketing";

type SocialContentGeneratorProps = { products: Product[] };
type ContentMode = "carousel" | "video";
type AudienceMoment = { mindset: string; hook: string; urgency: string; cta: string };

function getAudienceMoment(hour: number, dayName: string): AudienceMoment {
  if (hour >= 4 && hour < 11) {
    return {
      mindset: "Audiens sedang menyiapkan ritme hari sebelum aktivitas makin padat.",
      hook: `Sebelum ${dayName} makin padat, sudah siapin stok makan praktis?`,
      urgency: "Ambil keputusan dari sekarang—nanti saat mulai lapar, tinggal masak tanpa perlu keluar cari makan.",
      cta: "Cek katalog dan amankan menu untuk menemani aktivitas hari ini.",
    };
  }
  if (hour >= 11 && hour < 15) {
    return {
      mindset: "Audiens sedang membagi energi dan fokus di tengah aktivitas atau jam istirahat.",
      hook: "Energi dan fokus lagi kebagi, tapi tetap mau makan enak tanpa ribet?",
      urgency: "Saat waktu istirahat pendek, keputusan makan yang sudah disiapkan bikin kepala nggak perlu mikir panjang.",
      cta: "Pilih menu sekarang, biar urusan makan hari ini langsung beres.",
    };
  }
  if (hour >= 15 && hour < 19) {
    return {
      mindset: "Audiens mulai mengalami energy dip dan butuh pilihan yang terasa mudah untuk malam hari.",
      hook: "Energi mulai turun? Jangan sampai makan malam berujung pilih makanan seadanya.",
      urgency: "Siapkan menu malam sebelum rasa lapar bikin keputusan jadi terburu-buru dan pilihan favorit keburu terlewat.",
      cta: "Lihat stok yang tersedia dan siapkan menu malam dari sekarang.",
    };
  }
  return {
    mindset: "Audiens sedang punya kesempatan menyiapkan kebutuhan besok sebelum waktu dan energi kembali terbatas.",
    hook: "Besok mau lebih siap tanpa drama soal makan?",
    urgency: "Siapkan stok malam ini—besok tinggal ambil dari freezer saat waktu dan energi lagi terbatas.",
    cta: "Pilih stok untuk besok sekarang, supaya pagi nggak dimulai dengan keputusan yang ribet.",
  };
}

function selectProducts(products: Product[], generation: number, onlyWithImages = false) {
  const availableProducts = getAvailableProducts(products);
  const candidates = onlyWithImages
    ? availableProducts.filter((product) => Boolean(product.image_url?.trim()))
    : availableProducts;
  const now = new Date();
  const rotationSeed = now.getMinutes() + now.getHours() + generation * 3;

  return selectRotatingProducts(candidates, rotationSeed);
}

function getStockFomo(products: Product[]) {
  const lowStockProducts = getAvailableProducts(products).filter((product) => product.stock <= 5);
  return lowStockProducts.length > 0
    ? `⚡ Stok menipis: ${lowStockProducts.slice(0, 2).map(getProductLabel).join(" dan ")}. Kalau memang cocok, lebih aman diamankan sekarang sebelum pilihan ini habis.`
    : "Jangan ditunda sampai lapar datang dan pilihan makan jadi terburu-buru—cek menu yang masih tersedia sekarang.";
}

function createCommonCopy(context: TimeContext, audienceMoment: AudienceMoment, productNames: string, stockFomo: string, catalogUrl: string) {
  const greeting = getGreeting(context.hour);
  const caption = `🍽️ ${greeting}!\n\n${audienceMoment.hook}\n\n${audienceMoment.urgency}\n\nFrozen food premium buat stok dapur, bekal keluarga, atau makan praktis tanpa bikin fokus hari ini buyar.\n\n${stockFomo}\n\n${audienceMoment.cta}\n${catalogUrl}`;
  const story = `${audienceMoment.hook}\n\n${productNames}\n\n${stockFomo}\n\nCek katalog → link di bio\n${catalogUrl}`;
  return { caption, story };
}

function createSocialContent(products: Product[], generation: number, mode: ContentMode) {
  const now = new Date();
  const context = getJakartaTimeContext(now);
  const availableProducts = getAvailableProducts(products);
  const audienceMoment = getAudienceMoment(context.hour, context.dayName);
  const selectedProducts = selectProducts(products, generation, mode === "carousel");
  const fallbackProducts = selectedProducts.length > 0 ? selectedProducts : selectProducts(products, generation);
  const productNames = fallbackProducts.length > 0 ? fallbackProducts.map(getProductLabel).join(" dan ") : "menu frozen food yang tersedia";
  const stockFomo = getStockFomo(products);
  const catalogUrl = getCatalogUrl();
  const { caption, story } = createCommonCopy(context, audienceMoment, productNames, stockFomo, catalogUrl);

  if (mode === "carousel") {
    const photoStatus = selectedProducts.length > 0
      ? "Pakai foto produk dari preview di samping. Susun semua slide dalam rasio 4:5 agar area feed lebih besar."
      : "Belum ada produk aktif yang punya foto. Isi URL foto di Inventori dulu, lalu buat konten lagi.";
    return [
      "=== KONTEN FOTO CAROUSEL INSTAGRAM ===", "",
      `Konteks: ${getGreeting(context.hour)}, ${context.dayName} — ${audienceMoment.mindset}`,
      `Produk utama: ${productNames}`, "Format: Carousel foto 4:5 | 5 slide", "",
      "SLIDE 1 — HOOK", audienceMoment.hook,
      "Visual: foto produk paling menggugah atau foto freezer yang rapi. Teks harus besar dan terbaca.", "",
      "SLIDE 2 — PRODUK", `Kenalan sama ${productNames}.`,
      "Visual: foto produk dari katalog, crop dekat, pencahayaan terang, tanpa watermark toko lain.", "",
      "SLIDE 3 — MANFAAT PRAKTIS",
      "Stok di freezer, tinggal masak saat butuh. Cocok buat bekal, makan keluarga, atau penyelamat saat jadwal lagi padat.",
      "Visual: foto produk atau hasil masakan yang sudah disajikan.", "",
      "SLIDE 4 — URGENCY FAKTUAL", stockFomo,
      "Visual: detail kemasan atau freezer. Jangan menambahkan angka stok kalau belum dicek ulang.", "",
      "SLIDE 5 — CTA", audienceMoment.cta, `Cek katalog: ${catalogUrl}`,
      "Visual: foto produk + logo/nama KulkasKuliner.", "",
      "CAPTION INSTAGRAM", caption, "", "VERSI INSTAGRAM STORY", story, "",
      "HASHTAG", "#FrozenFood #MakananPraktis #KulkasKuliner #FrozenFoodJakarta #JakartaTimur #IdeMakan", "",
      "CATATAN PRODUKSI", photoStatus,
      "Upload carousel secara manual ke Instagram. Generator nggak login atau posting otomatis.",
    ].join("\n");
  }

  return [
    "=== KONTEN VIDEO TIKTOK + INSTAGRAM REELS ===", "",
    `Konteks: ${getGreeting(context.hour)}, ${context.dayName} — ${audienceMoment.mindset}`,
    `Produk utama: ${productNames}`, "Format: Video vertikal 9:16 | Durasi: 15–25 detik", "",
    "HOOK (0–3 detik)", audienceMoment.hook, "", "URUTAN SCENE",
    `1. Hook: tampilkan freezer atau close-up ${productNames} dengan teks besar yang mudah dibaca.`,
    "2. Tunjukkan produk dan proses masak singkat—potong cepat, jangan pakai intro panjang.",
    "3. Tampilkan hasil makanan yang sudah siap disantap dengan angle dekat dan terang.",
    `4. Tutup dengan produk, CTA, dan teks: \"Cek katalog KulkasKuliner sekarang.\"`, "",
    "VOICE-OVER", `${audienceMoment.hook} ${audienceMoment.urgency} Frozen food premium KulkasKuliner siap jadi stok praktis kapan aja. ${audienceMoment.cta}`, "",
    "TEKS OVERLAY", `• ${audienceMoment.hook}`, "• Praktis buat ritme harian", `• ${stockFomo}`, "• Cek katalog sekarang", "",
    "CAPTION INSTAGRAM / TIKTOK", caption, "", "VERSI INSTAGRAM STORY", story, "",
    "HASHTAG", "#FrozenFood #MakananPraktis #KulkasKuliner #FrozenFoodJakarta #JakartaTimur #IdeMakan", "",
    "CATATAN PRODUKSI",
    availableProducts.length > 0 ? "Buat video vertikal original tanpa watermark, lalu upload manual ke TikTok dan Instagram Reels." : "Belum ada produk aktif dengan stok. Isi stok produk dulu sebelum membuat materi promosi.",
  ].join("\n");
}

function getPlatformUrl(platform: "instagram" | "tiktok") {
  return platform === "instagram" ? "https://www.instagram.com/" : "https://www.tiktok.com/";
}

function getInstagramCaption(content: string) {
  const startMarker = "CAPTION INSTAGRAM\n";
  const endMarker = "\n\nVERSI INSTAGRAM STORY";
  const start = content.indexOf(startMarker);
  if (start === -1) return content;

  const captionStart = start + startMarker.length;
  const end = content.indexOf(endMarker, captionStart);
  return content.slice(captionStart, end === -1 ? undefined : end).trim();
}

function getFileExtension(contentType: string | null, imageUrl: string) {
  const extensionFromType = contentType?.split("/")[1]?.split(";")[0];
  if (extensionFromType && ["jpeg", "jpg", "png", "webp", "gif"].includes(extensionFromType)) {
    return extensionFromType === "jpeg" ? "jpg" : extensionFromType;
  }

  const extensionFromUrl = imageUrl.split("?")[0].split(".").pop()?.toLowerCase();
  return extensionFromUrl && ["jpeg", "jpg", "png", "webp", "gif"].includes(extensionFromUrl)
    ? extensionFromUrl
    : "jpg";
}

export default function SocialContentGenerator({ products }: SocialContentGeneratorProps) {
  const [generation, setGeneration] = useState(0);
  const [mode, setMode] = useState<ContentMode>("carousel");
  const [generatedMode, setGeneratedMode] = useState<ContentMode | null>(null);
  const [content, setContent] = useState("");
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const availableProducts = getAvailableProducts(products);
  const availableCount = availableProducts.length;
  const productsWithImagesCount = availableProducts.filter((product) => Boolean(product.image_url?.trim())).length;
  const lowStockCount = availableProducts.filter((product) => product.stock <= 5).length;

  const generateContent = () => {
    const nextGeneration = generation + 1;
    setGeneration(nextGeneration);
    setGeneratedMode(mode);
    setContent(createSocialContent(products, nextGeneration, mode));
    setPreviewProducts(selectProducts(products, nextGeneration, mode === "carousel"));
    setCopied(false);
  };

  const copyContent = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_500);
    } catch {
      alert("Copy otomatis ditolak browser. Blok teks kontennya lalu copy manual, ya.");
    }
  };

  const getCarouselFiles = async () => {
    const productsWithImages = previewProducts.filter((product) => Boolean(product.image_url?.trim()));
    if (productsWithImages.length === 0) {
      throw new Error("Belum ada foto produk untuk dibagikan.");
    }

    return Promise.all(productsWithImages.map(async (product, index) => {
      const imageUrl = product.image_url as string;
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Foto slide ${index + 1} gagal diambil.`);

      const blob = await response.blob();
      const extension = getFileExtension(blob.type, imageUrl);
      return new File([blob], `kulkaskuliner-slide-${index + 1}.${extension}`, { type: blob.type || `image/${extension}` });
    }));
  };

  const shareCarousel = async () => {
    if (!content || generatedMode !== "carousel") return;
    setIsSharing(true);

    try {
      const files = await getCarouselFiles();
      const shareData = {
        title: "Carousel KulkasKuliner",
        text: getInstagramCaption(content),
        files,
      };

      if (!navigator.share || !navigator.canShare?.({ files })) {
        throw new Error("Browser ini belum mendukung share beberapa foto sekaligus. Pakai tombol download sebagai gantinya.");
      }

      await navigator.share(shareData);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      alert(error instanceof Error ? error.message : "Foto belum bisa dibagikan. Download foto satu per satu sebagai fallback.");
    } finally {
      setIsSharing(false);
    }
  };

  const downloadCarouselImages = async () => {
    if (generatedMode !== "carousel") return;
    setIsSharing(true);

    try {
      try {
        const files = await getCarouselFiles();
        files.forEach((file) => {
          const url = URL.createObjectURL(file);
          const link = document.createElement("a");
          link.href = url;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
        });
      } catch {
        const productsWithImages = previewProducts.filter((product) => Boolean(product.image_url?.trim()));
        productsWithImages.forEach((product, index) => {
          const link = document.createElement("a");
          link.href = product.image_url as string;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.download = `kulkaskuliner-slide-${index + 1}`;
          document.body.appendChild(link);
          link.click();
          link.remove();
        });
        alert("Browser memblokir download otomatis dari sumber foto. Tab foto sudah dibuka—simpan fotonya manual, lalu upload ke Instagram.");
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Foto belum bisa di-download.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-purple-200 bg-linear-to-br from-purple-50 via-white to-pink-50 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-purple-100 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-purple-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">Instagram + TikTok</span>
            <span className="text-xs font-semibold text-purple-700">Nggak wajib bikin video</span>
          </div>
          <h3 className="text-xl font-black text-gray-900 sm:text-2xl">Generator Instagram</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">Pilih carousel foto kalau belum punya video. Generator tetap bikin hook, caption, Story, CTA, dan FOMO berdasarkan jam Jakarta serta stok nyata.</p>
        </div>
        <button type="button" onClick={generateContent} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400"><span className="text-lg leading-none">✦</span>Buat Konten Baru</button>
      </div>

      <div className="border-b border-purple-100 px-5 pt-5 sm:px-6">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Pilih format konten">
          <button type="button" onClick={() => setMode("carousel")} className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${mode === "carousel" ? "bg-purple-600 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"}`}>📸 Foto Carousel (rekomendasi)</button>
          <button type="button" onClick={() => setMode("video")} className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${mode === "video" ? "bg-purple-600 text-white" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"}`}>🎬 Script Video</button>
        </div>
        <p className="pb-5 pt-2 text-xs text-gray-500">{mode === "carousel" ? "Pakai foto produk di katalog—susun 5 slide, lalu upload sebagai carousel Instagram." : "Kalau nanti sudah siap rekam, satu video 9:16 bisa dipakai di TikTok dan Instagram Reels."}</p>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <label htmlFor="social-content-copy" className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-600">{generatedMode === "carousel" ? "Paket carousel — bebas diedit" : "Paket konten — bebas diedit"}</label>
          <textarea id="social-content-copy" value={content} onChange={(event) => setContent(event.target.value)} rows={generatedMode === "carousel" ? 28 : 24} disabled={!content} className="w-full resize-y rounded-xl border border-gray-300 bg-white p-4 text-sm leading-6 text-gray-800 shadow-inner outline-none transition-shadow focus:border-purple-500 focus:ring-2 focus:ring-purple-200 disabled:cursor-wait disabled:bg-gray-50" aria-label="Preview paket konten sosial" />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => void copyContent()} disabled={!content} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">{copied ? "✓ Tersalin" : "Salin Paket Konten"}</button>
            {generatedMode === "carousel" && <>
              <button type="button" onClick={() => void shareCarousel()} disabled={!content || isSharing} className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300">{isSharing ? "Menyiapkan foto…" : "Bagikan Foto + Caption"}</button>
              <button type="button" onClick={() => void downloadCarouselImages()} disabled={!content || isSharing} className="rounded-lg border border-pink-200 bg-pink-50 px-4 py-2 text-sm font-bold text-pink-700 transition-colors hover:bg-pink-100 disabled:cursor-not-allowed disabled:opacity-50">Download Foto Carousel</button>
            </>}
            <a href={content ? getPlatformUrl("instagram") : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!content} className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors ${content ? "bg-pink-600 hover:bg-pink-700" : "pointer-events-none bg-gray-300"}`}>Buka Instagram →</a>
            <a href={content ? getPlatformUrl("tiktok") : undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!content} className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-bold text-white transition-colors ${content ? "bg-gray-900 hover:bg-black" : "pointer-events-none bg-gray-300"}`}>Buka TikTok →</a>
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-purple-100 bg-white/80 p-4">
          {generatedMode === "carousel" && <div className="mb-5"><p className="mb-3 text-xs font-black uppercase tracking-wider text-purple-800">Preview foto katalog</p>{previewProducts.length > 0 ? <div className="grid grid-cols-3 gap-2">{previewProducts.map((product) => <div key={product.id} className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">{product.image_url ? <img src={product.image_url} alt={getProductLabel(product)} className="aspect-square w-full object-cover" /> : <div className="flex aspect-square items-center justify-center p-2 text-center text-[10px] font-bold text-gray-400">Belum ada foto</div>}<p className="truncate px-1.5 py-1 text-[10px] font-bold text-gray-700">{getProductLabel(product)}</p></div>)}</div> : <div className="rounded-lg border border-dashed border-orange-300 bg-orange-50 p-3 text-xs leading-5 text-orange-800">Produk aktif belum punya foto. Isi URL foto di bagian Inventori agar carousel bisa langsung dipakai.</div>}</div>}
          <p className="mb-3 text-xs font-black uppercase tracking-wider text-purple-800">Data yang dipakai</p>
          <dl className="space-y-3 text-sm"><div className="flex items-center justify-between gap-3"><dt className="text-gray-500">Produk aktif &amp; ada stok</dt><dd className="font-black text-gray-900">{availableCount}</dd></div><div className="flex items-center justify-between gap-3"><dt className="text-gray-500">Produk aktif + foto</dt><dd className="font-black text-gray-900">{productsWithImagesCount}</dd></div><div className="flex items-center justify-between gap-3"><dt className="text-gray-500">Stok menipis (≤ 5)</dt><dd className={`font-black ${lowStockCount > 0 ? "text-orange-600" : "text-gray-900"}`}>{lowStockCount}</dd></div></dl>
          <p className="mt-4 border-t border-gray-100 pt-3 text-xs leading-5 text-gray-500">{mode === "carousel" ? "Di HP yang mendukung Web Share, Bagikan Foto + Caption bisa membuka share sheet dengan beberapa foto sekaligus. Kalau nggak didukung, download foto lalu upload manual ke Instagram." : "Kalau bikin video nanti, pakai footage original tanpa watermark lalu upload manual ke TikTok dan Instagram Reels."}</p>
        </aside>
      </div>
    </section>
  );
}