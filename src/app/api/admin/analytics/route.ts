import { NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/admin-session';
import { computePwaAnalytics, jakartaDate, shiftDate, type OrderRow, type VisitRow } from '@/lib/pwa-analytics';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

const PAGE_SIZE = 1000; // batas baris per request Supabase
const MAX_PAGES = 50;

// 42P01/PGRST205 = tabel belum ada, 42703/PGRST204 = kolom belum ada.
const MISSING_SCHEMA_CODES = new Set(['42P01', '42703', 'PGRST204', 'PGRST205']);

type PageResult = { data: unknown[] | null; error: { code?: string; message?: string } | null };

/** Supabase membatasi 1000 baris per request, jadi ambil bertahap sampai habis. */
async function fetchAll(load: (from: number, to: number) => PromiseLike<PageResult>) {
  const rows: unknown[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const from = page * PAGE_SIZE;
    const { data, error } = await load(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

export async function GET(request: Request) {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 403 });
  }

  const requestedDays = Number(new URL(request.url).searchParams.get('days'));
  const days = requestedDays === 30 ? 30 : 7;
  const today = jakartaDate(new Date());
  const startDate = shiftDate(today, -(days - 1));

  try {
    const admin = getSupabaseAdmin();

    const [visits, orders] = await Promise.all([
      fetchAll((from, to) =>
        admin
          .from('pwa_visits')
          .select('visitor_id, display_mode, visit_date')
          .gte('visit_date', startDate)
          .order('id')
          .range(from, to)
      ),
      fetchAll((from, to) =>
        admin
          .from('orders')
          .select('total_amount, status, order_source, visitor_id, created_at')
          .gte('created_at', `${startDate}T00:00:00+07:00`)
          .order('created_at')
          .order('id')
          .range(from, to)
      ),
    ]);

    const analytics = computePwaAnalytics({
      visits: visits as VisitRow[],
      orders: orders as OrderRow[],
      days,
      today,
    });

    return NextResponse.json(analytics, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Statistik PWA gagal dimuat:', error);
    const code = (error as { code?: string })?.code;
    if (code && MISSING_SCHEMA_CODES.has(code)) {
      return NextResponse.json(
        { error: 'Tabel statistik belum dibuat. Jalankan migration SQL 20260928_pwa_analytics.sql di Supabase dulu.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: 'Statistik gagal dimuat. Coba muat ulang.' }, { status: 502 });
  }
}
