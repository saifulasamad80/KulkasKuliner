export type DisplayMode = 'pwa' | 'browser';

export const DISPLAY_MODES: DisplayMode[] = ['pwa', 'browser'];

export type VisitRow = {
  visitor_id: string;
  display_mode: string;
  visit_date: string; // YYYY-MM-DD, zona waktu Asia/Jakarta
};

export type OrderRow = {
  total_amount: number | string;
  status: string;
  order_source: string | null;
  visitor_id: string | null;
  created_at: string;
};

export type ModeStats = {
  /** Perangkat unik yang membuka katalog di periode ini. */
  visitors: number;
  /** Perangkat yang aktif di 2 hari berbeda atau lebih (ukuran antusias). */
  returningVisitors: number;
  returningRate: number;
  /** Perangkat unik yang membuat pesanan (bukan yang ditolak/dibatalkan). */
  buyers: number;
  /** Pesanan yang dibuat (bukan yang ditolak/dibatalkan). */
  orders: number;
  /** buyers / visitors, null kalau belum ada pengunjung. */
  conversionRate: number | null;
  /** Pesanan yang sudah lunas (paid/completed). */
  paidOrders: number;
  revenue: number;
  /** revenue / paidOrders, 0 kalau belum ada pesanan lunas. */
  aov: number;
};

export type DailyPoint = { date: string; pwa: number; browser: number };

export type PwaAnalytics = {
  days: number;
  today: string;
  stats: Record<DisplayMode, ModeStats>;
  daily: DailyPoint[];
  dauToday: Record<DisplayMode, number>;
  averageDau: Record<DisplayMode, number>;
  /** Perangkat unik gabungan PWA + browser di periode ini. */
  totalVisitors: number;
  /** Porsi perangkat yang pernah memakai PWA dari seluruh pengunjung (0..1). */
  pwaShare: number;
  /** Pesanan periode ini tanpa data sumber (pesanan lama / perangkat admin). */
  unattributedOrders: number;
};

const JAKARTA_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Tanggal (YYYY-MM-DD) di zona waktu Jakarta. */
export function jakartaDate(input: Date | string): string {
  return JAKARTA_DATE.format(typeof input === 'string' ? new Date(input) : input);
}

export function shiftDate(date: string, deltaDays: number): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + deltaDays)).toISOString().slice(0, 10);
}

function isDisplayMode(value: unknown): value is DisplayMode {
  return value === 'pwa' || value === 'browser';
}

type Accumulator = {
  daysByVisitor: Map<string, Set<string>>;
  visitorsByDate: Map<string, Set<string>>;
  buyers: Set<string>;
  orders: number;
  paidOrders: number;
  revenue: number;
};

function createAccumulator(): Accumulator {
  return {
    daysByVisitor: new Map(),
    visitorsByDate: new Map(),
    buyers: new Set(),
    orders: 0,
    paidOrders: 0,
    revenue: 0,
  };
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export function computePwaAnalytics(input: {
  visits: VisitRow[];
  orders: OrderRow[];
  days: number;
  today: string;
}): PwaAnalytics {
  const { visits, orders, days, today } = input;
  const range = Array.from({ length: days }, (_, index) => shiftDate(today, index - (days - 1)));
  const inRange = new Set(range);
  const acc: Record<DisplayMode, Accumulator> = { pwa: createAccumulator(), browser: createAccumulator() };
  const allVisitors = new Set<string>();

  for (const visit of visits) {
    if (!isDisplayMode(visit.display_mode) || !inRange.has(visit.visit_date)) continue;
    const bucket = acc[visit.display_mode];

    const visitorDays = bucket.daysByVisitor.get(visit.visitor_id) ?? new Set<string>();
    visitorDays.add(visit.visit_date);
    bucket.daysByVisitor.set(visit.visitor_id, visitorDays);

    const dateVisitors = bucket.visitorsByDate.get(visit.visit_date) ?? new Set<string>();
    dateVisitors.add(visit.visitor_id);
    bucket.visitorsByDate.set(visit.visit_date, dateVisitors);

    allVisitors.add(visit.visitor_id);
  }

  let unattributedOrders = 0;
  orders.forEach((order, index) => {
    if (order.status === 'canceled') return;
    if (!inRange.has(jakartaDate(order.created_at))) return;
    if (!isDisplayMode(order.order_source)) {
      unattributedOrders += 1;
      return;
    }

    const bucket = acc[order.order_source];
    bucket.orders += 1;
    // Pesanan tanpa visitor_id tetap dihitung sebagai 1 pembeli sendiri.
    bucket.buyers.add(order.visitor_id ?? `order-${index}`);

    if (order.status === 'paid' || order.status === 'completed') {
      bucket.paidOrders += 1;
      bucket.revenue += Number(order.total_amount) || 0;
    }
  });

  const stats = {} as Record<DisplayMode, ModeStats>;
  const dauToday = {} as Record<DisplayMode, number>;
  const averageDau = {} as Record<DisplayMode, number>;

  for (const mode of ['pwa', 'browser'] as DisplayMode[]) {
    const bucket = acc[mode];
    const visitors = bucket.daysByVisitor.size;
    const returningVisitors = Array.from(bucket.daysByVisitor.values()).filter((dates) => dates.size >= 2).length;
    const buyers = bucket.buyers.size;

    stats[mode] = {
      visitors,
      returningVisitors,
      returningRate: visitors > 0 ? returningVisitors / visitors : 0,
      buyers,
      orders: bucket.orders,
      conversionRate: visitors > 0 ? Math.min(1, buyers / visitors) : null,
      paidOrders: bucket.paidOrders,
      revenue: bucket.revenue,
      aov: bucket.paidOrders > 0 ? Math.round(bucket.revenue / bucket.paidOrders) : 0,
    };

    dauToday[mode] = bucket.visitorsByDate.get(today)?.size ?? 0;
    const totalDaily = range.reduce((sum, date) => sum + (bucket.visitorsByDate.get(date)?.size ?? 0), 0);
    averageDau[mode] = round1(totalDaily / days);
  }

  const daily = range.map((date) => ({
    date,
    pwa: acc.pwa.visitorsByDate.get(date)?.size ?? 0,
    browser: acc.browser.visitorsByDate.get(date)?.size ?? 0,
  }));

  return {
    days,
    today,
    stats,
    daily,
    dauToday,
    averageDau,
    totalVisitors: allVisitors.size,
    pwaShare: allVisitors.size > 0 ? stats.pwa.visitors / allVisitors.size : 0,
    unattributedOrders,
  };
}
