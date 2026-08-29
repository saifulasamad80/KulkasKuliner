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

  const validateCheckoutForm = (nama: string, wa: string) => {
    const nameRegex = /^[a-zA-Z\s']{3,50}$/;
    if (!nameRegex.test(nama)) {
      alert("NAMA DITOLAK: Hanya boleh berisi huruf dan spasi (Minimal 3 karakter). Dilarang menggunakan angka atau simbol aneh.");
      return null;
    }

    const cleanWa = wa.replace(/\D/g, ''); 
    const waRegex = /^(08|628)[0-9]{7,12}$/;
    if (!waRegex.test(cleanWa)) {
      alert("NOMOR WA DITOLAK: Harus berupa angka, diawali 08 atau 628, dan panjangnya 9-14 digit (contoh: 08123456789).");
      return null;
    }

    const formattedWa = cleanWa.startsWith('0') ? '62' + cleanWa.substring(1) : cleanWa;
    
    return { cleanName: nama.trim(), cleanWa: formattedWa };
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    const validated = validateCheckoutForm(formData.name, formData.phone);
    if (!validated) return;

    setIsLoading(true);

    try {
      const dateObj = new Date();
      const yy = String(dateObj.getFullYear()).slice(-2);
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const hh = String(dateObj.getHours()).padStart(2, '0');
      const min = String(dateObj.getMinutes()).padStart(2, '0');
      const ss = String(dateObj.getSeconds()).padStart(2, '0');
      const orderNumber = `KUL-${yy}${mm}${dd}-${hh}${min}${ss}`;

      const { error: dbError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          order_id: orderNumber,
          customer_name: validated.cleanName,
          customer_phone: validated.cleanWa,
          shipping_address: formData.address,
          customer_address: formData.address,
          notes: formData.notes,
          total_amount: totalAmount,
          items: items,
          status: 'unpaid'
        });

      if (dbError) throw new Error(dbError.message);

      try {
        await fetch('/api/telegram/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: orderNumber,
            customer_name: validated.cleanName,
            total_amount: totalAmount,
            items_detail: items.map(item => `- ${item.quantity}x ${item.name}`).join('\n')
          })
        });
      } catch (tgError) {
        console.error("Gagal mengirim Telegram", tgError);
      }

      let adminPhone = "628889560447"; 
      const { data: waData, error: waError } = await supabase
        .from('store_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_wa_number')
        .single();
        
      if (waData && !waError && waData.setting_value) {
         adminPhone = waData.setting_value; 
      }

      const orderDetails = items.map(item => `- ${item.quantity}x ${item.name} (Rp ${(item.price * item.quantity).toLocaleString('id-ID')})`).join('\n');
      const notesSection = formData.notes.trim() !== '' ? `\n\n*Catatan Tambahan:*\n_${formData.notes}_` : '';

      const message = `Halo Admin KulkasKuliner!\nSaya ingin memproses pesanan saya via *JALUR VIP*.\n\n*ORDER ID: ${orderNumber}*\n*Nama:* ${validated.cleanName}\n*No. WA:* ${validated.cleanWa}\n\n*Pesanan:*\n${orderDetails}\n\n*Total Belanja:* Rp ${totalAmount.toLocaleString('id-ID')}${notesSection}\n\nMohon cek sistem untuk detail alamat saya, dan infokan ongkos kirim Instan/Sameday beserta total transfer.\n\nTerima kasih.`;
      
      const waUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;

      clearCart();
      window.location.href = waUrl;

    } catch (error: any) {
      console.error("Kesalahan Transaksi Internal:", error.message);
      alert('Gagal merekam pesanan ke sistem. Pastikan koneksi internet Anda stabil dan coba lagi.');
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
        <div className="bg-red-50 p-6 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Keranjang Masih Kosong</h1>
        <Link href="/#katalog" className="bg-red-600 text-white px-8 py-3 rounded-full font-bold hover:bg-red-700 transition-all shadow-md active:scale-95">
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50">
      <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Checkout</h1>
        <Link href="/#katalog" className="text-red-600 font-semibold hover:underline text-sm">
          &larr; Tambah Menu Lain
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* KOLOM KIRI: Daftar Pesanan */}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <p className="text-red-600 font-bold mt-1">Rp {item.price.toLocaleString('id-ID')}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => decreaseQty(item.id)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full font-bold text-gray-600 hover:bg-gray-200">-</button>
                <span className="font-bold w-4 text-center text-gray-900">{item.quantity}</span>
                <button onClick={() => increaseQty(item.id)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full font-bold text-gray-600 hover:bg-gray-200">+</button>
                <button onClick={() => removeItem(item.id)} className="ml-2 text-gray-400 hover:text-red-500 transition-colors p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mt-6">
            <div className="flex justify-between items-center text-xl">
              <span className="font-bold text-gray-700">Subtotal</span>
              <span className="font-black text-red-600">Rp {totalAmount.toLocaleString('id-ID')}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">*Belum termasuk ongkos kirim Instan/Sameday.</p>
          </div>
        </div>

        {/* KOLOM KANAN: Form & CTA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Detail Pengiriman</h2>
          <form onSubmit={handleCheckout} className="space-y-4">
            
            {/* INJEKSI: Senjata Psikologi Jalur VIP */}
            <div className="bg-red-50 border border-red-200 p-3.5 rounded-lg mb-6 flex items-start gap-3">
              <span className="text-xl">🚀</span>
              <p className="text-[13px] text-red-900 font-medium leading-relaxed">
                <strong className="font-bold block text-red-700">JALUR VIP & PRIORITAS!</strong>
                Selesaikan order via sistem ini agar pesanan Anda langsung masuk ke layar kasir kami dan diproses tanpa harus antre menunggu balasan chat.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Penerima</label>
              <input type="text" required 
                className="w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-[12px] p-3 focus:ring-2 focus:ring-red-600 outline-none shadow-sm transition-all" 
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Nama Anda"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">No. WhatsApp</label>
              <input type="tel" required 
                className="w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-[12px] p-3 focus:ring-2 focus:ring-red-600 outline-none shadow-sm transition-all" 
                value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="08123456789"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Lengkap</label>
              <textarea required rows={3} 
                className="w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-[12px] p-3 focus:ring-2 focus:ring-red-600 outline-none shadow-sm transition-all" 
                value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Contoh: Jl. Raya X No. 123, Patokan..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Catatan Tambahan <span className="text-gray-400 font-normal">(Opsional)</span></label>
              <input type="text" 
                className="w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-[12px] p-3 focus:ring-2 focus:ring-red-600 outline-none shadow-sm transition-all" 
                value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Contoh: Tolong pilihkan durian yang manis"
              />
            </div>

            {/* FOODDASH CTA: Pill shape, primary red color */}
            <button type="submit" disabled={isLoading} className="w-full bg-red-600 text-white font-bold py-[14px] rounded-full mt-4 hover:bg-red-700 hover:shadow-lg transition-all active:scale-[0.98] flex justify-center items-center gap-2 shadow-sm">
              {isLoading ? (
                <span>Memproses VIP...</span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                  Kirim Pesanan (Jalur VIP)
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}