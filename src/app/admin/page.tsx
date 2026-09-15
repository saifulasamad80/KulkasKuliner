"use client";

import { useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminData } from '@/hooks/useAdminData';
import AdminLoginScreen from '@/components/admin/AdminLoginScreen';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSummaryCards, { type AdminDashboardTab } from '@/components/admin/AdminSummaryCards';
import InventoryPanel from '@/components/admin/InventoryPanel';
import OrdersPanel from '@/components/admin/OrdersPanel';
import WhatsAppAdGenerator from '@/components/WhatsAppAdGenerator';
import SocialContentGenerator from '@/components/SocialContentGenerator';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminDashboardTab>('iklan');
  const { isAuthenticated, isCheckingAuth, isVerifying, pinInput, setPinInput, login, logout } = useAdminAuth();
  const {
    orders, products, totalRevenue, isLoading,
    createProduct, updateProduct, updateOrderStatus, toggleProductActive,
  } = useAdminData(isAuthenticated);

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

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50">
      <AdminHeader totalRevenue={totalRevenue} onLogout={logout} />
      <AdminSummaryCards
        products={products}
        orders={orders}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <section
        id="iklan-panel"
        role="tabpanel"
        aria-labelledby="iklan-tab"
        hidden={activeTab !== 'iklan'}
      >
        <WhatsAppAdGenerator products={products} />
        <SocialContentGenerator products={products} />
      </section>

      <section
        id="pembelian-panel"
        role="tabpanel"
        aria-labelledby="pembelian-tab"
        hidden={activeTab !== 'pembelian'}
      >
        <OrdersPanel orders={orders} updateOrderStatus={updateOrderStatus} />
      </section>

      <section
        id="menu-aktif-panel"
        role="tabpanel"
        aria-labelledby="menu-aktif-tab"
        hidden={activeTab !== 'menu-aktif'}
      >
        <InventoryPanel
          products={products}
          createProduct={createProduct}
          updateProduct={updateProduct}
          toggleProductActive={toggleProductActive}
        />
      </section>
    </main>
  );
}
