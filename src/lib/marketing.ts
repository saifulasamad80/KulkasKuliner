import type { FavoriteMenu, Product } from '@/lib/types';

export const JAKARTA_TIME_ZONE = 'Asia/Jakarta';

export type TimeContext = {
  hour: number;
  dayName: string;
  dayOfMonth: number;
};

/** Resolve the current hour/day-name/day-of-month in the Asia/Jakarta time zone. */
export function getJakartaTimeContext(date: Date): TimeContext {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: JAKARTA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = Number(values.hour === '24' ? '0' : values.hour);

  return {
    hour,
    dayName: new Intl.DateTimeFormat('id-ID', {
      timeZone: JAKARTA_TIME_ZONE,
      weekday: 'long',
    }).format(date),
    dayOfMonth: Number(values.day),
  };
}

/** Time-of-day greeting used across the marketing copy generators. */
export function getTimeGreeting(hour: number) {
  if (hour >= 4 && hour < 11) return 'Selamat pagi';
  if (hour >= 11 && hour < 15) return 'Selamat siang';
  if (hour >= 15 && hour < 19) return 'Selamat sore';
  return 'Selamat malam';
}

/** Product name plus variant, e.g. "Nasi Goreng Ayam". */
export function getProductLabel(product: Product) {
  return `${product.name}${product.variant_name ? ` ${product.variant_name}` : ''}`.trim();
}

/** Products that are published and currently in stock. */
export function getAvailableProducts(products: Product[]) {
  return products.filter((product) => product.is_active && product.stock > 0);
}

/**
 * Pick up to `count` items from `candidates`, rotating the starting point by
 * `rotationSeed` so repeated calls (e.g. "Buat Iklan Baru") surface different
 * products instead of always the same first few.
 */
export function selectRotatingProducts<T>(candidates: T[], rotationSeed: number, count = 3) {
  if (candidates.length === 0) return [];
  const length = Math.min(count, candidates.length);
  return Array.from({ length }, (_, index) => candidates[(rotationSeed + index) % candidates.length]);
}

export function getFavoriteProducts(favoriteMenus: FavoriteMenu[], onlyWithImages = false) {
  return favoriteMenus
    .map((menu) => menu.products.find((product) => product.is_active && product.stock > 0 && (!onlyWithImages || Boolean(product.image_url?.trim()))))
    .filter((product): product is Product => Boolean(product))
    .slice(0, 3);
}

export function getFavoriteStockText(favoriteMenus: FavoriteMenu[]) {
  const available = favoriteMenus.filter((menu) => menu.stock > 0);
  if (available.length === 0) return 'Stok menu favorit sedang habis—cek katalog untuk pilihan yang masih tersedia.';

  const limited = available.filter((menu) => menu.stock <= 5);
  if (limited.length > 0) {
    return `Stok favorit terbatas: ${limited.slice(0, 3).map((menu) => `${menu.label} (sisa ${menu.stock})`).join(', ')}.`;
  }

  return `Menu favorit masih tersedia: ${available.slice(0, 3).map((menu) => `${menu.label} (${menu.stock} stok)`).join(', ')}.`;
}

/** Falls back to the production URL during server-side rendering. */
export function getSiteOrigin() {
  return typeof window === 'undefined' ? 'https://kulkaskuliner.vercel.app' : window.location.origin;
}

export function getCatalogUrl() {
  return `${getSiteOrigin()}/#katalog`;
}
