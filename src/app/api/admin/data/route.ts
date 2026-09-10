import { NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/admin-session';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import type { OrderSnapshotItem, Product } from '@/lib/types';

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
    products?: { name: string } | null;
  }> | null;
};

export const runtime = 'nodejs';

export async function GET() {
  if (!(await hasAdminSession())) {
    return NextResponse.json({ error: 'Tidak terautentikasi.' }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdmin();
    const [{ data: orders, error: ordersError }, { data: products, error: productsError }, { data: revenueRows, error: revenueError }] =
      await Promise.all([
        admin
          .from('orders')
          .select(
            'id, order_number, customer_name, customer_phone, shipping_address, notes, total_amount, status, created_at, items, order_items (id, quantity, price_at_time, products (name))'
          )
          .order('created_at', { ascending: false })
          .limit(50),
        admin
          .from('products')
          .select('id, name, price, stock, image_url, is_active, description')
          .order('name', { ascending: true }),
        admin.from('orders').select('total_amount, status'),
      ]);

    if (ordersError || productsError || revenueError) {
      throw new Error('Data dashboard tidak lengkap.');
    }

    const totalRevenue = (revenueRows ?? []).reduce((total, order) => {
      const status = String(order.status);
      return status === 'paid' || status === 'completed'
        ? total + Number(order.total_amount || 0)
        : total;
    }, 0);

    return NextResponse.json(
      {
        orders: (orders ?? []) as unknown as AdminOrder[],
        products: (products ?? []) as unknown as Product[],
        totalRevenue,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Data dashboard gagal dimuat:', error);
    return NextResponse.json({ error: 'Data dashboard gagal dimuat.' }, { status: 502 });
  }
}
