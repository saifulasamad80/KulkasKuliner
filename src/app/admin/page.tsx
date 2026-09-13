"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdminData } from '@/hooks/useAdminData';
import AdminPushSettings from '@/components/AdminPushSettings';

function getCustomerWhatsAppUrl(phone: string, orderNumber: string) {
  const normalized = phone.replace(/\D/g, '').replace(/^0/, '62');
  if (!/^62\d{8,13}$/.test(normalized)) return null;

  const message = `Halo, terkait pesanan ${orderNumber} di KulkasKuliner. Ada informasi mengenai produk/pesanan Anda.`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  const {
    orders, products, totalRevenue, isLoading,
    createProduct, updateProduct, updateOrderStatus, toggleProductActive
  } = useAdminData(isAuthenticated);

  const sortedOrders = [...orders].sort((left, right) => {
    if (left.status === 'unpaid' && right.status !== 'unpaid') return -1;
    if (left.status !== 'unpaid' && right.status === 'unpaid') return 1;
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });
  const pendingOrderCount = orders.filter((order) => order.status === 'unpaid').length;

  const [isAdding, setIsAdding] = useState(false);

  const [newProduct, setNewProduct] = useState({ name: '', price: 0, stock: 0, image_url: '', description: '', menu_id: null as string | null, menu_name: '', variant_name: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: 0, stock: 0, image_url: '', description: '', menu_id: null as string | null, menu_name: '', variant_name: '' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newPendingImageUrl, setNewPendingImageUrl] = useState<string | null>(null);
  const [editPendingImageUrl, setEditPendingImageUrl] = useState<string | null>(null);
  const [editOriginalImageUrl, setEditOriginalImageUrl] = useState('');

  const deleteMenuImage = async (url: string) => {
    if (!url || !url.includes('/storage/v1/object/public/menu-images/')) return;
    const response = await fetch('/api/admin/uploads/menu-image', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!response.ok && response.status !== 409) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      console.error(result?.error || 'Cleanup foto menu gagal.');
    }
  };

  const changeNewImageUrl = (url: string) => {
    const pendingUrl = newPendingImageUrl;
    setNewProduct((current) => ({ ...current, image_url: url }));
    if (pendingUrl && pendingUrl !== url) {
      setNewPendingImageUrl(null);
      void deleteMenuImage(pendingUrl);
    }
  };

  const changeEditImageUrl = (url: string) => {
    const pendingUrl = editPendingImageUrl;
    setEditForm((current) => ({ ...current, image_url: url }));
    if (pendingUrl && pendingUrl !== url) {
      setEditPendingImageUrl(null);
      void deleteMenuImage(pendingUrl);
    }
  };

  const uploadImage = async (file: File, target: 'new' | 'edit') => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/admin/uploads/menu-image', { method: 'POST', body: formData });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || 'Foto gagal diunggah.');
      if (target === 'new') {
        const previousPendingUrl = newPendingImageUrl;
        setNewProduct((current) => ({ ...current, image_url: result.url as string }));
        setNewPendingImageUrl(result.url);
        if (previousPendingUrl && previousPendingUrl !== result.url) void deleteMenuImage(previousPendingUrl);
      } else {
        const previousPendingUrl = editPendingImageUrl;
        setEditForm((current) => ({ ...current, image_url: result.url as string }));
        setEditPendingImageUrl(result.url);
        if (previousPendingUrl && previousPendingUrl !== result.url) void deleteMenuImage(previousPendingUrl);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Foto gagal diunggah.');
    } finally {
      setUploadingImage(false);
    }
  };

  const cancelNewProduct = async () => {
    if (newPendingImageUrl) await deleteMenuImage(newPendingImageUrl);
    setNewPendingImageUrl(null);
    setNewProduct({ name: '', price: 0, stock: 0, image_url: '', description: '', menu_id: null, menu_name: '', variant_name: '' });
    setIsAdding(false);
  };

  const cancelEditProduct = async () => {
    if (editPendingImageUrl) await deleteMenuImage(editPendingImageUrl);
    setEditPendingImageUrl(null);
    setEditOriginalImageUrl('');
    setEditingId(null);
  };

  const removeFormImage = async (target: 'new' | 'edit') => {
    if (target === 'new') {
      if (newPendingImageUrl) await deleteMenuImage(newPendingImageUrl);
      setNewPendingImageUrl(null);
      setNewProduct((current) => ({ ...current, image_url: '' }));
      return;
    }
    if (editPendingImageUrl) await deleteMenuImage(editPendingImageUrl);
    setEditPendingImageUrl(null);
    setEditForm((current) => ({ ...current, image_url: '' }));
  };

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      try {
        const response = await fetch('/api/admin/auth', { cache: 'no-store' });
        const data = (await response.json()) as { authenticated?: boolean };
        if (active) setIsAuthenticated(data.authenticated === true);
      } catch (error) {
        if (active) console.error('Sesi admin gagal diverifikasi:', error);
      } finally {
        if (active) setIsCheckingAuth(false);
      }
    };

    void checkSession();
    return () => {
      active = false;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        alert("PIN Akses Ditolak!");
        setPinInput("");
      }
    } catch (error) {
      console.error('Login admin gagal:', error);
      alert("Kesalahan sistem saat memverifikasi PIN.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    void fetch('/api/admin/auth', { method: 'DELETE' });
    setIsAuthenticated(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || newProduct.price <= 0) return alert("Nama dan Harga wajib diisi valid!");
    try {
      await createProduct(newProduct);
      alert("Produk ditambah!");
      setNewPendingImageUrl(null);
      setIsAdding(false);
      setNewProduct({ name: '', price: 0, stock: 0, image_url: '', description: '', menu_id: null, menu_name: '', variant_name: '' });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Produk gagal disimpan.');
    }
  };

  const saveEditProduct = async (id: string) => {
    try {
      await updateProduct(id, {
        name: editForm.name,
        price: editForm.price,
        stock: editForm.stock,
        image_url: editForm.image_url,
        description: editForm.description,
        menu_id: editForm.menu_id,
        variant_name: editForm.variant_name || null,
        menu_name: editForm.menu_name || null,
      });
      const obsoleteImageUrl = editOriginalImageUrl && editOriginalImageUrl !== editForm.image_url
        ? editOriginalImageUrl
        : '';
      const unusedPendingImageUrl = editPendingImageUrl && editPendingImageUrl !== editForm.image_url
        ? editPendingImageUrl
        : '';
      setEditPendingImageUrl(null);
      setEditOriginalImageUrl('');
      setEditingId(null);
      if (obsoleteImageUrl) await deleteMenuImage(obsoleteImageUrl);
      if (unusedPendingImageUrl) await deleteMenuImage(unusedPendingImageUrl);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Produk gagal diperbarui.');
    }
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
          <AdminPushSettings />
          <button onClick={handleLogout} className="bg-red-100 text-red-700 border border-red-300 px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors shadow-sm text-center">Kunci Keluar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* KOLOM KIRI: INVENTORI */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <div className="flex justify-between items-center mb-5 border-b pb-2">
            <h2 className="text-xl font-bold text-gray-800">Manajemen Inventori</h2>
            <button onClick={() => { if (isAdding) void cancelNewProduct(); else setIsAdding(true); }} disabled={uploadingImage} className="bg-green-600 text-white px-3 py-1 text-sm font-bold rounded hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50">
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
              <input type="text" placeholder="Nama varian (opsional, contoh: Pedas)"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                value={newProduct.variant_name} onChange={e => setNewProduct({...newProduct, variant_name: e.target.value})}
              />
              <input type="text" placeholder="Nama menu induk (untuk mengelompokkan varian)"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                value={newProduct.menu_name} onChange={e => setNewProduct({...newProduct, menu_name: e.target.value})}
              />
              <div className="relative">
                <textarea placeholder="Deskripsi Produk (Maksimal 90 huruf biar gak kepotong)" rows={2} maxLength={90}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none transition-shadow pr-12"
                  value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                />
                <span className={`absolute bottom-3 right-3 text-[10px] font-black ${newProduct.description?.length >= 90 ? 'text-red-600 animate-pulse' : 'text-gray-400'}`}>
                  {newProduct.description?.length || 0}/90
                </span>
              </div>
              <div className="flex gap-2">
                <input type="number" placeholder="Harga (Rp)" required min="1"
                  className="w-1/2 p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none transition-shadow"
                  value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: parseInt(e.target.value)})}
                />
                <input type="number" placeholder="Stok Gudang" required min="0"
                  className="w-1/2 p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none transition-shadow"
                  value={newProduct.stock || ''} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})}
                />
              </div>
              <label className="block text-xs font-bold text-gray-600">Foto menu (JPG/PNG/WebP, maks. 5 MB)
                <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingImage} onChange={e => { const file = e.target.files?.[0]; if (file) void uploadImage(file, 'new'); }} className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900" />
              </label>
              <input type="url" placeholder="URL foto hasil upload"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none transition-shadow"
                value={newProduct.image_url} onChange={e => changeNewImageUrl(e.target.value)}
              />
              {newProduct.image_url && (
                <button type="button" disabled={uploadingImage} onClick={() => void removeFormImage('new')} className="w-full border border-red-200 bg-white text-red-600 font-bold py-2 rounded-lg text-xs hover:bg-red-50 disabled:opacity-50">Hapus Foto dari Form</button>
              )}
              <button type="submit" className="w-full bg-green-600 text-white font-bold py-2.5 rounded-lg text-sm hover:bg-green-700 transition-colors shadow-sm">Simpan Produk Baru</button>
            </form>
          )}

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {products.map((prod) => (
              <div key={prod.id} className={`p-4 border rounded-xl flex flex-col gap-3 transition-colors ${!prod.is_active ? 'bg-gray-100 opacity-70' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}>

                {/* FORM EDIT PRODUK */}
                {editingId === prod.id ? (
                  <div className="space-y-2 bg-blue-50/50 p-2 -mx-2 rounded-lg border border-blue-100">
                    <input type="text" placeholder="Nama Produk"
                      className="w-full p-2 border border-gray-300 rounded text-sm font-bold bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}
                    />
                    <input type="text" placeholder="Nama varian"
                      className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={editForm.variant_name} onChange={e => setEditForm({...editForm, variant_name: e.target.value})}
                    />
                    <input type="text" placeholder="Nama menu induk"
                      className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={editForm.menu_name} onChange={e => setEditForm({...editForm, menu_name: e.target.value})}
                    />
                    <div className="relative">
                      <textarea placeholder="Deskripsi (Maksimal 90 huruf)" rows={2} maxLength={90}
                        className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none pr-12"
                        value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})}
                      />
                      <span className={`absolute bottom-3 right-3 text-[10px] font-black ${editForm.description?.length >= 90 ? 'text-red-600 animate-pulse' : 'text-gray-400'}`}>
                        {editForm.description?.length || 0}/90
                      </span>
                    </div>
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
                    <label className="block text-xs font-bold text-gray-600">Ganti foto
                      <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingImage} onChange={e => { const file = e.target.files?.[0]; if (file) void uploadImage(file, 'edit'); }} className="mt-1 w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900" />
                    </label>
                    <input type="text" placeholder="URL Foto"
                      className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={editForm.image_url} onChange={e => changeEditImageUrl(e.target.value)}
                    />
                      {editForm.image_url && (
                        <button type="button" disabled={uploadingImage} onClick={() => void removeFormImage('edit')} className="w-full border border-red-200 bg-white text-red-600 font-bold py-2 rounded-lg text-xs hover:bg-red-50 disabled:opacity-50">Hapus Foto</button>
                      )}
                    <div className="flex gap-2 mt-3">
                        <button disabled={uploadingImage} onClick={() => void saveEditProduct(prod.id)} className="bg-blue-600 text-white px-3 py-2 text-xs font-bold rounded-lg flex-1 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">Simpan Perubahan</button>
                        <button disabled={uploadingImage} onClick={() => void cancelEditProduct()} className="bg-gray-200 text-gray-800 px-3 py-2 text-xs font-bold rounded-lg flex-1 hover:bg-gray-300 transition-colors disabled:opacity-50">Batal</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* TAMPILAN ITEM DI ADMIN */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        <img src={prod.image_url || '/icon.png'} alt={prod.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-gray-900 leading-tight truncate">{prod.name}</h3>
                        <div className="flex items-center flex-wrap gap-2 mt-1.5">
                          <span className="text-xs font-bold text-blue-700">Rp {prod.price.toLocaleString('id-ID')}</span>

                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${prod.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            SISA: {prod.stock}
                          </span>
                          {!prod.is_active && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-800 text-white">DIARSIPKAN</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-3 mt-1 border-t border-gray-100">
                      <button
                        onClick={() => {
                          if (editingId && editingId !== prod.id && editPendingImageUrl) void deleteMenuImage(editPendingImageUrl);
                          setEditingId(prod.id);
                          setEditPendingImageUrl(null);
                          setEditOriginalImageUrl(prod.image_url || '');
                          setEditForm({
                            name: prod.name,
                            price: prod.price,
                            stock: prod.stock,
                            image_url: prod.image_url || '',
                            description: prod.description || ''
                            , menu_id: prod.menu_id || null
                            , menu_name: Array.isArray(prod.menus) ? prod.menus[0]?.name || '' : prod.menus?.name || ''
                            , variant_name: prod.variant_name || ''
                          });
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Edit Item
                      </button>
                      <span className="text-gray-300">|</span>
                      <button onClick={() => void toggleProductActive(prod.id, prod.is_active).catch((error: unknown) => alert(error instanceof Error ? error.message : 'Produk gagal diperbarui.'))} className={`text-xs font-bold transition-colors ${prod.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}>
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
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h2 className="text-xl font-bold text-gray-800">Antrean Pesanan Masuk</h2>
            <span className="text-xs font-semibold text-gray-500">Dashboard diperbarui otomatis setiap 15 detik</span>
          </div>
          {pendingOrderCount > 0 && (
            <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
              <strong>{pendingOrderCount} pesanan menunggu verifikasi pembayaran.</strong>{' '}
              Terima pembayaran hanya setelah transfer valid. Stok akan berkurang saat pesanan diterima.
            </div>
          )}
          {orders.length === 0 ? (
             <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-500 font-medium">Belum ada pesanan masuk hari ini.</p>
             </div>
          ) : (
            sortedOrders.map((order) => (
               <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md">
                <div className="p-5 md:w-2/5 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50">
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-1 rounded block w-fit mb-3 tracking-wider">{order.order_number}</span>
                  <h2 className="text-base font-bold text-gray-900 leading-tight">{order.customer_name}</h2>
                  <p className="text-sm font-semibold text-gray-600 mt-1 flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                    {order.customer_phone}
                  </p>
                  {getCustomerWhatsAppUrl(order.customer_phone, order.order_number) && (
                    <a
                      href={getCustomerWhatsAppUrl(order.customer_phone, order.order_number) as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Hubungi ${order.customer_name} via WhatsApp`}
                      className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-[11px] font-black text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                      <span aria-hidden="true">💬</span> Chat WhatsApp Pembeli
                    </a>
                  )}

                  <div className="mt-4 text-xs text-gray-700 bg-white p-3 border border-gray-100 rounded-lg shadow-sm">
                    <span className="block font-black text-[10px] text-gray-400 mb-1">ALAMAT PENGIRIMAN:</span>
                    {order.shipping_address}
                  </div>

                  {order.notes && order.notes.trim() !== '' && (
                    <div className="mt-2 text-xs text-yellow-800 bg-yellow-50 p-3 border border-yellow-200 rounded-lg shadow-sm">
                      <span className="block font-black text-[10px] text-yellow-600 mb-1">CATATAN:</span>
                      {order.notes}
                    </div>
                  )}
                </div>
                <div className="p-5 md:w-3/5 flex flex-col justify-between">
                  <div>
                    <ul className="space-y-2 mb-4">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, idx) => (
                          <li key={idx} className="flex justify-between items-start text-sm border-b border-gray-50 pb-2 last:border-0">
                            <span className="font-medium text-gray-800 pr-4">
                              <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mr-1">{item.quantity}x</span>
                              {item.menu_name || item.name}{item.variant_name ? ` (${item.variant_name})` : ''}
                            </span>
                            <span className="font-bold text-gray-900 whitespace-nowrap">
                              Rp {(item.quantity * item.price).toLocaleString('id-ID')}
                            </span>
                          </li>
                        ))
                      ) : (
                        order.order_items?.map((item) => (
                          <li key={item.id} className="flex justify-between items-start text-sm border-b border-gray-50 pb-2 last:border-0">
                            <span className="font-medium text-gray-800 pr-4">
                              <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mr-1">{item.quantity}x</span>
                              {item.products?.name}
                            </span>
                            <span className="font-bold text-gray-900 whitespace-nowrap">
                              Rp {(item.quantity * item.price_at_time).toLocaleString('id-ID')}
                            </span>
                          </li>
                        ))
                      )}
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
                      {order.status === 'unpaid' && ( <button onClick={() => void updateOrderStatus(order.id, 'paid').catch((error: unknown) => alert(error instanceof Error ? error.message : 'Status gagal diperbarui.'))} className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm focus:ring-2 focus:ring-blue-400 outline-none">Terima Pembayaran &amp; Kurangi Stok</button> )}
                      {order.status === 'unpaid' && ( <button onClick={() => void updateOrderStatus(order.id, 'canceled').catch((error: unknown) => alert(error instanceof Error ? error.message : 'Status gagal diperbarui.'))} className="bg-white text-red-600 border border-red-200 px-4 py-1.5 rounded text-xs font-bold hover:bg-red-50 transition-colors shadow-sm focus:ring-2 focus:ring-red-400 outline-none">Tolak Pesanan</button> )}
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
