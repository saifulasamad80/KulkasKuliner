import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type OrderItem = { id: string; quantity: number; price_at_time: number; products: { name: string; }; };
export type Order = { 
  id: string; 
  order_number: string; 
  customer_name: string; 
  customer_phone: string; 
  shipping_address: string; 
  notes?: string; // INJEKSI: Membaca catatan pembeli
  total_amount: number; 
  status: string; 
  created_at: string; 
  items?: any[]; // INJEKSI: Membaca kolom JSON Keranjang Belanja yang baru
  order_items?: OrderItem[]; // Fallback untuk pesanan jadul
};
export type Product = { id: string; name: string; stock: number; price: number; image_url: string; is_active: boolean; };

export function useAdminData() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    
    // RESOLUSI PRF-02: Batasi pengambilan data order hanya 50 pesanan terbaru (Pagination sederhana)
    // Tanda bintang (*) akan otomatis menarik kolom 'items' dan 'notes'
    const { data: orderData } = await supabase
      .from('orders')
      .select(`*, order_items (id, quantity, price_at_time, products (name))`)
      .order('created_at', { ascending: false })
      .limit(50); 
      
    const { data: prodData } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });
      
    const { data: revenueData } = await supabase.rpc('get_total_revenue');
    
    if (orderData) setOrders(orderData as unknown as Order[]);
    if (prodData) setProducts(prodData as Product[]);
    if (revenueData !== null) setTotalRevenue(Number(revenueData));
    
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!confirm(`Yakin ubah status jadi ${newStatus.toUpperCase()}?`)) return;
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (!error) {
      fetchData();
      if (newStatus === 'canceled') alert('Pesanan batal. Stok kembali otomatis.');
    }
  };

  const toggleProductActive = async (id: string, currentStatus: boolean) => {
    const action = currentStatus ? "Arsipkan (Sembunyikan dari Publik)" : "Aktifkan (Tampilkan ke Publik)";
    if (!confirm(`Yakin ingin ${action} produk ini?`)) return;
    const { error } = await supabase.from('products').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) fetchData();
  };

  return {
    orders, products, totalRevenue, isLoading,
    fetchData, updateOrderStatus, toggleProductActive
  };
}