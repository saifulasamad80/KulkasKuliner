"use client";

import { useCartStore } from '@/store/useCartStore';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CartPage() {
  const { items, increaseQty, decreaseQty, removeItem, clearCart, decreaseItemToMaxStock } = useCartStore();

  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncingStock, setSyncingStock] = useState(true);
  
  // RESOLUSI UX: Penambahan state 'notes' untuk catatan pembeli
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '' 
  });

  useEffect(() => {
    setIsClient(true);
    
    const syncCartWithDB = async () => {
      const currentItems = useCartStore.getState().items;
      const itemIds = currentItems.map(i => i.id);
      
      if(itemIds.length === 0) {
        setSyncingStock(false);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('id, stock, name')
        .in('id', itemIds);

      if (data && !error) {
        data.forEach(dbItem => {
          const cartItem = currentItems.find(ci => ci.id === dbItem.id);
          
          if (cartItem) {
            if (dbItem.stock === 0) {
               removeItem(cartItem.id);
               alert(`Maaf, ${dbItem.name} baru saja habis dibeli orang lain dan telah dihapus dari keranjang Anda.`);
            } else if (cartItem.quantity > dbItem.stock) {
               decreaseItemToMaxStock(cartItem.id, dbItem.stock);
               alert(`Stok ${dbItem.name} menurun. Kuantitas pesanan Anda disesuaikan menjadi sisa stok (${dbItem.stock}).`);
            }
          }
        });
      }
      setSyncingStock(false);
    };

    syncCartWithDB();
  }, []);

  if (!isClient) return null;

  const totalAmount = items.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: orderNumber, error } = await supabase.rpc('process_checkout', {
        c_name: formData.name,
        c_phone: formData.phone,
        c_address: formData.address,
        items: items.map(item => ({ p_id: item.id, qty: item.quantity }))
      });

      if (error) throw new Error(error.message);

      let adminPhone = "628889560447"; 
      
      const { data: waData, error: waError } = await supabase
        .from('store_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_wa_number')
        .single();
        
      if (waData && !waError && waData.setting_value) {
         adminPhone = waData.setting_value; 
      }

      // Merakit struk pesanan barang
      const orderDetails = items.map(item => `- ${item.quantity}x ${item.name} (Rp ${(item.price * item.quantity).toLocaleString('id-ID')})`).join('\n');
      
      // Merakit format catatan (jika ada)
      const notesSection = formData.notes.trim() !== '' ? `\n\n*Catatan Tambahan:*\n_${formData.notes}_` : '';

      // RESOLUSI WHATSAPP: Format pesan yang lebih detail
      const message = `Halo Admin KulkasKuliner!\nSaya ingin memproses pesanan saya.\n\n*ORDER ID: ${orderNumber}*\n\n*Pesanan:*\n${orderDetails}\n\n*Total Belanja:* Rp ${totalAmount.toLocaleString('id-ID')}${notesSection}\n\nMohon cek sistem untuk detail alamat saya, dan infokan ongkos kirim Instan/Sameday beserta total transfer.\n\nTerima kasih.`;
      
      const waUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;

      clearCart();
      window.location.href = waUrl;

    } catch (error: any) {
      console.error("Kesalahan Transaksi Internal:", error.message);
      alert('Maaf, transaksi gagal diproses oleh sistem keamanan kami. Kemungkinan besar stok barang telah habis dibeli pelanggan lain. Silakan periksa kembali keranjang Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  if (syncingStock) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <h1 className="text-xl font-bold text-gray-600 animate-pulse">Menyinkronkan stok gudang...</h1>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Keranjang Belanja Kosong</h1>
        <Link href="/#katalog" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50">
      <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Keranjang Belanja</h1>
        <Link href="/#katalog" className="text-blue-600 font-semibold hover:underline">
          &larr; Lanjut Belanja
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">{item.name}</h3>
                <p className="text-blue-600 font-semibold mt-1">Rp {item.price.toLocaleString('id-ID')}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => decreaseQty(item.id)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full font-bold text-gray-600 hover:bg-gray-200">-</button>
                <span className="font-bold w-4 text-center text-gray-900">{item.quantity}</span>
                <button onClick={() => increaseQty(item.id)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full font-bold text-gray-600 hover:bg-gray-200">+</button>
                <button onClick={() => removeItem(item.id)} className="ml-2 text-red-500 hover:text-red-700 p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mt-6">
            <div className="flex justify-between items-center text-xl">
              <span className="font-bold text-gray-700">Subtotal</span>
              <span className="font-black text-blue-600">Rp {totalAmount.toLocaleString('id-ID')}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">*Belum termasuk ongkos kirim Instan/Sameday.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-xl font-bold text-gray-800 mb-5">Detail Pengiriman</h2>
          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Penerima</label>
              <input type="text" required 
                className="w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" 
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Nama Anda"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">No. WhatsApp</label>
              <input type="tel" required 
                className="w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" 
                value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="08123456789"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Lengkap</label>
              <textarea required rows={3} 
                className="w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" 
                value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Contoh: Jl. Raya X No. 123, Patokan..."
              />
            </div>
            
            {/* RESOLUSI UX: Kolom Catatan Opsional */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Catatan Tambahan <span className="text-gray-400 font-normal">(Opsional)</span></label>
              <input type="text" 
                className="w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" 
                value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Contoh: Tolong pilihkan durian yang manis"
              />
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-green-600 text-white font-bold py-3.5 rounded-lg mt-4 hover:bg-green-700 transition-colors flex justify-center items-center gap-2 shadow-md">
              {isLoading ? (
                <span>Memproses Pesanan...</span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  Checkout via WhatsApp
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}