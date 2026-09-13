import { useCallback, useEffect, useState } from 'react';
import type { OrderSnapshotItem, Product } from '@/lib/types';

export type OrderItem = {
  id: string;
  quantity: number;
  price_at_time: number;
  products?: { name: string; variant_name?: string | null } | null;
};

export type Order = {
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
  order_items?: OrderItem[] | null;
};

type AdminDataResponse = {
  orders: Order[];
  products: Product[];
  totalRevenue: number;
};

type ProductInput = {
  name: string;
  price: number;
  stock: number;
  image_url: string;
  description: string;
  menu_id?: string | null;
  variant_name?: string | null;
  menu_name?: string | null;
};

async function readError(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error || 'Permintaan gagal diproses.';
}

export function useAdminData(enabled: boolean) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    const response = await fetch('/api/admin/data', { cache: 'no-store' });
    if (!response.ok) throw new Error(await readError(response));

    const data = (await response.json()) as AdminDataResponse;
    setOrders(data.orders);
    setProducts(data.products);
    setTotalRevenue(Number(data.totalRevenue) || 0);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    const load = async () => {
      setIsLoading(true);
      try {
        await fetchData();
      } catch (error) {
        if (active) console.error('Data admin gagal dimuat:', error);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    const refreshInterval = window.setInterval(() => {
      void fetchData().catch((error: unknown) => {
        if (active) console.error('Refresh data admin gagal:', error);
      });
    }, 15_000);

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
    };
  }, [enabled, fetchData]);

  const createProduct = async (input: ProductInput) => {
    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(await readError(response));
    await fetchData();
  };

  const updateProduct = async (id: string, input: ProductInput) => {
    const response = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error(await readError(response));
    await fetchData();
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const confirmation = newStatus === 'paid'
      ? 'Yakin pembayaran sudah diverifikasi? Pesanan diterima dan stok akan dikurangi secara atomik.'
      : newStatus === 'canceled'
        ? 'Yakin menolak pesanan ini? Stok tidak akan dikurangi.'
        : `Yakin ubah status jadi ${newStatus.toUpperCase()}?`;
    if (!confirm(confirmation)) return;

    const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!response.ok) throw new Error(await readError(response));
    await fetchData();
    if (newStatus === 'canceled') alert('Pesanan dibatalkan.');
  };

  const toggleProductActive = async (id: string, currentStatus: boolean) => {
    const action = currentStatus ? 'Arsipkan (Sembunyikan dari Publik)' : 'Aktifkan (Tampilkan ke Publik)';
    if (!confirm(`Yakin ingin ${action} produk ini?`)) return;

    const response = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !currentStatus }),
    });
    if (!response.ok) throw new Error(await readError(response));
    await fetchData();
  };

  return {
    orders,
    products,
    totalRevenue,
    isLoading,
    fetchData,
    createProduct,
    updateProduct,
    updateOrderStatus,
    toggleProductActive,
  };
}
