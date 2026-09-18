"use client";

import { useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminData } from '@/hooks/useAdminData';
import AdminLoginScreen from '@/components/admin/AdminLoginScreen';
import AdminHeader from '@/components/admin/AdminHeader';
import DashboardModule from '@/components/admin/DashboardModule';
import DashboardModuleCard from '@/components/admin/DashboardModuleCard';
import InventoryPanel from '@/components/admin/InventoryPanel';
import OrdersPanel from '@/components/admin/OrdersPanel';
import WhatsAppAdGenerator from '@/components/WhatsAppAdGenerator';
import SocialContentGenerator from '@/components/SocialContentGenerator';

type ModuleKey = 'pesanan' | 'menu' | 'iklan';

export default function AdminDashboard() {
  const { isAuthenticated, isCheckingAuth, isVerifying, pinInput, setPinInput, login, logout } = useAdminAuth();
  const {
    orders, products, totalRevenue, favoriteMenus, isLoading,
    createProduct, updateProduct, updateOrderStatus, toggleProductActive,
  } = useAdminData(isAuthenticated);
  const [activeModule, setActiveModule] = useState<ModuleKey | null>(null);

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><p className="text-white">Verifikasi Keamanan...</p></div>;
  }

  if (!isAuthenticated) {
    return (
      <AdminLoginScreen
        pinInput={pinInput}
        isVerifying={isVerifying}
        onPinChange={setPinInput}
        onSubmit={login}
      />
    );
  }

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-xl text-gray-500">Memuat Data Dashboard...</div>;
  }

  const pendingOrderCount = orders.filter((order) => order.status === 'unpaid').length;
  const activeMenuCount = products.filter((product) => product.is_active).length;

  return (
    <main className="min-h-screen bg-[#f4f6f8]">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <AdminHeader totalRevenue={totalRevenue} onLogout={logout} />

        {activeModule === null ? (
          <section aria-labelledby="admin-module-heading">
            <div className="mb-5 flex items-end justify-between gap-4 px-1">
              <div>
                <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-red-600">Pusat Kendali</p>
                <h2 id="admin-module-heading" className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Mau kelola apa?
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Pilih satu modul untuk mulai bekerja.</p>
              </div>
              <span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm sm:inline-flex">
                3 modul aktif
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-5">
              <DashboardModuleCard
                icon="🧾"
                eyebrow={pendingOrderCount > 0 ? `${pendingOrderCount} perlu dicek` : 'Semua beres'}
                title="Modul Pesanan"
                description={pendingOrderCount > 0 ? `${pendingOrderCount} pesanan menunggu verifikasi pembayaran` : 'Tidak ada pesanan yang menunggu verifikasi'}
                theme="cyan"
                onClick={() => setActiveModule('pesanan')}
              />
              <DashboardModuleCard
                icon="🍱"
                eyebrow={`${activeMenuCount} menu tayang`}
                title="Modul Menu"
                description={`${activeMenuCount} menu aktif dari ${products.length} total produk`}
                theme="green"
                onClick={() => setActiveModule('menu')}
              />
              <DashboardModuleCard
                icon="📢"
                eyebrow="Siap promosi"
                title="Modul Iklan"
                description="Bikin konten promosi WhatsApp, Instagram, dan TikTok"
                theme="purple"
                onClick={() => setActiveModule('iklan')}
              />
            </div>
          </section>
        ) : (
          <section aria-label="Modul admin aktif">
            <button
              type="button"
              onClick={() => setActiveModule(null)}
              className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
            >
              <span className="text-lg leading-none" aria-hidden="true">←</span>
              Semua Modul
            </button>

            {activeModule === 'pesanan' && (
              <DashboardModule title="Modul Pesanan" subtitle="Verifikasi pembayaran dan pantau semua pesanan masuk.">
                <OrdersPanel orders={orders} updateOrderStatus={updateOrderStatus} />
              </DashboardModule>
            )}

            {activeModule === 'menu' && (
              <DashboardModule title="Modul Menu" subtitle="Atur produk, stok, harga, foto, dan status tayang.">
                <InventoryPanel
                  products={products}
                  createProduct={createProduct}
                  updateProduct={updateProduct}
                  toggleProductActive={toggleProductActive}
                />
              </DashboardModule>
            )}

            {activeModule === 'iklan' && (
              <DashboardModule title="Modul Iklan" subtitle="Siapkan materi promosi dari data katalog yang sedang aktif.">
                <WhatsAppAdGenerator products={products} />
                <SocialContentGenerator products={products} favoriteMenus={favoriteMenus} />
              </DashboardModule>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
