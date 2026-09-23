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
  cost_price: number;
  image_url: string;
  description?: string;
  menu_id?: string | null;
  variant_name?: string | null;
  menu_name?: string | null;
};

type VariantInput = {
  variant_name: string;
  price: number;
  stock: number;
  cost_price: number;
};

type VariantMenuInput = {
  kind: 'variants';
  menu_name: string;
  image_url: string;
  description: string;
  variants: VariantInput[];
};

function validateVariantMenu(input: unknown): VariantMenuInput | null {
  if (!input || typeof input !== 'object') return null;
  const value = input as Record<string, unknown>;
  if (value.kind !== 'variants' || !Array.isArray(value.variants) || value.variants.length < 2 || value.variants.length > 25) return null;

  const menuName = validateRequiredText(value.menu_name, 2, 120);
  const imageUrl = normalizeBoundedText(value.image_url, { max: 2_000, requireString: true });
  const description = normalizeBoundedText(value.description, { max: 500, requireString: true });
  if (!menuName.valid || !imageUrl.valid || !description.valid) return null;

  const variants: VariantInput[] = [];
  for (const rawVariant of value.variants) {
    if (!rawVariant || typeof rawVariant !== 'object') return null;
    const variant = rawVariant as Record<string, unknown>;
    const variantName = validateRequiredText(variant.variant_name, 1, 120);
    const price = validatePositiveInteger(variant.price);
    const stock = validateNonNegativeInteger(variant.stock);
    const costPrice = variant.cost_price === undefined ? { valid: true as const, value: 0 } : validateNonNegativeInteger(variant.cost_price);
    if (!variantName.valid || !price.valid || !stock.valid || !costPrice.valid) return null;
    variants.push({ variant_name: variantName.value, price: price.value, stock: stock.value, cost_price: costPrice.value });
  }

  const uniqueNames = new Set(variants.map((variant) => variant.variant_name.toLocaleLowerCase('id-ID')));
  if (uniqueNames.size !== variants.length) return null;

  return {
    kind: 'variants',
    menu_name: menuName.value,
    image_url: imageUrl.value,
    description: description.value,
    variants,
  };
}

function validateProduct(input: unknown): ProductInput | null {
  if (!input || typeof input !== 'object') return null;
  const value = input as Record<string, unknown>;

  const name = validateRequiredText(value.name, 2, 120);
  const price = validatePositiveInteger(value.price);
  const stock = validateNonNegativeInteger(value.stock);
  const costPrice = value.cost_price === undefined ? { valid: true as const, value: 0 } : validateNonNegativeInteger(value.cost_price);
  const imageUrl = normalizeBoundedText(value.image_url, { max: 2_000 });
  const description = normalizeBoundedText(value.description, { max: 500 });
  const menuId = normalizeNullableText(value.menu_id, { pattern: MENU_ID_PATTERN });
  const variantName = normalizeNullableText(value.variant_name, { min: 1, max: 120 });
  const menuName = normalizeNullableText(value.menu_name, { min: 2, max: 120 });

  if (!name.valid || !price.valid || !stock.valid || !costPrice.valid || !imageUrl.valid || !description.valid || !menuId.valid || !variantName.valid || !menuName.valid) {
    return null;
  }

  return {
    name: name.value,
    price: price.value,
    stock: stock.value,
    cost_price: costPrice.value,
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
    const body: unknown = await request.json();
    const variantMenu = validateVariantMenu(body);
    if (variantMenu) {
      const admin = getSupabaseAdmin();
      const { data, error } = await admin.rpc('create_variant_menu_atomic', {
        p_menu_name: variantMenu.menu_name,
        p_description: variantMenu.description,
        p_image_url: variantMenu.image_url,
        p_variants: variantMenu.variants,
      });
      if (error) throw error;
      return NextResponse.json({ menu: data }, { status: 201 });
    }

    const input = validateProduct(body);
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
      .select('id, name, price, stock, cost_price, image_url, is_active, description, menu_id, variant_name')
      .single();

    if (error) throw error;
    return NextResponse.json({ product: data }, { status: 201 });
  } catch (error) {
    console.error('Produk gagal dibuat:', error);
    const databaseError = error as { code?: string };
    if (databaseError?.code === 'P0001') {
      return NextResponse.json({ error: 'Nama menu sudah dipakai. Edit menu yang ada atau gunakan nama lain.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Produk gagal disimpan.' }, { status: 502 });
  }
}
