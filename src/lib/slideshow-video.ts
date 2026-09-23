export type SlidePhoto = {
  url: string;
  title: string;
  subtitle?: string;
};

export type SlideshowProgress = { phase: "loading" | "rendering"; ratio: number };

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 1280;
const SLIDE_MS = 2800;
const TRANSITION_MS = 500;
const FPS = 30;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Salah satu foto gagal dimuat (cek koneksi internet)."));
    img.src = url;
  });
}

function pickSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return candidates.find((type) => MediaRecorder.isTypeSupported?.(type)) ?? "";
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
    ctx.font = "700 36px sans-serif";
    ctx.fillStyle = "#4ade80";
    ctx.fillText(subtitle, 40, CANVAS_HEIGHT - 60);
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
 * Renders `photos` into a vertical (9:16) crossfade slideshow video, entirely
 * client-side (no server, no AI API, no cost). Returns a downloadable Blob.
 * Throws with an admin-facing Indonesian message if the browser can't record
 * canvas video (older Safari especially).
 */
export async function generateSlideshowVideo(
  photos: SlidePhoto[],
  hook: string,
  ctaText: string,
  ctaUrl: string,
  onProgress?: (progress: SlideshowProgress) => void
): Promise<{ blob: Blob; mimeType: string }> {
  if (photos.length === 0) throw new Error("Pilih minimal 1 foto dulu.");

  const mimeType = pickSupportedMimeType();
  if (!mimeType) {
    throw new Error("Browser ini belum mendukung pembuatan video otomatis. Coba dari Chrome atau Edge terbaru (disarankan Android/desktop).");
  }

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
  if (typeof canvas.captureStream !== "function") {
    throw new Error("Browser ini belum mendukung perekaman video dari canvas. Coba dari Chrome atau Edge terbaru.");
  }

  const stream = canvas.captureStream(FPS);
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const totalDurationMs = photos.length * SLIDE_MS;
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
        renderFrame(ctx as CanvasRenderingContext2D, images, photos, photos.length - 1, 0, hook, ctaText, ctaUrl);
        onProgress?.({ phase: "rendering", ratio: 1 });
        resolve();
        return;
      }

      const slideIndex = Math.min(photos.length - 1, Math.floor(elapsed / SLIDE_MS));
      const withinSlide = elapsed - slideIndex * SLIDE_MS;
      const transitionStart = SLIDE_MS - TRANSITION_MS;
      const transitionProgress = withinSlide >= transitionStart ? (withinSlide - transitionStart) / TRANSITION_MS : 0;

      renderFrame(ctx as CanvasRenderingContext2D, images, photos, slideIndex, transitionProgress, hook, ctaText, ctaUrl);
      onProgress?.({ phase: "rendering", ratio: elapsed / totalDurationMs });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });

  recorder.stop();
  await recordingStopped;

  const blob = new Blob(chunks, { type: mimeType.split(";")[0] });
  return { blob, mimeType };
}
