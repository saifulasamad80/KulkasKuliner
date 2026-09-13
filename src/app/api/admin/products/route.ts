import { NextResponse } from 'next/server';
import { hasAdminSession, isSameOrigin } from '@/lib/admin-session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

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
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const imageUrl = typeof value.image_url === 'string' ? value.image_url.trim() : '';
  const description = typeof value.description === 'string' ? value.description.trim() : '';
  const menuId = value.menu_id === null || value.menu_id === undefined || typeof value.menu_id === 'string' ? (typeof value.menu_id === 'string' ? value.menu_id.trim() : null) : '__invalid__';
  const variantName = value.variant_name === null || value.variant_name === undefined || typeof value.variant_name === 'string' ? (typeof value.variant_name === 'string' ? value.variant_name.trim() : null) : '__invalid__';
  const menuName = value.menu_name === null || value.menu_name === undefined || typeof value.menu_name === 'string' ? (typeof value.menu_name === 'string' ? value.menu_name.trim() : null) : '__invalid__';
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
    || menuId === '__invalid__' || variantName === '__invalid__'
    || (menuId !== null && !/^[0-9a-f-]{36}$/i.test(menuId))
    || (variantName !== null && (variantName.length < 1 || variantName.length > 120))
    || menuName === '__invalid__' || (menuName !== null && (menuName.length < 2 || menuName.length > 120))
  ) {
    return null;
  }

  return { name, price, stock, image_url: imageUrl, description, menu_id: menuId, variant_name: variantName, menu_name: menuName };
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
