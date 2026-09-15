"use client";

import type { Product } from '@/lib/types';
import type { Order } from '@/hooks/useAdminData';

type AdminSummaryCardsProps = {
  products: Product[];
  orders: Order[];
};

type SummaryCardProps = {
  eyebrow: string;
  title: string;
  value: string;
  detail: string;
  actionLabel: string;
  href: string;
  icon: string;
  className: string;
  iconClassName: string;
};

function SummaryCard({
  eyebrow,
  title,
  value,
  detail,
  actionLabel,
  href,
  icon,
  className,
  iconClassName,
}: SummaryCardProps) {
  return (
    <a
      href={href}
      className={`group rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`}
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
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-black text-gray-800 transition-transform group-hover:translate-x-1">
        {actionLabel} <span aria-hidden="true">→</span>
      </span>
    </a>
  );
}

export default function AdminSummaryCards({ products, orders }: AdminSummaryCardsProps) {
  const activeProducts = products.filter((product) => product.is_active);
  const availableProducts = activeProducts.filter((product) => product.stock > 0);
  const lowStockProducts = activeProducts.filter((product) => product.stock <= 5);
  const pendingOrders = orders.filter((order) => order.status === 'unpaid');

  return (
    <section aria-labelledby="admin-summary-title" className="mb-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-500">Ringkasan cepat</p>
          <h2 id="admin-summary-title" className="mt-1 text-2xl font-black text-gray-900">Pusat kendali toko</h2>
        </div>
        <p className="text-xs font-medium text-gray-500">Pilih kartu buat langsung lompat ke bagiannya.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          eyebrow="Marketing"
          title="Iklan"
          value={`${availableProducts.length} menu`}
          detail={`${availableProducts.length} menu aktif siap dipromosikan${activeProducts.length !== availableProducts.length ? ` dari ${activeProducts.length} menu aktif` : ''}.`}
          actionLabel="Buka generator iklan"
          href="#iklan"
          icon="✦"
          className="border-green-200 bg-linear-to-br from-green-50 via-white to-emerald-50 focus:ring-green-400"
          iconClassName="bg-green-100 text-green-700"
        />

        <SummaryCard
          eyebrow="Operasional"
          title="Pembelian"
          value={`${orders.length} pesanan`}
          detail={pendingOrders.length > 0 ? `${pendingOrders.length} pesanan menunggu verifikasi pembayaran.` : 'Nggak ada pesanan yang menunggu verifikasi pembayaran.'}
          actionLabel="Buka antrean pembelian"
          href="#pembelian"
          icon="🛒"
          className="border-blue-200 bg-linear-to-br from-blue-50 via-white to-sky-50 focus:ring-blue-400"
          iconClassName="bg-blue-100 text-blue-700"
        />

        <SummaryCard
          eyebrow="Katalog"
          title="Inventori Menu"
          value={`${activeProducts.length} menu aktif`}
          detail={lowStockProducts.length > 0 ? `${lowStockProducts.length} menu perlu dicek karena stoknya menipis (≤ 5).` : 'Semua menu aktif punya stok di atas batas minimum.'}
          actionLabel="Kelola inventori menu"
          href="#inventori"
          icon="📦"
          className="border-orange-200 bg-linear-to-br from-orange-50 via-white to-amber-50 focus:ring-orange-400"
          iconClassName="bg-orange-100 text-orange-700"
        />
      </div>
    </section>
  );
}
