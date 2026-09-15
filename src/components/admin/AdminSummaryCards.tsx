"use client";

import type { Product } from '@/lib/types';
import type { Order } from '@/hooks/useAdminData';

type AdminSummaryCardsProps = {
  products: Product[];
  orders: Order[];
  activeTab: AdminDashboardTab;
  onTabChange: (tab: AdminDashboardTab) => void;
};

export type AdminDashboardTab = 'iklan' | 'pembelian' | 'menu-aktif';

type SummaryCardProps = {
  eyebrow: string;
  title: string;
  value: string;
  detail: string;
  tab: AdminDashboardTab;
  icon: string;
  className: string;
  iconClassName: string;
  isActive: boolean;
  onSelect: (tab: AdminDashboardTab) => void;
};

function SummaryCard({
  eyebrow,
  title,
  value,
  detail,
  tab,
  icon,
  className,
  iconClassName,
  isActive,
  onSelect,
}: SummaryCardProps) {
  return (
    <button
      type="button"
      id={`${tab}-tab`}
      role="tab"
      aria-selected={isActive}
      aria-controls={`${tab}-panel`}
      onClick={() => onSelect(tab)}
      className={`group w-full rounded-2xl border p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${className} ${isActive ? 'ring-2 ring-gray-900 ring-offset-2' : 'opacity-75 hover:opacity-100'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] opacity-70">{eyebrow}</p>
          <h2 className="mt-2 text-xl font-black text-gray-900">{title}</h2>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl ${iconClassName}`} aria-hidden="true">
          {icon}
        </span>
      </div>

      <p className="mt-5 text-3xl font-black text-gray-900">{value}</p>
      <p className="mt-1 min-h-10 text-sm font-medium leading-5 text-gray-600">{detail}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-gray-800">
        {isActive ? 'Sedang dibuka' : 'Buka bagian ini'} <span aria-hidden="true">{isActive ? '●' : '→'}</span>
      </span>
    </button>
  );
}

export default function AdminSummaryCards({ products, orders, activeTab, onTabChange }: AdminSummaryCardsProps) {
  const activeProducts = products.filter((product) => product.is_active);
  const availableProducts = activeProducts.filter((product) => product.stock > 0);
  const lowStockProducts = activeProducts.filter((product) => product.stock <= 5);
  const pendingOrders = orders.filter((order) => order.status === 'unpaid');

  return (
    <section aria-labelledby="admin-summary-title" className="mb-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-500">Ringkasan cepat</p>
          <h2 id="admin-summary-title" className="mt-1 text-2xl font-black text-gray-900">Pusat kendali toko</h2>
        </div>
        <p className="text-xs font-medium text-gray-500">Pilih kotak buat menampilkan isi bagiannya.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3" role="tablist" aria-label="Bagian dashboard admin">
        <SummaryCard
          eyebrow="Marketing"
          title="Iklan"
          value={`${availableProducts.length} menu`}
          detail={`${availableProducts.length} menu aktif siap dipromosikan${activeProducts.length !== availableProducts.length ? ` dari ${activeProducts.length} menu aktif` : ''}.`}
          tab="iklan"
          icon="✦"
          className="border-green-200 bg-linear-to-br from-green-50 via-white to-emerald-50 focus:ring-green-400"
          iconClassName="bg-green-100 text-green-700"
          isActive={activeTab === 'iklan'}
          onSelect={onTabChange}
        />

        <SummaryCard
          eyebrow="Operasional"
          title="Pembelian"
          value={`${orders.length} pesanan`}
          detail={pendingOrders.length > 0 ? `${pendingOrders.length} pesanan menunggu verifikasi pembayaran.` : 'Nggak ada pesanan yang menunggu verifikasi pembayaran.'}
          tab="pembelian"
          icon="🛒"
          className="border-blue-200 bg-linear-to-br from-blue-50 via-white to-sky-50 focus:ring-blue-400"
          iconClassName="bg-blue-100 text-blue-700"
          isActive={activeTab === 'pembelian'}
          onSelect={onTabChange}
        />

        <SummaryCard
          eyebrow="Katalog"
          title="Menu Aktif"
          value={`${activeProducts.length} menu aktif`}
          detail={lowStockProducts.length > 0 ? `${lowStockProducts.length} menu perlu dicek karena stoknya menipis (≤ 5).` : 'Semua menu aktif punya stok di atas batas minimum.'}
          tab="menu-aktif"
          icon="📦"
          className="border-orange-200 bg-linear-to-br from-orange-50 via-white to-amber-50 focus:ring-orange-400"
          iconClassName="bg-orange-100 text-orange-700"
          isActive={activeTab === 'menu-aktif'}
          onSelect={onTabChange}
        />
      </div>
    </section>
  );
}
