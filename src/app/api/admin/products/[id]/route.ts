import { NextResponse } from 'next/server';
import { hasAdminSession, isSameOrigin } from '@/lib/admin-session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

type ProductPatch = {
  name?: string;
  price?: number;
  stock?: number;
  image_url?: string;
  description?: string;
  is_active?: boolean;
};

function validatePatch(input: unknown): ProductPatch | null {
  if (!input || typeof input !== 'object') return null;
  const value = input as Record<string, unknown>;
  const patch: ProductPatch = {};

  if ('name' in value) {
    if (typeof value.name !== 'string' || value.name.trim().length < 2 || value.name.trim().length > 120) return null;
    patch.name = value.name.trim();
  }
  if ('price' in value) {
    if (!Number.isInteger(Number(value.price)) || Number(value.price) <= 0) return null;
    patch.price = Number(value.price);
  }
  if ('stock' in value) {
    if (!Number.isInteger(Number(value.stock)) || Number(value.stock) < 0) return null;
    patch.stock = Number(value.stock);
  }
  if ('image_url' in value) {
    if (typeof value.image_url !== 'string' || value.image_url.trim().length > 2_000) return null;
    patch.image_url = value.image_url.trim();
  }
  if ('description' in value) {
    if (typeof value.description !== 'string' || value.description.trim().length > 500) return null;
    patch.description = value.description.trim();
  }
  if ('is_active' in value) {
    if (typeof value.is_active !== 'boolean') return null;
    patch.is_active = value.is_active;
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  context: RouteContext<'/api/admin/products/[id]'>
) {
  if (!(await hasAdminSession()) || !isSameOrigin(request)) {
    return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 403 });
  }

  const { id } = await context.params;
  const patch = validatePatch(await request.json());
  if (!patch) {
    return NextResponse.json({ error: 'Perubahan produk tidak valid.' }, { status: 400 });
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('products')
      .update(patch)
      .eq('id', id)
      .select('id, name, price, stock, image_url, is_active, description')
      .single();

    if (error) throw error;
    return NextResponse.json({ product: data });
  } catch (error) {
    console.error('Produk gagal diperbarui:', error);
    return NextResponse.json({ error: 'Produk gagal diperbarui.' }, { status: 502 });
  }
}
