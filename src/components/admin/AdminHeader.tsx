"use client";

import AdminPushSettings from '@/components/AdminPushSettings';

type AdminHeaderProps = {
  totalRevenue: number;
  onLogout: () => void;
};

export default function AdminHeader({ totalRevenue, onLogout }: AdminHeaderProps) {
  return (
    <header className="relative mb-7 overflow-hidden rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-[0_18px_45px_-24px_rgba(15,23,42,0.8)] sm:p-6 lg:p-7">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-red-600/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-2xl shadow-lg shadow-red-950/40" aria-hidden="true">
              🧊
            </div>
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-red-300">KulkasKuliner</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Sesi Aman
                </span>
              </div>
              <h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">Dashboard Admin</h1>
            </div>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-300">Kelola pesanan, katalog, dan promosi dari satu tempat.</p>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 min-[440px]:grid-cols-2 sm:grid-cols-[minmax(210px,1fr)_auto_auto] lg:w-auto">
          <div className="col-span-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm sm:col-span-1 sm:min-w-[210px]">
            <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Total Pendapatan</span>
            <span className="block text-2xl font-black tracking-tight text-white">Rp {totalRevenue.toLocaleString('id-ID')}</span>
          </div>
          <AdminPushSettings />
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm font-black text-red-100 transition-colors hover:bg-red-500/25 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-950 sm:w-auto"
          >
            <span aria-hidden="true">↗</span>
            Kunci Keluar
          </button>
        </div>
      </div>
    </header>
  );
}
