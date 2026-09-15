"use client";

import AdminPushSettings from '@/components/AdminPushSettings';

type AdminHeaderProps = {
  totalRevenue: number;
  onLogout: () => void;
};

export default function AdminHeader({ totalRevenue, onLogout }: AdminHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
        <button onClick={onLogout} className="bg-red-100 text-red-700 border border-red-300 px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors shadow-sm text-center">Kunci Keluar</button>
      </div>
    </div>
  );
}
