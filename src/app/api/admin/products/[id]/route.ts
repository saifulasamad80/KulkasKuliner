import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  MENU_ID_PATTERN,
  normalizeBoundedText,
  normalizeNullableText,
  validateNonNegativeInteger,
  validatePositiveInteger,
  validateRequiredText,
} from '@/lib/product-validation';

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
    const name = validateRequiredText(value.name, 2, 120);
    if (!name.valid) return null;
    patch.name = name.value;
  }
  if ('price' in value) {
    const price = validatePositiveInteger(value.price);
    if (!price.valid) return null;
    patch.price = price.value;
  }
  if ('stock' in value) {
    const stock = validateNonNegativeInteger(value.stock);
    if (!stock.valid) return null;
    patch.stock = stock.value;
  }
  if ('image_url' in value) {
    const imageUrl = normalizeBoundedText(value.image_url, { max: 2_000, requireString: true });
    if (!imageUrl.valid) return null;
    patch.image_url = imageUrl.value;
  }
  if ('description' in value) {
    const description = normalizeBoundedText(value.description, { max: 500, requireString: true });
    if (!description.valid) return null;
    patch.description = description.value;
  }
  if ('is_active' in value) {
    if (typeof value.is_active !== 'boolean') return null;
    patch.is_active = value.is_active;
  }
  if ('menu_id' in value) {
    const menuId = normalizeNullableText(value.menu_id, { pattern: MENU_ID_PATTERN });
    if (!menuId.valid) return null;
    patch.menu_id = menuId.value;
  }
  if ('variant_name' in value) {
    const variantName = normalizeNullableText(value.variant_name, { max: 120 });
    if (!variantName.valid) return null;
    patch.variant_name = variantName.value;
  }
  if ('menu_name' in value) {
    const menuName = normalizeNullableText(value.menu_name, { min: 2, max: 120 });
    if (!menuName.valid) return null;
    patch.menu_name = menuName.value;
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  context: RouteContext<'/api/admin/products/[id]'>
) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

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
    const databaseError = error as { code?: string; message?: string };
    if (databaseError?.code === '23505') {
      return NextResponse.json({ error: 'Nama menu sudah dipakai. Gunakan nama menu lain.' }, { status: 409 });
    }
    if (databaseError?.code === '23503') {
      return NextResponse.json({ error: 'Menu induk tidak ditemukan. Muat ulang dashboard lalu coba lagi.' }, { status: 409 });
    }
    if (databaseError?.code === 'PGRST116') {
      return NextResponse.json({ error: 'Produk tidak ditemukan. Muat ulang dashboard lalu coba lagi.' }, { status: 404 });
    }
    if (databaseError?.code === '42P01' || databaseError?.code === '42703') {
      return NextResponse.json({ error: 'Struktur database katalog belum lengkap. Jalankan migration katalog terlebih dahulu.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Produk gagal diperbarui. Cek koneksi database atau muat ulang dashboard.' }, { status: 502 });
  }
}
