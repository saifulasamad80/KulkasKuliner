import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code')?.trim() ?? '';
  if (!/^\d{5}$/.test(code)) {
    return NextResponse.json({ error: 'Kode pos tidak valid.' }, { status: 400 });
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('tbl_kodepos')
      .select('kelurahan, kecamatan, kabupaten, provinsi')
      .eq('kodepos', code)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Kode pos tidak ditemukan.' }, { status: 404 });

    return NextResponse.json({ data }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
  } catch (error) {
    console.error('Kode pos gagal dimuat:', error);
    return NextResponse.json({ error: 'Kode pos gagal diverifikasi.' }, { status: 502 });
  }
}
