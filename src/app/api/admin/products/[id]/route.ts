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
  menu_id?: string | null;
  variant_name?: string | null;
  menu_name?: string | null;
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
  if ('menu_id' in value) {
    if (value.menu_id !== null && (typeof value.menu_id !== 'string' || !/^[0-9a-f-]{36}$/i.test(value.menu_id))) return null;
    patch.menu_id = value.menu_id === null ? null : value.menu_id.trim();
  }
  if ('variant_name' in value) {
    if (value.variant_name !== null && (typeof value.variant_name !== 'string' || value.variant_name.trim().length > 120)) return null;
    patch.variant_name = value.variant_name === null ? null : value.variant_name.trim();
  }
  if ('menu_name' in value) {
    if (value.menu_name !== null && (typeof value.menu_name !== 'string' || value.menu_name.trim().length < 2 || value.menu_name.trim().length > 120)) return null;
    patch.menu_name = value.menu_name === null ? null : value.menu_name.trim();
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
    const admin = getSupabaseAdmin();
    let productPatch = patch;
    if (patch.menu_name !== undefined) {
      let menuId: string | null = null;
      if (patch.menu_name) {
        const { data: menu, error: menuError } = await admin.from('menus').upsert({ name: patch.menu_name, is_active: true }, { onConflict: 'name' }).select('id').single();
        if (menuError) throw menuError;
        menuId = menu.id;
      }
      const rest = { ...patch };
      delete rest.menu_name;
      productPatch = { ...rest, menu_id: menuId };
    }
    const { data, error } = await admin
      .from('products')
      .update(productPatch)
      .eq('id', id)
      .select('id, name, price, stock, image_url, is_active, description, menu_id, variant_name')
      .single();

    if (error) throw error;
    return NextResponse.json({ product: data });
  } catch (error) {
    console.error('Produk gagal diperbarui:', error);
    return NextResponse.json({ error: 'Produk gagal diperbarui.' }, { status: 502 });
  }
}
