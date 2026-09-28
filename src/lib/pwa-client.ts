import type { DisplayMode } from '@/lib/pwa-analytics';

const VISITOR_ID_KEY = 'kk_vid';
const INTERNAL_KEY = 'kk_internal';
const LAST_TRACK_KEY = 'kk_track_last';

// Cadangan kalau localStorage diblokir (mis. mode privat): ID tetap konsisten
// selama halaman terbuka, tapi tidak bertahan setelah ditutup.
let memoryVisitorId: string | null = null;

function safeStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function randomId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** PWA = halaman berjalan sebagai aplikasi terpasang (standalone), bukan tab browser biasa. */
export function getDisplayMode(): DisplayMode {
  if (typeof window === 'undefined') return 'browser';
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: minimal-ui)').matches ||
    // iOS Safari (aplikasi dari "Tambah ke Layar Utama") tidak mendukung display-mode
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone ? 'pwa' : 'browser';
}

/** ID acak per perangkat. Bukan data pribadi, tidak bisa dilacak balik ke orang. */
export function getVisitorId(): string {
  const storage = safeStorage();
  try {
    const existing = storage?.getItem(VISITOR_ID_KEY);
    if (existing && /^[A-Za-z0-9_-]{8,64}$/.test(existing)) return existing;
  } catch {
    // lanjut buat ID baru
  }

  const created = memoryVisitorId ?? randomId();
  memoryVisitorId = created;
  try {
    storage?.setItem(VISITOR_ID_KEY, created);
  } catch {
    // storage penuh/diblokir: pakai ID di memori saja
  }
  return created;
}

/**
 * Perangkat yang pernah membuka /admin ditandai sebagai internal supaya
 * pemakaian admin sendiri (termasuk lewat shortcut PWA admin) tidak
 * dianggap pelanggan dan menggelembungkan angka pengguna.
 */
export function markInternalDevice() {
  try {
    safeStorage()?.setItem(INTERNAL_KEY, '1');
  } catch {
    // abaikan
  }
}

export function isInternalDevice(): boolean {
  try {
    return safeStorage()?.getItem(INTERNAL_KEY) === '1';
  } catch {
    return false;
  }
}

/** Sudah dilaporkan hari ini untuk mode ini? Menghindari request berulang di tiap halaman. */
export function alreadyTrackedToday(mode: DisplayMode): boolean {
  try {
    return safeStorage()?.getItem(LAST_TRACK_KEY) === `${new Date().toDateString()}|${mode}`;
  } catch {
    return false;
  }
}

export function rememberTrackedToday(mode: DisplayMode) {
  try {
    safeStorage()?.setItem(LAST_TRACK_KEY, `${new Date().toDateString()}|${mode}`);
  } catch {
    // abaikan
  }
}

/** Data pelacakan untuk ikut dikirim saat checkout. Kosong untuk perangkat internal. */
export function getCheckoutTracking(): { source: DisplayMode; visitorId: string } | null {
  if (isInternalDevice()) return null;
  return { source: getDisplayMode(), visitorId: getVisitorId() };
}
