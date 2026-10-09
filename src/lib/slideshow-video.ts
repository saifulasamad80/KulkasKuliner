import { renderBackgroundMusic, type MusicMood } from "@/lib/slideshow-music";

export type SlidePhoto = {
  url: string;
  title: string;
  subtitle?: string;
};

export type SlideshowProgress = { phase: "loading" | "music" | "rendering"; ratio: number };

export type SlideshowOptions = {
  /** Musik latar instrumental; `null` = tanpa musik. */
  music?: MusicMood | null;
};

export type SlideshowResult = {
  blob: Blob;
  mimeType: string;
  /** Codec video yang benar-benar dipakai, mis. "avc" (H.264) atau "vp9". */
  videoCodec: string;
  hasAudio: boolean;
  /** true kalau H.264 di MP4 standar -- format yang diterima Status WhatsApp. */
  whatsappReady: boolean;
  /** Pesan untuk admin kalau ada yang perlu diketahui (mis. musik gagal). */
  notes: string[];
};

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 1280;
const SLIDE_MS = 2800;
const TRANSITION_MS = 500;
const FPS = 30;

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Salah satu foto gagal dimuat (cek koneksi internet)."));
    img.src = url;
  });
}

// Cadangan untuk browser lama tanpa WebCodecs. Hasilnya MP4 "fragmented"/WebM
// yang sering ditolak WhatsApp, jadi cuma dipakai kalau terpaksa.
function pickLegacyMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
  return candidates.find((type) => MediaRecorder.isTypeSupported?.(type)) ?? "";
}

/** Ekstensi file sesuai format yang benar-benar dihasilkan. */
export function getVideoExtension(mimeType: string) {
  return mimeType.startsWith("video/mp4") ? "mp4" : "webm";
}

/** Posisi slide & progres crossfade pada waktu `elapsedMs`. */
function getSlideState(elapsedMs: number, count: number) {
  const slideIndex = Math.min(count - 1, Math.floor(elapsedMs / SLIDE_MS));
  const withinSlide = elapsedMs - slideIndex * SLIDE_MS;
  const transitionStart = SLIDE_MS - TRANSITION_MS;
  const transitionProgress = withinSlide >= transitionStart ? Math.min(1, (withinSlide - transitionStart) / TRANSITION_MS) : 0;
  return { slideIndex, transitionProgress };
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(" ");
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
  return lines;
}

function drawCoverImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, alpha: number) {
  const canvasRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
  const imgRatio = img.width / img.height;
  const drawWidth = imgRatio > canvasRatio ? CANVAS_HEIGHT * imgRatio : CANVAS_WIDTH;
  const drawHeight = imgRatio > canvasRatio ? CANVAS_HEIGHT : CANVAS_WIDTH / imgRatio;
  const dx = (CANVAS_WIDTH - drawWidth) / 2;
  const dy = (CANVAS_HEIGHT - drawHeight) / 2;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
  ctx.restore();
}

function drawTopBanner(ctx: CanvasRenderingContext2D, text: string) {
  ctx.font = "700 38px sans-serif";
  const boxX = 40;
  const boxWidth = CANVAS_WIDTH - 80;
  const lines = wrapText(ctx, text, boxWidth - 60).slice(0, 3);
  const lineHeight = 48;
  const paddingY = 28;
  const boxHeight = lines.length * lineHeight + paddingY * 2 - 10;
  const boxY = 60;
  const radius = 20;

  ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
  ctx.beginPath();
  ctx.moveTo(boxX + radius, boxY);
  ctx.arcTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + boxHeight, radius);
  ctx.arcTo(boxX + boxWidth, boxY + boxHeight, boxX, boxY + boxHeight, radius);
  ctx.arcTo(boxX, boxY + boxHeight, boxX, boxY, radius);
  ctx.arcTo(boxX, boxY, boxX + boxWidth, boxY, radius);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "alphabetic";
  lines.forEach((line, index) => ctx.fillText(line, boxX + 30, boxY + paddingY + 30 + index * lineHeight));
}

function drawBottomInfo(ctx: CanvasRenderingContext2D, title: string, subtitle?: string) {
  const gradientHeight = 360;
  const gradient = ctx.createLinearGradient(0, CANVAS_HEIGHT - gradientHeight, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.8)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, CANVAS_HEIGHT - gradientHeight, CANVAS_WIDTH, gradientHeight);

  ctx.textBaseline = "alphabetic";
  ctx.font = "800 50px sans-serif";
  ctx.fillStyle = "#ffffff";
  const titleLines = wrapText(ctx, title, CANVAS_WIDTH - 80).slice(0, 2);
  const lineHeight = 58;
  const y = CANVAS_HEIGHT - 90 - (subtitle ? 56 : 0) - (titleLines.length - 1) * lineHeight;
  titleLines.forEach((line, index) => ctx.fillText(line, 40, y + index * lineHeight));

  if (subtitle) {
    // Harga dibuat tebal & besar: ini info yang paling dicari pembeli.
    ctx.font = "900 46px sans-serif";
    ctx.fillStyle = "#4ade80";
    ctx.fillText(subtitle, 40, CANVAS_HEIGHT - 54);
  }
}

function drawWordmark(ctx: CanvasRenderingContext2D) {
  ctx.font = "800 30px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.textBaseline = "top";
  ctx.fillText("KULKASKULINER", 40, 24);
}

function renderFrame(
  ctx: CanvasRenderingContext2D,
  images: HTMLImageElement[],
  photos: SlidePhoto[],
  slideIndex: number,
  transitionProgress: number,
  hook: string,
  ctaText: string,
  ctaUrl: string
) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawCoverImage(ctx, images[slideIndex], 1);
  if (transitionProgress > 0 && slideIndex + 1 < images.length) {
    drawCoverImage(ctx, images[slideIndex + 1], transitionProgress);
  }

  drawWordmark(ctx);
  if (slideIndex === 0) drawTopBanner(ctx, hook);
  if (slideIndex === photos.length - 1) drawTopBanner(ctx, `${ctaText} ${ctaUrl}`);

  const photo = photos[slideIndex];
  drawBottomInfo(ctx, photo.title, photo.subtitle);
}

/**
 * Pastikan encoder AAC tersedia. Kalau browser nggak punya AAC bawaan, muat
 * encoder AAC berbasis WASM (dimuat hanya saat dibutuhkan, ±1 MB).
 */
let aacEncoderRegistered = false;

async function hasNativeAacEncoder() {
  if (typeof AudioEncoder === "undefined") return false;
  try {
    const support = await AudioEncoder.isConfigSupported({
      codec: "mp4a.40.2",
      sampleRate: 44100,
      numberOfChannels: 2,
      bitrate: 192_000,
    });
    return support.supported === true;
  } catch {
    return false;
  }
}

async function ensureAacEncoder(mb: typeof import("mediabunny")) {
  // Cek native langsung, JANGAN lewat mb.canEncodeAudio dulu: hasilnya di-memo,
  // jadi "false" sebelum register WASM bakal nyangkut terus walau encoder WASM
  // sudah terdaftar.
  if (await hasNativeAacEncoder()) return true;
  if (!aacEncoderRegistered) {
    try {
      const { registerAacEncoder } = await import("@mediabunny/aac-encoder");
      registerAacEncoder();
      aacEncoderRegistered = true;
    } catch {
      return false;
    }
  }
  return mb.canEncodeAudio("aac", { numberOfChannels: 2, sampleRate: 44100, quality: mb.QUALITY_HIGH });
}

/**
 * Bikin video slideshow 9:16 (crossfade + teks) di browser, tanpa server.
 *
 * Mesin utama: WebCodecs + muxer MP4 (mediabunny). Frame dirender satu per satu
 * (bukan merekam layar), hasilnya MP4 standar non-fragmented dengan frame rate
 * tetap -- H.264 + AAC kalau browser mampu, format yang diterima Status WhatsApp.
 * Browser tanpa WebCodecs jatuh ke MediaRecorder lama (tanpa musik).
 */
export async function generateSlideshowVideo(
  photos: SlidePhoto[],
  hook: string,
  ctaText: string,
  ctaUrl: string,
  onProgress?: (progress: SlideshowProgress) => void,
  options: SlideshowOptions = {}
): Promise<SlideshowResult> {
  if (photos.length === 0) throw new Error("Pilih minimal 1 foto dulu.");

  onProgress?.({ phase: "loading", ratio: 0 });
  const images: HTMLImageElement[] = [];
  for (let i = 0; i < photos.length; i += 1) {
    images.push(await loadImage(photos[i].url));
    onProgress?.({ phase: "loading", ratio: (i + 1) / photos.length });
  }

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nggak didukung di browser ini.");

  const totalDurationMs = photos.length * SLIDE_MS;
  const draw = (elapsedMs: number) => {
    const { slideIndex, transitionProgress } = getSlideState(elapsedMs, photos.length);
    renderFrame(ctx, images, photos, slideIndex, transitionProgress, hook, ctaText, ctaUrl);
  };

  // Cukup VideoEncoder. AudioEncoder nggak wajib: AAC bisa lewat encoder WASM
  // (Safari iPhone lama punya VideoEncoder tapi belum punya AudioEncoder).
  const hasWebCodecs = typeof VideoEncoder !== "undefined";
  if (hasWebCodecs) {
    const mb = await import("mediabunny");
    const videoCodec = await mb.getFirstEncodableVideoCodec(["avc", "vp9", "av1"], {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      frameRate: FPS,
    });
    if (videoCodec) {
      return encodeWithWebCodecs(mb, videoCodec, canvas, draw, totalDurationMs, onProgress, options);
    }
  }

  return recordWithMediaRecorder(canvas, draw, totalDurationMs, onProgress, options);
}

async function encodeWithWebCodecs(
  mb: typeof import("mediabunny"),
  videoCodec: import("mediabunny").VideoCodec,
  canvas: HTMLCanvasElement,
  draw: (elapsedMs: number) => void,
  totalDurationMs: number,
  onProgress: ((progress: SlideshowProgress) => void) | undefined,
  options: SlideshowOptions
): Promise<SlideshowResult> {
  const notes: string[] = [];
  const durationSec = totalDurationMs / 1000;

  // Musik dirender dulu (cepat, ±1 detik) supaya video & audio ditulis sekali jalan.
  let music: AudioBuffer | null = null;
  if (options.music) {
    onProgress?.({ phase: "music", ratio: 0 });
    try {
      if (await ensureAacEncoder(mb)) {
        music = await renderBackgroundMusic(options.music, durationSec);
      } else {
        notes.push("Browser ini nggak bisa menyimpan audio AAC, jadi video dibuat tanpa musik.");
      }
    } catch {
      notes.push("Musik latar gagal dibuat, jadi video dibuat tanpa musik.");
    }
    onProgress?.({ phase: "music", ratio: 1 });
  }

  const output = new mb.Output({
    // Metadata di depan file ("fast start"), bukan fragmented -- format MP4 biasa.
    format: new mb.Mp4OutputFormat({ fastStart: "in-memory" }),
    target: new mb.BufferTarget(),
  });

  const videoSource = new mb.CanvasSource(canvas, {
    codec: videoCodec,
    quality: mb.QUALITY_HIGH,
    keyFrameInterval: 2,
  });
  output.addVideoTrack(videoSource, { frameRate: FPS });

  let audioSource: InstanceType<typeof mb.AudioBufferSource> | null = null;
  if (music) {
    audioSource = new mb.AudioBufferSource({ codec: "aac", quality: mb.QUALITY_HIGH });
    output.addAudioTrack(audioSource);
  }

  try {
    await output.start();
    if (audioSource && music) await audioSource.add(music);

    const totalFrames = Math.round((totalDurationMs / 1000) * FPS);
    for (let frame = 0; frame < totalFrames; frame += 1) {
      const timestamp = frame / FPS;
      draw(timestamp * 1000);
      await videoSource.add(timestamp, 1 / FPS);
      if (frame % 10 === 0) onProgress?.({ phase: "rendering", ratio: frame / totalFrames });
    }

    await output.finalize();
  } catch (error) {
    await output.cancel().catch(() => undefined);
    throw new Error(`Video gagal dibuat: ${error instanceof Error ? error.message : "kesalahan encoder"}. Coba lagi, atau pakai Chrome terbaru.`);
  }
  onProgress?.({ phase: "rendering", ratio: 1 });

  const buffer = output.target.buffer;
  if (!buffer) throw new Error("Video gagal disimpan. Coba lagi.");
  const mimeType = await output.getMimeType();
  const whatsappReady = videoCodec === "avc";
  if (!whatsappReady) {
    notes.push("Browser ini nggak bisa bikin video H.264, jadi pakai codec lain — WhatsApp kemungkinan menolak. Bikin ulang dari Chrome terbaru di HP Android/iPhone.");
  }

  return {
    blob: new Blob([buffer], { type: "video/mp4" }),
    mimeType,
    videoCodec,
    hasAudio: Boolean(music),
    whatsappReady,
    notes,
  };
}

/** Jalur lama (browser tanpa WebCodecs): rekam canvas real-time, tanpa musik. */
async function recordWithMediaRecorder(
  canvas: HTMLCanvasElement,
  draw: (elapsedMs: number) => void,
  totalDurationMs: number,
  onProgress: ((progress: SlideshowProgress) => void) | undefined,
  options: SlideshowOptions
): Promise<SlideshowResult> {
  const mimeType = pickLegacyMimeType();
  if (!mimeType || typeof canvas.captureStream !== "function") {
    throw new Error("Browser ini belum mendukung pembuatan video. Pakai Chrome terbaru di HP Android, atau Safari di iPhone (iOS 16.4 ke atas).");
  }

  const stream = canvas.captureStream(FPS);
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  const recordingStopped = new Promise<void>((resolve, reject) => {
    recorder.onstop = () => resolve();
    recorder.onerror = () => reject(new Error("Perekaman video gagal di tengah jalan. Coba lagi."));
  });

  recorder.start();
  const startTime = performance.now();
  await new Promise<void>((resolve) => {
    function tick() {
      const elapsed = performance.now() - startTime;
      if (elapsed >= totalDurationMs) {
        draw(totalDurationMs - 1);
        onProgress?.({ phase: "rendering", ratio: 1 });
        resolve();
        return;
      }
      draw(elapsed);
      onProgress?.({ phase: "rendering", ratio: elapsed / totalDurationMs });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
  recorder.stop();
  await recordingStopped;

  const notes = ["Browser ini versi lama, jadi video dibuat dengan cara lama — WhatsApp kemungkinan menolak. Pakai Chrome terbaru di HP."];
  if (options.music) notes.push("Musik latar nggak didukung di browser ini.");
  return {
    blob: new Blob(chunks, { type: mimeType.split(";")[0] }),
    mimeType,
    videoCodec: mimeType.includes("avc") ? "avc" : mimeType.includes("vp9") ? "vp9" : mimeType.startsWith("video/webm") ? "WebM" : "MP4 lama",
    hasAudio: false,
    whatsappReady: false,
    notes,
  };
}
