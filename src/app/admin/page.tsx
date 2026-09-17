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
    orders, products, totalRevenue, isLoading,
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
    <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50">
      <AdminHeader totalRevenue={totalRevenue} onLogout={logout} />

      {activeModule === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DashboardModuleCard
            icon="🧾"
            title="Modul Pesanan"
            description={pendingOrderCount > 0 ? `${pendingOrderCount} pesanan menunggu verifikasi` : 'Tidak ada pesanan yang menunggu verifikasi'}
            theme="cyan"
            onClick={() => setActiveModule('pesanan')}
          />
          <DashboardModuleCard
            icon="🍱"
            title="Modul Menu"
            description={`${activeMenuCount} menu aktif dari ${products.length} total produk`}
            theme="green"
            onClick={() => setActiveModule('menu')}
          />
          <DashboardModuleCard
            icon="📢"
            title="Modul Iklan"
            description="Generator konten promosi WhatsApp & Instagram"
            theme="purple"
            onClick={() => setActiveModule('iklan')}
          />
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setActiveModule(null)}
            className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span aria-hidden="true">←</span> Kembali ke Menu
          </button>

          {activeModule === 'pesanan' && (
            <DashboardModule title="Modul Pesanan">
              <OrdersPanel orders={orders} updateOrderStatus={updateOrderStatus} />
            </DashboardModule>
          )}

          {activeModule === 'menu' && (
            <DashboardModule title="Modul Menu">
              <InventoryPanel
                products={products}
                createProduct={createProduct}
                updateProduct={updateProduct}
                toggleProductActive={toggleProductActive}
              />
            </DashboardModule>
          )}

          {activeModule === 'iklan' && (
            <DashboardModule title="Modul Iklan">
              <WhatsAppAdGenerator products={products} />
              <SocialContentGenerator products={products} />
            </DashboardModule>
          )}
        </div>
      )}
    </main>
  );
}
