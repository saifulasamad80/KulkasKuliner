"use client";

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAdminData } from '@/hooks/useAdminData';

export default function AdminDashboard() {
  // SEDOT DATA DARI HOOK: Logic terpisah 100% dari UI
  const { 
    orders, products, totalRevenue, isLoading, 
    fetchData, updateOrderStatus, toggleProductActive 
  } = useAdminData();
  
  // State UI Lokal (Hanya untuk form, tidak mengurus Database)
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: 0, stock: 0, image_url: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: 0, stock: 0, image_url: '' });

  // Fungsi spesifik form masih dipertahankan di UI karena memanipulasi local state input
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

  if (isLoading) return <div className="p-10 text-center font-bold text-xl">Memuat Dashboard...</div>;

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-300 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-500 mt-1">Sistem Manajemen KulkasKuliner (Refactored)</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-green-100 border border-green-300 px-5 py-2 rounded-lg flex-1 md:flex-none text-right">
            <span className="block text-xs font-bold text-green-700 uppercase tracking-wider mb-0.5">Total Pendapatan</span>
            <span className="block text-xl font-black text-green-800">Rp {totalRevenue.toLocaleString('id-ID')}</span>
          </div>
          <Link href="/" className="bg-gray-800 text-white px-5 py-3 rounded-lg font-bold hover:bg-gray-900 transition-colors">Lihat Publik</Link>
        </div>
      </div>

      {/* STRUKTUR GRID TETAP SAMA SEPERTI SEBELUMNYA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* KOLOM KIRI: INVENTORI */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <div className="flex justify-between items-center mb-5 border-b pb-2">
            <h2 className="text-xl font-bold text-gray-800">Manajemen Inventori</h2>
            <button onClick={() => setIsAdding(!isAdding)} className="bg-green-600 text-white px-3 py-1 text-sm font-bold rounded hover:bg-green-700">
              {isAdding ? "Batal" : "+ Tambah Produk"}
            </button>
          </div>

          {isAdding && (
            <form onSubmit={handleAddProduct} className="mb-6 bg-green-50 p-4 border border-green-200 rounded-lg space-y-3">
              <input type="text" placeholder="Nama Produk" required className="w-full p-2 border rounded text-sm" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              <div className="flex gap-2">
                <input type="number" placeholder="Harga" required className="w-1/2 p-2 border rounded text-sm" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: parseInt(e.target.value)})} />
                <input type="number" placeholder="Stok" required className="w-1/2 p-2 border rounded text-sm" value={newProduct.stock || ''} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} />
              </div>
              <input type="url" placeholder="URL Foto" className="w-full p-2 border rounded text-sm" value={newProduct.image_url} onChange={e => setNewProduct({...newProduct, image_url: e.target.value})} />
              <button type="submit" className="w-full bg-green-600 text-white font-bold py-2 rounded text-sm">Simpan</button>
            </form>
          )}

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {products.map((prod) => (
              <div key={prod.id} className={`p-4 border rounded-lg flex flex-col gap-3 ${!prod.is_active ? 'bg-gray-100 opacity-70' : 'bg-white border-gray-200'}`}>
                {editingId === prod.id ? (
                  <div className="space-y-2">
                    <input type="text" className="w-full p-1.5 border rounded text-sm font-bold" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                    <div className="flex gap-2">
                      <input type="number" className="w-1/2 p-1.5 border rounded text-sm" value={editForm.price} onChange={e => setEditForm({...editForm, price: parseInt(e.target.value)})} />
                      <input type="number" className="w-1/2 p-1.5 border rounded text-sm" value={editForm.stock} onChange={e => setEditForm({...editForm, stock: parseInt(e.target.value)})} />
                    </div>
                    <input type="text" placeholder="URL Foto" className="w-full p-1.5 border rounded text-sm" value={editForm.image_url} onChange={e => setEditForm({...editForm, image_url: e.target.value})} />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => saveEditProduct(prod.id)} className="bg-blue-600 text-white px-3 py-1 text-xs font-bold rounded flex-1">Simpan</button>
                      <button onClick={() => setEditingId(null)} className="bg-gray-300 text-gray-800 px-3 py-1 text-xs font-bold rounded flex-1">Batal</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <img src={prod.image_url} alt="thumbnail" className="w-12 h-12 rounded object-cover border border-gray-300" />
                      <div className="flex-1">
                        <h3 className="font-bold text-sm text-gray-800 leading-tight">{prod.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-blue-600">Rp {prod.price.toLocaleString('id-ID')}</span>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${prod.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>Sisa: {prod.stock}</span>
                          {!prod.is_active && <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-gray-800 text-white">DIARSIPKAN</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button onClick={() => { setEditingId(prod.id); setEditForm({ name: prod.name, price: prod.price, stock: prod.stock, image_url: prod.image_url }); }} className="text-xs font-bold text-blue-600 hover:underline">Edit Info</button>
                      <span className="text-gray-300">|</span>
                      <button onClick={() => toggleProductActive(prod.id, prod.is_active)} className={`text-xs font-bold hover:underline ${prod.is_active ? 'text-red-500' : 'text-green-600'}`}>
                        {prod.is_active ? 'Arsipkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* KOLOM KANAN: PESANAN TETAP SAMA */}
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Antrean Pesanan Masuk</h2>
          {orders.length === 0 ? (
             <div className="bg-white p-10 text-center rounded-xl shadow-sm border border-gray-200 text-gray-500 font-medium">Belum ada pesanan.</div>
          ) : (
            orders.map((order) => (
               <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                <div className="p-4 md:w-2/5 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50">
                  <span className="bg-blue-100 text-blue-800 text-xs font-black px-2 py-1 rounded block w-fit mb-2">{order.order_number}</span>
                  <h2 className="text-base font-bold text-gray-900">{order.customer_name}</h2>
                  <p className="text-xs font-semibold text-gray-600 mt-1">📞 {order.customer_phone}</p>
                  <p className="mt-2 text-xs text-gray-600 bg-white p-2 border rounded"><strong>ALAMAT:</strong> {order.shipping_address}</p>
                </div>
                <div className="p-4 md:w-3/5 flex flex-col justify-between">
                  <div>
                    <ul className="space-y-1 mb-2">
                      {order.order_items.map((item) => (
                        <li key={item.id} className="flex justify-between items-center text-xs">
                          <span className="font-medium text-gray-700">{item.quantity}x {item.products?.name}</span>
                          <span className="font-bold">Rp {(item.quantity * item.price_at_time).toLocaleString('id-ID')}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="font-bold text-gray-600 text-sm">Total</span>
                      <span className="text-base font-black text-blue-600">Rp {order.total_amount.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  <div className="mt-3 bg-gray-50 p-2 rounded border border-gray-200 flex flex-wrap items-center justify-between gap-2">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${ order.status === 'unpaid' ? 'bg-yellow-100 text-yellow-800' : order.status === 'canceled' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800' }`}>{order.status}</span>
                    <div className="flex gap-2">
                      {order.status === 'unpaid' && ( <button onClick={() => updateOrderStatus(order.id, 'paid')} className="bg-blue-600 text-white px-3 py-1 rounded text-[10px] font-bold hover:bg-blue-700">Set Paid</button> )}
                      {order.status !== 'canceled' && order.status !== 'completed' && ( <button onClick={() => updateOrderStatus(order.id, 'canceled')} className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded text-[10px] font-bold hover:bg-red-100">Cancel</button> )}
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