import { useCallback, useEffect, useState } from 'react';
import type { FavoriteMenu, OrderSnapshotItem, Product } from '@/lib/types';

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
  favoriteMenus: FavoriteMenu[];
};

export type ProductInput = {
  name: string;
  price: number;
  stock: number;
  image_url: string;
  description: string;
  menu_id?: string | null;
  variant_name?: string | null;
  menu_name?: string | null;
};

export type ProductVariantInput = {
  variant_name: string;
  price: number;
  stock: number;
};

export type VariantMenuInput = {
  kind: 'variants';
  menu_name: string;
  image_url: string;
  description: string;
  variants: ProductVariantInput[];
};

export type CreateProductInput = ProductInput | VariantMenuInput;

async function readError(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error || 'Permintaan gagal diproses.';
}

/** POST/PATCH `url` with a JSON body, throwing the server's error message on failure. */
async function requestJson(url: string, method: 'POST' | 'PATCH', body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readError(response));
}

export function useAdminData(enabled: boolean) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [favoriteMenus, setFavoriteMenus] = useState<FavoriteMenu[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    const response = await fetch('/api/admin/data', { cache: 'no-store' });
    if (!response.ok) throw new Error(await readError(response));

    const data = (await response.json()) as AdminDataResponse;
    setOrders(data.orders);
    setProducts(data.products);
    setTotalRevenue(Number(data.totalRevenue) || 0);
    setFavoriteMenus(Array.isArray(data.favoriteMenus) ? data.favoriteMenus : []);
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

  const createProduct = async (input: CreateProductInput) => {
    await requestJson('/api/admin/products', 'POST', input);
    await fetchData();
  };

  const updateProduct = async (id: string, input: ProductInput) => {
    await requestJson(`/api/admin/products/${encodeURIComponent(id)}`, 'PATCH', input);
    await fetchData();
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const confirmation = newStatus === 'paid'
      ? 'Yakin pembayaran sudah diverifikasi? Pesanan diterima dan stok akan dikurangi secara atomik.'
      : newStatus === 'canceled'
        ? 'Yakin menolak pesanan ini? Stok tidak akan dikurangi.'
        : newStatus === 'unpaid'
          ? 'Yakin batalkan verifikasi pembayaran? Status kembali ke Belum Bayar dan stok yang sudah dipotong akan dikembalikan.'
          : `Yakin ubah status jadi ${newStatus.toUpperCase()}?`;
    if (!confirm(confirmation)) return;

    await requestJson(`/api/admin/orders/${encodeURIComponent(orderId)}`, 'PATCH', { status: newStatus });
    await fetchData();
    if (newStatus === 'canceled') alert('Pesanan dibatalkan.');
    if (newStatus === 'unpaid') alert('Verifikasi pembayaran dibatalkan, stok dikembalikan.');
  };

  const toggleProductActive = async (id: string, currentStatus: boolean) => {
    const action = currentStatus ? 'Arsipkan (Sembunyikan dari Publik)' : 'Aktifkan (Tampilkan ke Publik)';
    if (!confirm(`Yakin ingin ${action} produk ini?`)) return;

    await requestJson(`/api/admin/products/${encodeURIComponent(id)}`, 'PATCH', { is_active: !currentStatus });
    await fetchData();
  };

  return {
    orders,
    products,
    totalRevenue,
    favoriteMenus,
    isLoading,
    fetchData,
    createProduct,
    updateProduct,
    updateOrderStatus,
    toggleProductActive,
  };
}
