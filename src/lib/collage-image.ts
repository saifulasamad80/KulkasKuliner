import { loadImage } from "@/lib/slideshow-video";

export type CollagePhoto = {
  url: string;
  title: string;
  price: number;
};

/**
 * "label": 2 kolom, foto besar + label nama putih (gaya status reseller).
 * "katalog": 3 kolom, badge harga kuning + bar nama (gaya daftar harga).
 */
export type CollageStyle = "label" | "katalog";

export const COLLAGE_MAX_PHOTOS: Record<CollageStyle, number> = { label: 6, katalog: 9 };

const WIDTH = 1080;
const BRAND = "KULKASKULINER";

function formatRupiah(value: number) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(attempt).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
  kept[maxLines - 1] = `${last.trimEnd()}…`;
  return kept;
}

/** Foto dipotong rapi memenuhi kotak (object-fit: cover), sudut membulat. */
function drawPhotoCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, x: number, y: number, w: number, h: number, radius: number) {
  ctx.save();
  roundedRectPath(ctx, x, y, w, h, radius);
  ctx.clip();
  if (img && img.width > 0 && img.height > 0) {
    const scale = Math.max(w / img.width, h / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    ctx.drawImage(img, x + (w - drawW) / 2, y + (h - drawH) / 2, drawW, drawH);
  } else {
    // Foto gagal dimuat: kotak abu-abu, tile tetap ada supaya tata letak nggak berantakan.
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

function drawLabelTile(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, photo: CollagePhoto, x: number, y: number, w: number, h: number) {
  drawPhotoCover(ctx, img, x, y, w, h, 18);

  ctx.font = "800 46px sans-serif";
  const lines = wrapLines(ctx, photo.title, w - 90, 2);
  const lineHeight = 54;
  const boxW = Math.min(w - 40, Math.max(...lines.map((line) => ctx.measureText(line).width)) + 52);
  const boxH = lines.length * lineHeight + 26;
  const boxX = x + (w - boxW) / 2;
  const boxY = y + h - boxH - 28;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#ffffff";
  roundedRectPath(ctx, boxX, boxY, boxW, boxH, 22);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#0f172a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((line, index) => ctx.fillText(line, x + w / 2, boxY + 13 + lineHeight / 2 + index * lineHeight));
}

function drawKatalogTile(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, photo: CollagePhoto, x: number, y: number, w: number, photoH: number, barH: number) {
  drawPhotoCover(ctx, img, x, y, w, photoH, 0);

  // Badge harga kuning di pojok kanan atas.
  ctx.font = "900 30px sans-serif";
  const priceText = formatRupiah(photo.price);
  const badgeW = ctx.measureText(priceText).width + 24;
  const badgeH = 46;
  ctx.fillStyle = "#facc15";
  roundedRectPath(ctx, x + w - badgeW - 8, y + 8, badgeW, badgeH, 8);
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(priceText, x + w - 8 - badgeW / 2, y + 8 + badgeH / 2 + 1);

  // Bar nama hitam di bawah foto.
  ctx.fillStyle = "#111827";
  ctx.fillRect(x, y + photoH, w, barH);
  ctx.font = "800 28px sans-serif";
  const lines = wrapLines(ctx, photo.title, w - 24, 2);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  const lineHeight = 32;
  const startY = y + photoH + (barH - lines.length * lineHeight) / 2 + lineHeight / 2;
  lines.forEach((line, index) => ctx.fillText(line, x + 12, startY + index * lineHeight));
}

function drawHeader(ctx: CanvasRenderingContext2D, height: number, subtitle: string, dark: boolean) {
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(0, 0, WIDTH, height);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 58px sans-serif";
  ctx.fillText(BRAND, WIDTH / 2, height * 0.4);
  ctx.font = "700 32px sans-serif";
  ctx.fillStyle = dark ? "#fee2e2" : "#fff1f2";
  ctx.fillText(subtitle, WIDTH / 2, height * 0.76);
}

function drawFooter(ctx: CanvasRenderingContext2D, y: number, height: number, footerText: string, dark: boolean) {
  ctx.fillStyle = dark ? "#111827" : "#f1f5f9";
  ctx.fillRect(0, y, WIDTH, height);
  ctx.fillStyle = dark ? "#ffffff" : "#0f172a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "800 36px sans-serif";
  const lines = wrapLines(ctx, footerText, WIDTH - 80, 2);
  const lineHeight = 44;
  const startY = y + (height - lines.length * lineHeight) / 2 + lineHeight / 2;
  lines.forEach((line, index) => ctx.fillText(line, WIDTH / 2, startY + index * lineHeight));
}

/**
 * Bikin 1 gambar kolase (JPEG) dari foto produk, sepenuhnya di browser.
 * Foto yang gagal dimuat diganti kotak abu-abu (bukan menggagalkan semuanya);
 * jumlahnya dikembalikan di `failedCount` supaya admin tahu.
 */
export async function renderCollage(
  photos: CollagePhoto[],
  style: CollageStyle,
  footerText: string
): Promise<{ blob: Blob; failedCount: number }> {
  if (photos.length === 0) throw new Error("Pilih minimal 1 foto dulu.");
  const selected = photos.slice(0, COLLAGE_MAX_PHOTOS[style]);

  const loaded = await Promise.allSettled(selected.map((photo) => loadImage(photo.url)));
  const images = loaded.map((result) => (result.status === "fulfilled" ? result.value : null));
  const failedCount = images.filter((img) => img === null).length;
  if (failedCount === selected.length) {
    throw new Error("Semua foto gagal dimuat. Cek koneksi internet, atau fotonya berasal dari situs yang memblokir dipakai di gambar lain.");
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Browser ini nggak mendukung pembuatan gambar.");

  const headerH = 170;
  const footerH = 130;

  if (style === "label") {
    // 9:16 penuh, pas untuk Status WhatsApp.
    const height = 1920;
    canvas.width = WIDTH;
    canvas.height = height;
    ctx.fillStyle = "#0b0b0b";
    ctx.fillRect(0, 0, WIDTH, height);
    drawHeader(ctx, headerH, "Frozen food siap kirim", true);

    const pad = 24;
    const gap = 14;
    const cols = 2;
    const rows = Math.ceil(selected.length / cols);
    const areaTop = headerH + pad;
    const areaH = height - headerH - footerH - pad * 2;
    const tileW = (WIDTH - pad * 2 - gap) / cols;
    const tileH = (areaH - gap * (rows - 1)) / rows;

    selected.forEach((photo, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const isLoneLast = index === selected.length - 1 && selected.length % cols === 1;
      const x = isLoneLast ? pad : pad + col * (tileW + gap);
      const w = isLoneLast ? WIDTH - pad * 2 : tileW;
      drawLabelTile(ctx, images[index], photo, x, areaTop + row * (tileH + gap), w, tileH);
    });

    drawFooter(ctx, height - footerH, footerH, footerText, true);
  } else {
    const pad = 18;
    const gap = 12;
    const cols = 3;
    const rows = Math.ceil(selected.length / cols);
    const tileW = (WIDTH - pad * 2 - gap * (cols - 1)) / cols;
    const photoH = tileW;
    const barH = 80;
    const tileH = photoH + barH;
    const height = Math.round(headerH + pad + rows * tileH + (rows - 1) * gap + pad + footerH);

    canvas.width = WIDTH;
    canvas.height = height;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, WIDTH, height);
    drawHeader(ctx, headerH, "Daftar harga hari ini", false);

    selected.forEach((photo, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      drawKatalogTile(ctx, images[index], photo, pad + col * (tileW + gap), headerH + pad + row * (tileH + gap), tileW, photoH, barH);
    });

    drawFooter(ctx, height - footerH, footerH, footerText, false);
  }

  // toBlob melempar SecurityError kalau ada foto dari sumber yang nggak
  // mengizinkan dipakai di canvas (CORS); null kalau encoding gagal.
  const blockedMessage = "Gambar gagal dibuat. Kemungkinan ada foto dari sumber yang memblokir — ganti fotonya lalu coba lagi.";
  let blob: Blob | null = null;
  try {
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  } catch {
    throw new Error(blockedMessage);
  }
  if (!blob) throw new Error(blockedMessage);
  return { blob, failedCount };
}
