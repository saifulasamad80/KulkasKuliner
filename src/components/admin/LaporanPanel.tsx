"use client";

import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { getProductMenu, type Product } from '@/lib/types';
import { getProductLabel } from '@/lib/marketing';

type LaporanPanelProps = {
  products: Product[];
  productSales: Record<string, number>;
};

type StockStatus = 'habis' | 'menipis' | 'aman';

/** Stok 0 = habis, 1-5 = menipis (ambang sama dengan yang dipakai generator iklan), sisanya aman. */
function getStockStatus(stock: number): StockStatus {
  if (stock <= 0) return 'habis';
  if (stock <= 5) return 'menipis';
  return 'aman';
}

const STATUS_LABEL: Record<StockStatus, string> = {
  habis: 'Habis',
  menipis: 'Menipis',
  aman: 'Aman',
};

const STATUS_BADGE: Record<StockStatus, string> = {
  habis: 'bg-red-100 text-red-800',
  menipis: 'bg-amber-100 text-amber-800',
  aman: 'bg-green-100 text-green-800',
};

type FilterKey = 'semua' | 'habis' | 'menipis';

export default function LaporanPanel({ products, productSales }: LaporanPanelProps) {
  const [filter, setFilter] = useState<FilterKey>('semua');

  const rows = useMemo(() => {
    return products
      .map((product) => {
        const menu = getProductMenu(product);
        const sold = productSales[product.id] ?? 0;
        const hasCostPrice = product.cost_price > 0;
        const profitPerUnit = product.price - product.cost_price;
        return {
          product,
          label: getProductLabel(product),
          menuName: menu?.name || '-',
          status: getStockStatus(product.stock),
          sold,
          hasCostPrice,
          profitPerUnit,
          totalProfit: hasCostPrice ? profitPerUnit * sold : 0,
        };
      })
      .sort((a, b) => a.product.stock - b.product.stock || a.label.localeCompare(b.label, 'id-ID'));
  }, [products, productSales]);

  const habisCount = rows.filter((row) => row.status === 'habis').length;
  const menipisCount = rows.filter((row) => row.status === 'menipis').length;
  const visibleRows = filter === 'semua' ? rows : rows.filter((row) => row.status === filter);

  const totalNetProfit = rows.reduce((sum, row) => sum + row.totalProfit, 0);
  const missingCostPriceCount = rows.filter((row) => !row.hasCostPrice).length;

  const bestSellers = useMemo(
    () => [...rows].filter((row) => row.sold > 0).sort((a, b) => b.sold - a.sold).slice(0, 5),
    [rows]
  );

  const handleExport = () => {
    const exportRows = visibleRows.map((row) => ({
      Produk: row.label,
      'Menu Induk': row.menuName,
      Harga: row.product.price,
      Modal: row.hasCostPrice ? row.product.cost_price : '',
      Stok: row.product.stock,
      'Status Stok': STATUS_LABEL[row.status],
      'Terjual (Lunas)': row.sold,
      'Keuntungan Bersih': row.hasCostPrice ? row.totalProfit : '',
      'Status Tayang': row.product.is_active ? 'Aktif' : 'Diarsipkan',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    worksheet['!cols'] = [{ wch: 28 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 15 }, { wch: 16 }, { wch: 13 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Stok');

    const today = new Date().toISOString().slice(0, 10);
    const scope = filter === 'semua' ? 'semua-menu' : filter;
    XLSX.writeFile(workbook, `laporan-stok-kulkaskuliner-${scope}-${today}.xlsx`);
  };

  return (
    <div>
      <div className="mb-5 rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-white p-4 sm:p-5">
        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">💰 Keuntungan Bersih (dari pesanan lunas)</p>
        <p className="mt-1 text-3xl font-black text-emerald-800 sm:text-4xl">Rp {totalNetProfit.toLocaleString('id-ID')}</p>
        <p className="mt-1.5 text-xs leading-5 text-slate-500">Harga jual dikurangi modal, dikali jumlah terjual (dari seluruh riwayat pesanan lunas).</p>
        {missingCostPriceCount > 0 && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800">
            ⚠️ {missingCostPriceCount} menu belum diisi modalnya — keuntungan dari menu itu belum ikut terhitung di angka ini. Isi modal lewat Modul Menu (tombol Edit Item) biar makin akurat.
          </p>
        )}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Total Menu</p>
          <p className="mt-1 text-xl font-black text-slate-900">{products.length}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-red-600">Stok Habis</p>
          <p className="mt-1 text-xl font-black text-red-700">{habisCount}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-amber-600">Stok Menipis</p>
          <p className="mt-1 text-xl font-black text-amber-700">{menipisCount}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-3">
          <p className="text-[11px] font-black uppercase tracking-wide text-green-600">Stok Aman</p>
          <p className="mt-1 text-xl font-black text-green-700">{products.length - habisCount - menipisCount}</p>
        </div>
      </div>

      {bestSellers.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-2 text-sm font-black text-slate-800">🏆 Paling Laris (dari pesanan lunas)</h4>
          <div className="space-y-1.5">
            {bestSellers.map((row, index) => (
              <div key={row.product.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm">
                <span className="flex items-center gap-2 font-semibold text-slate-800">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-black text-white">{index + 1}</span>
                  {row.label}
                </span>
                <span className="font-black text-slate-900">{row.sold} terjual</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter('semua')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-black transition-colors ${filter === 'semua' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Semua ({rows.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('habis')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-black transition-colors ${filter === 'habis' ? 'bg-red-600 text-white' : 'border border-red-200 bg-white text-red-600 hover:bg-red-50'}`}
          >
            Stok Habis ({habisCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('menipis')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-black transition-colors ${filter === 'menipis' ? 'bg-amber-500 text-white' : 'border border-amber-200 bg-white text-amber-700 hover:bg-amber-50'}`}
          >
            Stok Menipis ({menipisCount})
          </button>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={visibleRows.length === 0}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-black text-white shadow-sm transition-colors hover:bg-green-700 disabled:opacity-50"
        >
          <span aria-hidden="true">📊</span> Export ke Excel
        </button>
      </div>

      {visibleRows.length === 0 ? (
        <p className="rounded-xl border border-slate-100 bg-slate-50 p-6 text-center text-sm text-slate-500">Tidak ada menu di kategori ini.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2.5">Produk</th>
                <th className="px-3 py-2.5">Menu Induk</th>
                <th className="px-3 py-2.5 text-right">Stok</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-right">Modal</th>
                <th className="px-3 py-2.5 text-right">Terjual</th>
                <th className="px-3 py-2.5 text-right">Untung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRows.map((row) => (
                <tr key={row.product.id} className={row.status === 'habis' ? 'bg-red-50/40' : undefined}>
                  <td className="px-3 py-2.5 font-semibold text-slate-800">{row.label}</td>
                  <td className="px-3 py-2.5 text-slate-500">{row.menuName}</td>
                  <td className="px-3 py-2.5 text-right font-black text-slate-900">{row.product.stock}</td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${STATUS_BADGE[row.status]}`}>
                      {STATUS_LABEL[row.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-600">
                    {row.hasCostPrice ? `Rp ${row.product.cost_price.toLocaleString('id-ID')}` : <span className="text-amber-600">Belum diisi</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{row.sold}</td>
                  <td className="px-3 py-2.5 text-right font-black">
                    {row.hasCostPrice ? (
                      <span className={row.totalProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}>Rp {row.totalProfit.toLocaleString('id-ID')}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
