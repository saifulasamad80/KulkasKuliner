import { NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/admin-session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import type { OrderSnapshotItem, Product } from '@/lib/types';
import { getFavoriteMenus } from '@/lib/favorite-menus';

type AdminOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  notes?: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  items?: OrderSnapshotItem[] | null;
  order_items?: Array<{
    id: string;
    quantity: number;
    price_at_time: number;
    products?: { name: string; variant_name?: string | null } | null;
  }> | null;
};

function readDashboardData() {
  const admin = getSupabaseAdmin();
  return Promise.all([
    admin
      .from('orders')
      .select(
        'id, order_number, customer_name, customer_phone, shipping_address, notes, total_amount, status, created_at, items, order_items (id, quantity, price_at_time, products (name))'
      )
      .order('created_at', { ascending: false })
      .limit(50),
    admin
      .from('products')
      .select('id, name, price, stock, image_url, is_active, description, menu_id, variant_name, menus(id, name, description, image_url, is_active)')
      .order('name', { ascending: true }),
    admin.from('orders').select('total_amount, status'),
  ]);
}

function reportDashboardErrors(
  attempt: number,
  errors: Array<{ query: string; error: { code?: string; message?: string; details?: string; hint?: string } | null }>
) {
  const failed = errors.filter((entry) => entry.error);
  if (failed.length === 0) return;

  console.error(
    `Data dashboard gagal dibaca pada percobaan ${attempt}:`,
    failed.map(({ query, error }) => ({
      query,
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    }))
  );
}

export const runtime = 'nodejs';

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: 'Tidak terautentikasi.' }, { status: 401 });
  }

  try {
    let results = await readDashboardData();
    let [ordersResult, productsResult, revenueResult] = results;

    if (ordersResult.error || productsResult.error || revenueResult.error) {
      reportDashboardErrors(1, [
        { query: 'orders', error: ordersResult.error },
        { query: 'products', error: productsResult.error },
        { query: 'revenue', error: revenueResult.error },
      ]);

      await new Promise((resolve) => setTimeout(resolve, 250));
      results = await readDashboardData();
      [ordersResult, productsResult, revenueResult] = results;
    }

    if (ordersResult.error || productsResult.error || revenueResult.error) {
      reportDashboardErrors(2, [
        { query: 'orders', error: ordersResult.error },
        { query: 'products', error: productsResult.error },
        { query: 'revenue', error: revenueResult.error },
      ]);
      throw new Error('Data dashboard tidak lengkap.');
    }

    const orders = ordersResult.data;
    const products = productsResult.data;
    const revenueRows = revenueResult.data;

    const totalRevenue = (revenueRows ?? []).reduce((total, order) => {
      const status = String(order.status);
      return status === 'paid' || status === 'completed'
        ? total + Number(order.total_amount || 0)
        : total;
    }, 0);
    const favoriteMenus = await getFavoriteMenus((products ?? []) as unknown as Product[]);

    return NextResponse.json(
      {
        orders: (orders ?? []) as unknown as AdminOrder[],
        products: (products ?? []) as unknown as Product[],
        totalRevenue,
        favoriteMenus,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Data dashboard gagal dimuat:', error);
    return NextResponse.json({ error: 'Data dashboard gagal dimuat.' }, { status: 502 });
  }
}
