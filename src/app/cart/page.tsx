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
    notes: '' 
  });
  
  const [kodePos, setKodePos] = useState('');
  const [kota, setKota] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [kelurahan, setKelurahan] = useState('');
  const [detailJalan, setDetailJalan] = useState('');
  
  const [isFetchingZip, setIsFetchingZip] = useState(false);

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

  const handleKodePosChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); 
    setKodePos(val);

    if (val.length === 5) {
      setIsFetchingZip(true);
      try {
        const res = await fetch(`https://kodepos.vercel.app/search?q=${val}`);
        const result = await res.json();
        
        if (result && result.data && result.data.length > 0) {
          const match = result.data[0];
          setKota(match.city || '');
          setKecamatan(match.subdistrict || '');
          setKelurahan(match.urban || '');
        }
      } catch (err) {
        console.error("API Kode Pos Gagal, fallback ke manual", err);
      } finally {
        setIsFetchingZip(false);
      }
    }
  };

  if (!isClient) return null;

  const totalAmount = items.reduce((total, item) => total + item.price * item.quantity, 0);

  const validateCheckoutForm = (nama: string, wa: string) => {
    const nameRegex = /^[a-zA-Z\s']{3,50}$/;
    if (!nameRegex.test(nama)) {
      alert("NAMA DITOLAK: Hanya boleh berisi huruf dan spasi.");
      return null;
    }

    const cleanWa = wa.replace(/\D/g, ''); 
    const waRegex = /^(08|628)[0-9]{7,12}$/;
    if (!waRegex.test(cleanWa)) {
      alert("NOMOR WA DITOLAK: Harus berupa angka, diawali 08 atau 628, dan panjangnya 9-14 digit.");
      return null;
    }

    const formattedWa = cleanWa.startsWith('0') ? '62' + cleanWa.substring(1) : cleanWa;
    
    return { cleanName: nama.trim(), cleanWa: formattedWa };
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    const validated = validateCheckoutForm(formData.name, formData.phone);
    if (!validated) return;

    if (!kodePos || !kota || !kecamatan || !detailJalan) {
       alert("Mohon lengkapi seluruh kolom alamat pengiriman!");
       return;
    }

    setIsLoading(true);

    try {
      const dateObj = new Date();
      const orderNumber = `KUL-${String(dateObj.getFullYear()).slice(-2)}${String(dateObj.getMonth() + 1).padStart(2, '0')}${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getHours()).padStart(2, '0')}${String(dateObj.getMinutes()).padStart(2, '0')}${String(dateObj.getSeconds()).padStart(2, '0')}`;

      const alamatLengkap = `${detailJalan.trim()}, Kel. ${kelurahan}, Kec. ${kecamatan}, ${kota}, ${kodePos}`;

      const { error: dbError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          order_id: orderNumber,
          customer_name: validated.cleanName,
          customer_phone: validated.cleanWa,
          shipping_address: alamatLengkap,
          customer_address: alamatLengkap,
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

      const message = `Halo Admin KulkasKuliner!\nSaya ingin memproses pesanan saya via *JALUR VIP*.\n\n*ORDER ID: ${orderNumber}*\n*Nama:* ${validated.cleanName}\n*No. WA:* ${validated.cleanWa}\n*Alamat Pengiriman:*\n${alamatLengkap}\n\n*Pesanan:*\n${orderDetails}\n\n*Total Belanja:* Rp ${totalAmount.toLocaleString('id-ID')}${notesSection}\n\nMohon infokan ongkos kirim Instan/Sameday beserta total transfer.\n\nTerima kasih.`;
      
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

            {/* BLOK AUTO-FILL ALAMAT PINTAR YANG SUDAH DIURUTKAN */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-1">Detail Jalan & Patokan</label>
                 <textarea required rows={2} 
                   className="w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-[12px] p-3 focus:ring-2 focus:ring-red-600 outline-none shadow-sm transition-all" 
                   value={detailJalan} onChange={(e) => setDetailJalan(e.target.value)}
                   placeholder="Contoh: Jl. Pahlawan No.12, Rumah pagar hitam..."
                 />
               </div>

               <div className="relative">
                 <label className="block text-sm font-semibold text-gray-700 mb-1">Kode Pos <span className="text-red-500 font-normal text-xs">(Ketik untuk Auto-Complete)</span></label>
                 <input type="text" maxLength={5} required 
                   className="w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-[12px] p-3 focus:ring-2 focus:ring-red-600 outline-none shadow-sm transition-all font-mono font-bold tracking-widest" 
                   value={kodePos} onChange={handleKodePosChange}
                   placeholder="13540"
                 />
                 {isFetchingZip && (
                   <div className="absolute right-3 top-[34px] flex items-center gap-2">
                     <span className="text-[10px] font-bold text-gray-400 animate-pulse">MENCARI...</span>
                     <svg className="animate-spin h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   </div>
                 )}
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Kelurahan</label>
                    <input type="text" required className="w-full bg-white text-gray-900 border border-gray-300 rounded-[8px] p-2 text-sm focus:ring-1 focus:ring-red-600 outline-none" value={kelurahan} onChange={(e) => setKelurahan(e.target.value)} placeholder="Kelurahan" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Kecamatan</label>
                    <input type="text" required className="w-full bg-white text-gray-900 border border-gray-300 rounded-[8px] p-2 text-sm focus:ring-1 focus:ring-red-600 outline-none" value={kecamatan} onChange={(e) => setKecamatan(e.target.value)} placeholder="Kecamatan" />
                  </div>
               </div>

               <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Kota/Kabupaten</label>
                  <input type="text" required className="w-full bg-white text-gray-900 border border-gray-300 rounded-[8px] p-2 text-sm focus:ring-1 focus:ring-red-600 outline-none" value={kota} onChange={(e) => setKota(e.target.value)} placeholder="Kota/Kabupaten" />
               </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Catatan Tambahan <span className="text-gray-400 font-normal">(Opsional)</span></label>
              <input type="text" 
                className="w-full bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-[12px] p-3 focus:ring-2 focus:ring-red-600 outline-none shadow-sm transition-all" 
                value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Contoh: Tolong pilihkan durian yang manis"
              />
            </div>

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