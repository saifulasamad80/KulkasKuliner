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
    <div className="space-y-4 sm:space-y-5">
      <div className="mb-2 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <h3 className="text-lg font-black text-slate-900 sm:text-xl">Daftar Pembelian</h3>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
          Diperbarui tiap 15 detik
        </span>
      </div>
      {pendingOrderCount > 0 && (
        <div className="mb-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <span className="text-xl" aria-hidden="true">⚠️</span>
          <p>
            <strong className="block">{pendingOrderCount} pesanan menunggu verifikasi.</strong>
            Terima pembayaran cuma setelah transfer valid. Stok berkurang saat pesanan diterima.
          </p>
        </div>
      )}
      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
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
