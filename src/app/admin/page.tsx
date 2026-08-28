"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAdminData } from '@/hooks/useAdminData';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  const { 
    orders, products, totalRevenue, isLoading, 
    fetchData, updateOrderStatus, toggleProductActive 
  } = useAdminData();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, stock: 0, image_url: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: 0, stock: 0, image_url: '' });

  useEffect(() => {
    const savedSession = sessionStorage.getItem('kuliner_admin_auth');
    if (savedSession === "authenticated") {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_secret_pin')
        .single();

      if (error || !data) throw new Error("Gagal terhubung ke server keamanan.");

      if (pinInput === data.setting_value) {
        sessionStorage.setItem('kuliner_admin_auth', 'authenticated');
        setIsAuthenticated(true);
      } else {
        alert("PIN Akses Ditolak!");
        setPinInput("");
      }
    } catch (err) {
      console.error(err);
      alert("Kesalahan sistem. Pastikan key 'admin_secret_pin' ada di tabel store_settings.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('kuliner_admin_auth');
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || newProduct.price <= 0) return alert("Nama dan Harga wajib diisi valid!");
    const { error } = await supabase.from('products').insert([{ ...newProduct, is_active: true }]);
    if (error) alert(`Gagal: ${error.message}`);
    else { alert("Produk ditambah!"); setIsAdding(false); setNewProduct({ name: '', price: 0, stock: 0, image_url: '' }); fetchData(); }
  };

  const saveEditProduct = async (id: string) => {
    const { error } = await supabase.from('products').update(editForm).eq('id', id);
    if (error) alert(`Gagal update: ${error.message}`);
    else { setEditingId(null); fetchData(); }
  };

  if (isCheckingAuth) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><p className="text-white">Verifikasi Keamanan...</p></div>;

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full border-t-8 border-red-600">
          <h1 className="text-2xl font-black text-gray-900 mb-2 text-center">Area Terlarang</h1>
          <p className="text-sm text-gray-500 mb-6 text-center">Masukkan PIN Operasional untuk mengakses Dashboard KulkasKuliner.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="Masukkan PIN" 
              required
              disabled={isVerifying}
              className="w-full text-center tracking-[1em] font-black text-2xl p-4 border-2 border-gray-300 rounded-xl focus:border-red-600 focus:ring-0 outline-none disabled:bg-gray-100 disabled:opacity-50"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={isVerifying}
              className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors shadow-lg disabled:bg-red-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isVerifying ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : "Akses Sistem"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-blue-600 font-semibold hover:underline">← Kembali ke Halaman Publik</Link>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-xl text-gray-500">Memuat Data Dashboard...</div>;

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-300 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            Dashboard Admin 
            <span className="bg-red-100 text-red-600 text-[10px] uppercase px-2 py-0.5 rounded-full border border-red-200">Secured</span>
          </h1>
          <p className="text-gray-500 mt-1">Sistem Manajemen KulkasKuliner</p>
        </div>
        <div className="flex items-center flex-wrap gap-4 w-full md:w-auto">
          <div className="bg-green-100 border border-green-300 px-5 py-2 rounded-lg flex-1 md:flex-none text-right shadow-sm">
            <span className="block text-xs font-bold text-green-700 uppercase tracking-wider mb-0.5">Total Pendapatan</span>
            <span className="block text-xl font-black text-green-800">Rp {totalRevenue.toLocaleString('id-ID')}</span>
          </div>
          <button onClick={handleLogout} className="bg-red-100 text-red-700 border border-red-300 px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors shadow-sm text-center">Kunci Keluar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* KOLOM KIRI: INVENTORI */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <div className="flex justify-between items-center mb-5 border-b pb-2">
            <h2 className="text-xl font-bold text-gray-800">Manajemen Inventori</h2>
            <button onClick={() => setIsAdding(!isAdding)} className="bg-green-600 text-white px-3 py-1 text-sm font-bold rounded hover:bg-green-700 transition-colors shadow-sm">
              {isAdding ? "Batal" : "+ Tambah Produk"}
            </button>
          </div>

          {/* FORM TAMBAH PRODUK */}
          {isAdding && (
            <form onSubmit={handleAddProduct} className="mb-6 bg-green-50 p-4 border border-green-200 rounded-lg space-y-3 shadow-inner">
              <input type="text" placeholder="Nama Produk" required 
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none transition-shadow" 
                value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
              />
              <div className="flex gap-2">
                <input type="number" placeholder="Harga (Rp)" required min="1"
                  className="w-1/2 p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none transition-shadow" 
                  value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: parseInt(e.target.value)})} 
                />
                <input type="number" placeholder="Stok" required min="0"
                  className="w-1/2 p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none transition-shadow" 
                  value={newProduct.stock || ''} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} 
                />
              </div>
              <input type="url" placeholder="URL Foto Absolut (Raw GitHub)" 
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none transition-shadow" 
                value={newProduct.image_url} onChange={e => setNewProduct({...newProduct, image_url: e.target.value})} 
              />
              <button type="submit" className="w-full bg-green-600 text-white font-bold py-2.5 rounded-lg text-sm hover:bg-green-700 transition-colors shadow-sm">Simpan Produk Baru</button>
            </form>
          )}

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {products.map((prod) => (
              <div key={prod.id} className={`p-4 border rounded-xl flex flex-col gap-3 transition-colors ${!prod.is_active ? 'bg-gray-100 opacity-70' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}>
                
                {/* FORM EDIT PRODUK */}
                {editingId === prod.id ? (
                  <div className="space-y-2 bg-blue-50/50 p-2 -mx-2 rounded-lg">
                    <input type="text" placeholder="Nama Produk"
                      className="w-full p-2 border border-gray-300 rounded text-sm font-bold bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} 
                    />
                    <div className="flex gap-2">
                      <input type="number" placeholder="Harga"
                        className="w-1/2 p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={editForm.price} onChange={e => setEditForm({...editForm, price: parseInt(e.target.value)})} 
                      />
                      <input type="number" placeholder="Stok"
                        className="w-1/2 p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={editForm.stock} onChange={e => setEditForm({...editForm, stock: parseInt(e.target.value)})} 
                      />
                    </div>
                    <input type="text" placeholder="URL Foto Absolut" 
                      className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={editForm.image_url} onChange={e => setEditForm({...editForm, image_url: e.target.value})} 
                    />
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => saveEditProduct(prod.id)} className="bg-blue-600 text-white px-3 py-2 text-xs font-bold rounded-lg flex-1 hover:bg-blue-700 transition-colors shadow-sm">Simpan</button>
                      <button onClick={() => setEditingId(null)} className="bg-gray-200 text-gray-800 px-3 py-2 text-xs font-bold rounded-lg flex-1 hover:bg-gray-300 transition-colors">Batal</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-gray-900 leading-tight truncate">{prod.name}</h3>
                        <div className="flex items-center flex-wrap gap-2 mt-1.5">
                          <span className="text-xs font-bold text-blue-700">Rp {prod.price.toLocaleString('id-ID')}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${prod.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>SISA: {prod.stock}</span>
                          {!prod.is_active && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-800 text-white">DIARSIPKAN</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-3 mt-1 border-t border-gray-100">
                      <button onClick={() => { setEditingId(prod.id); setEditForm({ name: prod.name, price: prod.price, stock: prod.stock, image_url: prod.image_url }); }} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">Edit Item</button>
                      <span className="text-gray-300">|</span>
                      <button onClick={() => toggleProductActive(prod.id, prod.is_active)} className={`text-xs font-bold transition-colors ${prod.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}>
                        {prod.is_active ? 'Sembunyikan' : 'Tampilkan Publik'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* KOLOM KANAN: PESANAN */}
        <div className="lg:col-span-7 space-y-5">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Antrean Pesanan Masuk</h2>
          {orders.length === 0 ? (
             <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-500 font-medium">Belum ada pesanan masuk hari ini.</p>
             </div>
          ) : (
            orders.map((order) => (
               <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md">
                <div className="p-5 md:w-2/5 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50">
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-1 rounded block w-fit mb-3 tracking-wider">{order.order_number}</span>
                  <h2 className="text-base font-bold text-gray-900 leading-tight">{order.customer_name}</h2>
                  <p className="text-sm font-semibold text-gray-600 mt-1 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                    {order.customer_phone}
                  </p>
                  <div className="mt-4 text-xs text-gray-700 bg-white p-3 border border-gray-100 rounded-lg shadow-sm">
                    <span className="block font-black text-[10px] text-gray-400 mb-1">ALAMAT PENGIRIMAN:</span>
                    {order.shipping_address}
                  </div>
                </div>
                <div className="p-5 md:w-3/5 flex flex-col justify-between">
                  <div>
                    <ul className="space-y-2 mb-4">
                      {order.order_items.map((item) => (
                        <li key={item.id} className="flex justify-between items-start text-sm">
                          <span className="font-medium text-gray-800 pr-4"><span className="font-bold text-blue-600">{item.quantity}x</span> {item.products?.name}</span>
                          <span className="font-bold text-gray-900 whitespace-nowrap">Rp {(item.quantity * item.price_at_time).toLocaleString('id-ID')}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between items-center pt-3 border-t border-dashed border-gray-300">
                      <span className="font-bold text-gray-500 text-sm tracking-wide">TOTAL TAGIHAN</span>
                      <span className="text-lg font-black text-blue-700">Rp {order.total_amount.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <div className="mt-5 bg-gray-50/80 p-3 rounded-lg border border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <span className={`px-2.5 py-1.5 rounded text-[10px] font-black uppercase tracking-wider shadow-sm ${ order.status === 'unpaid' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : order.status === 'canceled' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-green-100 text-green-800 border border-green-200' }`}>
                      {order.status}
                    </span>
                    <div className="flex gap-2">
                      {order.status === 'unpaid' && ( <button onClick={() => updateOrderStatus(order.id, 'paid')} className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm focus:ring-2 focus:ring-blue-400 outline-none">Set Lunas</button> )}
                      {order.status !== 'canceled' && order.status !== 'completed' && ( <button onClick={() => updateOrderStatus(order.id, 'canceled')} className="bg-white text-red-600 border border-red-200 px-4 py-1.5 rounded text-xs font-bold hover:bg-red-50 transition-colors shadow-sm focus:ring-2 focus:ring-red-400 outline-none">Batalkan</button> )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}