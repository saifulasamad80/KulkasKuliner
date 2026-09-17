"use client";

import type { Order } from '@/hooks/useAdminData';
import OrderCard from './OrderCard';

type OrdersPanelProps = {
  orders: Order[];
  updateOrderStatus: (orderId: string, newStatus: string) => Promise<void>;
};

export default function OrdersPanel({ orders, updateOrderStatus }: OrdersPanelProps) {
  const sortedOrders = [...orders].sort((left, right) => {
    if (left.status === 'unpaid' && right.status !== 'unpaid') return -1;
    if (left.status !== 'unpaid' && right.status === 'unpaid') return 1;
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });
  const pendingOrderCount = orders.filter((order) => order.status === 'unpaid').length;

  const handleUpdateStatus = (orderId: string, status: string) => {
    void updateOrderStatus(orderId, status).catch((error: unknown) =>
      alert(error instanceof Error ? error.message : 'Status gagal diperbarui.')
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 className="text-xl font-bold text-gray-800">Pembelian</h3>
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
          <OrderCard key={order.id} order={order} onUpdateStatus={(status) => handleUpdateStatus(order.id, status)} />
        ))
      )}
    </div>
  );
}
