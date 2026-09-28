import { NextResponse } from 'next/server';
import { isSameOrigin } from '@/lib/admin-session';
import { jakartaDate } from '@/lib/pwa-analytics';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

const VISITOR_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
const BOT_PATTERN = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit/i;

/**
 * Mencatat "perangkat ini membuka katalog hari ini". Idempotent: pemanggilan
 * ulang di hari yang sama tidak menambah baris (unique visitor+tanggal+mode).
 * Sengaja tidak membalas detail error ke klien; pelacakan tidak boleh
 * mengganggu pembeli.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  if (BOT_PATTERN.test(request.headers.get('user-agent') ?? '')) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const value = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const visitorId = typeof value.visitorId === 'string' ? value.visitorId : '';
  const displayMode = value.displayMode;
  if (!VISITOR_ID_PATTERN.test(visitorId) || (displayMode !== 'pwa' && displayMode !== 'browser')) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const { error } = await getSupabaseAdmin()
      .from('pwa_visits')
      .upsert(
        { visitor_id: visitorId, display_mode: displayMode, visit_date: jakartaDate(new Date()) },
        { onConflict: 'visitor_id,visit_date,display_mode', ignoreDuplicates: true }
      );
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Pelacakan kunjungan gagal:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
