"use client";

import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import Link from 'next/link';

// Definisi Tipe Data Kompleks dari Relasi Database
type OrderItem = {
  id: string;
  quantity: number;
  price_at_time: number;
  products: {
    name: string;
  };
};

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchOrders = async () => {
    setIsLoading(true);
    // Kueri Relasional: Ambil pesanan, gabung dengan order_items, gabung dengan products
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          price_at_time,
          products (name)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setOrders(data as unknown as Order[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const confirmAction = confirm(`Yakin ingin mengubah status menjadi: ${newStatus.toUpperCase()}?`);
    if (!confirmAction) return;

    // Eksekusi Update ke Database
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      alert(`Gagal update status: ${error.message}`);
    } else {
      // Panggil ulang data untuk sinkronisasi UI
      fetchOrders();
      if (newStatus === 'canceled') {
        alert('Pesanan dibatalkan. Stok barang telah otomatis dikembalikan oleh sistem.');
      }
    }
  };

  if (isLoading) return <div className="p-10 text-center font-bold text-xl">Memuat Data Pesanan...</div>;
  if (errorMsg) return <div className="p-10 text-center text-red-600 font-bold">ERROR: {errorMsg}</div>;

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-8 border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-500 mt-1">Sistem Manajemen Pesanan KulkasKuliner (MVP)</p>
        </div>
        <Link href="/" className="bg-gray-800 text-white px-5 py-2 rounded-lg font-bold hover:bg-gray-900 transition-colors">
          Lihat Katalog
        </Link>
      </div>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <div className="bg-white p-10 text-center rounded-xl shadow-sm border border-gray-200 text-gray-500 font-medium">
            Belum ada pesanan masuk.
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
              
              {/* Info Pelanggan & Pesanan */}
              <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-blue-100 text-blue-800 text-xs font-black px-2.5 py-1 rounded">
                    {order.order_number}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">{order.customer_name}</h2>
                <p className="text-sm font-semibold text-gray-600 mt-1 flex items-center gap-1">
                  📞 {order.customer_phone}
                </p>
                <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700">
                  <span className="block font-bold text-xs text-gray-400 mb-1">ALAMAT PENGIRIMAN:</span>
                  {order.shipping_address}
                </div>
                <div className="mt-4">
                  <span className="block font-bold text-xs text-gray-400 mb-1">WAKTU ORDER:</span>
                  <span className="text-sm font-medium">{new Date(order.created_at).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Rincian Barang & Aksi */}
              <div className="p-6 md:w-2/3 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">Rincian Belanja</h3>
                  <ul className="space-y-3">
                    {order.order_items.map((item) => (
                      <li key={item.id} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-700">
                          {item.quantity}x {item.products ? item.products.name : 'Produk Dihapus'}
                        </span>
                        <span className="font-bold text-gray-900">
                          Rp {(item.quantity * item.price_at_time).toLocaleString('id-ID')}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between items-center mt-5 pt-3 border-t border-gray-200">
                    <span className="font-bold text-gray-600">Total Tagihan</span>
                    <span className="text-xl font-black text-blue-600">
                      Rp {order.total_amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Panel Kontrol Status */}
                <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-600">Status Saat Ini:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      order.status === 'unpaid' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    {order.status === 'unpaid' && (
                      <button onClick={() => updateOrderStatus(order.id, 'paid')} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700">
                        Set Paid
                      </button>
                    )}
                    {order.status === 'paid' && (
                      <button onClick={() => updateOrderStatus(order.id, 'shipped')} className="bg-purple-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-purple-700">
                        Set Shipped
                      </button>
                    )}
                    {order.status === 'shipped' && (
                      <button onClick={() => updateOrderStatus(order.id, 'completed')} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700">
                        Set Completed
                      </button>
                    )}
                    {order.status !== 'canceled' && order.status !== 'completed' && (
                      <button onClick={() => updateOrderStatus(order.id, 'canceled')} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded text-sm font-bold hover:bg-red-100">
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}