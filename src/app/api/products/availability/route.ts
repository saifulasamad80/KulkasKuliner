import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const ids = new URL(request.url).searchParams
    .get('ids')
    ?.split(',')
    .map((id) => id.trim())
    .filter(Boolean) ?? [];

  if (ids.length === 0 || ids.length > 100 || ids.some((id) => !/^[0-9a-f-]{36}$/i.test(id))) {
    return NextResponse.json({ error: 'Daftar produk tidak valid.' }, { status: 400 });
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('products')
      .select('id, stock, name, price, is_active, menu_id, variant_name')
      .in('id', ids);

    if (error) throw error;
    return NextResponse.json(
      { products: data ?? [] },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Ketersediaan produk gagal dimuat:', error);
    return NextResponse.json({ error: 'Stok gagal disinkronkan.' }, { status: 502 });
  }
}
