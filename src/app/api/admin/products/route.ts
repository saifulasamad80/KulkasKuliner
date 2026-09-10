import { NextResponse } from 'next/server';
import { hasAdminSession, isSameOrigin } from '@/lib/admin-session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

type ProductInput = {
  name: string;
  price: number;
  stock: number;
  image_url: string;
  description?: string;
};

function validateProduct(input: unknown): ProductInput | null {
  if (!input || typeof input !== 'object') return null;
  const value = input as Record<string, unknown>;
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const imageUrl = typeof value.image_url === 'string' ? value.image_url.trim() : '';
  const description = typeof value.description === 'string' ? value.description.trim() : '';
  const price = Number(value.price);
  const stock = Number(value.stock);

  if (
    name.length < 2 ||
    name.length > 120 ||
    !Number.isInteger(price) ||
    price <= 0 ||
    !Number.isInteger(stock) ||
    stock < 0 ||
    imageUrl.length > 2_000 ||
    description.length > 500
  ) {
    return null;
  }

  return { name, price, stock, image_url: imageUrl, description };
}

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!(await hasAdminSession()) || !isSameOrigin(request)) {
    return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 403 });
  }

  try {
    const input = validateProduct(await request.json());
    if (!input) {
      return NextResponse.json({ error: 'Data produk tidak valid.' }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin()
      .from('products')
      .insert({ ...input, is_active: true })
      .select('id, name, price, stock, image_url, is_active, description')
      .single();

    if (error) throw error;
    return NextResponse.json({ product: data }, { status: 201 });
  } catch (error) {
    console.error('Produk gagal dibuat:', error);
    return NextResponse.json({ error: 'Produk gagal disimpan.' }, { status: 502 });
  }
}
