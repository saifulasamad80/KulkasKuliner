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

type ProductInput = {
  name: string;
  price: number;
  stock: number;
  image_url: string;
  description?: string;
  menu_id?: string | null;
  variant_name?: string | null;
  menu_name?: string | null;
};

function validateProduct(input: unknown): ProductInput | null {
  if (!input || typeof input !== 'object') return null;
  const value = input as Record<string, unknown>;

  const name = validateRequiredText(value.name, 2, 120);
  const price = validatePositiveInteger(value.price);
  const stock = validateNonNegativeInteger(value.stock);
  const imageUrl = normalizeBoundedText(value.image_url, { max: 2_000 });
  const description = normalizeBoundedText(value.description, { max: 500 });
  const menuId = normalizeNullableText(value.menu_id, { pattern: MENU_ID_PATTERN });
  const variantName = normalizeNullableText(value.variant_name, { min: 1, max: 120 });
  const menuName = normalizeNullableText(value.menu_name, { min: 2, max: 120 });

  if (!name.valid || !price.valid || !stock.valid || !imageUrl.valid || !description.valid || !menuId.valid || !variantName.valid || !menuName.valid) {
    return null;
  }

  return {
    name: name.value,
    price: price.value,
    stock: stock.value,
    image_url: imageUrl.value,
    description: description.value,
    menu_id: menuId.value,
    variant_name: variantName.value,
    menu_name: menuName.value,
  };
}

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const input = validateProduct(await request.json());
    if (!input) {
      return NextResponse.json({ error: 'Data produk tidak valid.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    let menuId = input.menu_id;
    if (input.menu_name) {
      const { data: menu, error: menuError } = await admin
        .from('menus')
        .upsert({ name: input.menu_name, is_active: true }, { onConflict: 'name' })
        .select('id')
        .single();
      if (menuError) throw menuError;
      menuId = menu.id;
    }
    const productInput = { ...input };
    delete productInput.menu_name;
    const { data, error } = await admin
      .from('products')
      .insert({ ...productInput, menu_id: menuId, is_active: true })
      .select('id, name, price, stock, image_url, is_active, description, menu_id, variant_name')
      .single();

    if (error) throw error;
    return NextResponse.json({ product: data }, { status: 201 });
  } catch (error) {
    console.error('Produk gagal dibuat:', error);
    return NextResponse.json({ error: 'Produk gagal disimpan.' }, { status: 502 });
  }
}
