"use client";

import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminData } from '@/hooks/useAdminData';
import AdminLoginScreen from '@/components/admin/AdminLoginScreen';
import AdminHeader from '@/components/admin/AdminHeader';
import InventoryPanel from '@/components/admin/InventoryPanel';
import OrdersPanel from '@/components/admin/OrdersPanel';
import WhatsAppAdGenerator from '@/components/WhatsAppAdGenerator';
import SocialContentGenerator from '@/components/SocialContentGenerator';

export default function AdminDashboard() {
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

      <WhatsAppAdGenerator products={products} />
      <SocialContentGenerator products={products} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <InventoryPanel
          products={products}
          createProduct={createProduct}
          updateProduct={updateProduct}
          toggleProductActive={toggleProductActive}
        />
        <OrdersPanel orders={orders} updateOrderStatus={updateOrderStatus} />
      </div>
    </main>
  );
}
