"use client";

import { useEffect, useState } from 'react';
import type { DailyPoint, ModeStats, PwaAnalytics } from '@/lib/pwa-analytics';

type Period = 7 | 30;
type Result = { days: Period; data: PwaAnalytics | null; error: string | null };

const rupiah = (value: number) => `Rp ${Math.round(value).toLocaleString('id-ID')}`;
const percent = (value: number | null) =>
  value === null ? '–' : `${(value * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`;
const decimal = (value: number) => value.toLocaleString('id-ID', { maximumFractionDigits: 1 });

function shortDate(date: string) {
  const [, month, day] = date.split('-');
  return `${day}/${month}`;
}

function weekday(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('id-ID', { weekday: 'short', timeZone: 'UTC' });
}

const TONES = {
  emerald: 'border-emerald-200 bg-linear-to-br from-emerald-50 to-white text-emerald-800',
  sky: 'border-sky-200 bg-linear-to-br from-sky-50 to-white text-sky-800',
  amber: 'border-amber-200 bg-linear-to-br from-amber-50 to-white text-amber-800',
  violet: 'border-violet-200 bg-linear-to-br from-violet-50 to-white text-violet-800',
} as const;

function KpiCard({ icon, label, value, note, tone }: { icon: string; label: string; value: string; note: string; tone: keyof typeof TONES }) {
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${TONES[tone]}`}>
      <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide">
        <span aria-hidden="true">{icon}</span>
        {label}
      </p>
      <p className="mt-2 text-3xl font-black leading-tight text-slate-950">{value}</p>
      <p className="mt-1.5 text-sm leading-5 text-slate-600">{note}</p>
    </div>
  );
}

function DailyChart({ daily }: { daily: DailyPoint[] }) {
  const max = Math.max(1, ...daily.map((point) => point.pwa + point.browser));
  const showEveryLabel = daily.length <= 7;
  const summary = daily.map((point) => `${shortDate(point.date)}: ${point.pwa} PWA, ${point.browser} browser`).join('; ');

  return (
    <div>
      <div className="flex h-44 items-end gap-1 sm:gap-1.5" role="img" aria-label={`Grafik pengguna harian. ${summary}`}>
        {daily.map((point) => (
          <div key={point.date} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${shortDate(point.date)} — ${point.pwa} lewat PWA, ${point.browser} lewat browser`}>
            <div className="w-full rounded-t bg-slate-300" style={{ height: `${(point.browser / max) * 100}%` }} />
            <div className={`w-full bg-emerald-500 ${point.browser === 0 ? 'rounded-t' : ''}`} style={{ height: `${(point.pwa / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1 sm:gap-1.5">
        {daily.map((point, index) => {
          const visible = showEveryLabel || index === 0 || index === daily.length - 1 || index === Math.floor(daily.length / 2);
          return (
            <div key={point.date} className="min-w-0 flex-1 text-center text-xs font-bold leading-4 text-slate-500">
              {visible ? (
                <>
                  {showEveryLabel && <span className="block">{weekday(point.date)}</span>}
                  <span className="block">{shortDate(point.date)}</span>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-slate-600">
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-emerald-500" />Lewat PWA (aplikasi terpasang)</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-slate-300" />Lewat browser biasa</span>
      </div>
    </div>
  );
}

function ComparisonTable({ pwa, browser }: { pwa: ModeStats; browser: ModeStats }) {
  const rows: Array<{ label: string; pwa: string; browser: string }> = [
    { label: 'Pengguna unik', pwa: String(pwa.visitors), browser: String(browser.visitors) },
    { label: 'Pengguna yang kembali lagi', pwa: `${pwa.returningVisitors} (${percent(pwa.returningRate)})`, browser: `${browser.returningVisitors} (${percent(browser.returningRate)})` },
    { label: 'Pembeli', pwa: String(pwa.buyers), browser: String(browser.buyers) },
    { label: 'Konversi (pembeli ÷ pengguna)', pwa: percent(pwa.conversionRate), browser: percent(browser.conversionRate) },
    { label: 'Pesanan lunas', pwa: String(pwa.paidOrders), browser: String(browser.paidOrders) },
    { label: 'Pendapatan', pwa: rupiah(pwa.revenue), browser: rupiah(browser.revenue) },
    { label: 'Rata-rata belanja', pwa: pwa.paidOrders ? rupiah(pwa.aov) : '–', browser: browser.paidOrders ? rupiah(browser.aov) : '–' },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[520px] text-left">
        <thead className="bg-slate-50 text-sm font-black uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Ukuran</th>
            <th className="bg-emerald-50 px-4 py-3 text-right text-emerald-700">PWA</th>
            <th className="px-4 py-3 text-right">Browser</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="px-4 py-3 font-semibold text-slate-700">{row.label}</td>
              <td className="bg-emerald-50/50 px-4 py-3 text-right font-black text-slate-950">{row.pwa}</td>
              <td className="px-4 py-3 text-right font-bold text-slate-600">{row.browser}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getInsight(data: PwaAnalytics) {
  const { pwa, browser } = data.stats;
  if (data.totalVisitors === 0) {
    return { tone: 'slate', text: 'Belum ada data pengunjung. Pelacakan baru mulai menghitung setelah fitur ini aktif, jadi angkanya akan terisi dalam sehari-dua hari.' } as const;
  }
  if (pwa.visitors === 0) {
    return { tone: 'amber', text: 'Belum ada pelanggan yang memakai PWA di periode ini. Coba ajak pelanggan langganan memasang aplikasinya (buka katalog di browser HP → menu → "Tambahkan ke layar utama").' } as const;
  }
  if (pwa.visitors >= 10 && browser.visitors >= 10 && pwa.conversionRate !== null && browser.conversionRate !== null) {
    if (pwa.conversionRate < browser.conversionRate) {
      return { tone: 'amber', text: `Konversi PWA (${percent(pwa.conversionRate)}) lebih rendah dari browser (${percent(browser.conversionRate)}). Pengguna PWA rajin membuka tapi lebih jarang menyelesaikan pembelian — kemungkinan ada yang mengganjal di harga, menu, atau alur checkout.` } as const;
    }
    return { tone: 'emerald', text: `Konversi PWA (${percent(pwa.conversionRate)}) sama atau lebih tinggi dari browser (${percent(browser.conversionRate)}). Pengguna PWA cukup efektif berubah jadi pembeli.` } as const;
  }
  return { tone: 'slate', text: 'Data belum cukup untuk membandingkan PWA dengan browser (butuh minimal 10 pengguna di masing-masing).' } as const;
}

const INSIGHT_TONES = {
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
  amber: 'border-amber-300 bg-amber-50 text-amber-900',
  emerald: 'border-emerald-300 bg-emerald-50 text-emerald-900',
} as const;

export default function StatistikPanel() {
  const [days, setDays] = useState<Period>(7);
  const [result, setResult] = useState<Result | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch(`/api/admin/analytics?days=${days}`, { cache: 'no-store' });
        const body = (await response.json().catch(() => null)) as (PwaAnalytics & { error?: string }) | null;
        if (!active) return;
        if (!response.ok || !body || body.error) {
          setResult({ days, data: null, error: body?.error || 'Statistik gagal dimuat.' });
        } else {
          setResult({ days, data: body, error: null });
        }
      } catch {
        if (active) setResult({ days, data: null, error: 'Koneksi bermasalah. Coba muat ulang.' });
      }
    })();
    return () => {
      active = false;
    };
  }, [days, reloadKey]);

  const isLoading = result === null || result.days !== days;
  const data = !isLoading ? result?.data ?? null : null;
  const error = !isLoading ? result?.error ?? null : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl border border-slate-300 bg-white p-1" role="group" aria-label="Pilih periode">
          {([7, 30] as Period[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDays(option)}
              aria-pressed={days === option}
              className={`min-h-11 rounded-lg px-5 text-sm font-black transition-colors ${days === option ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {option} hari terakhir
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => { setResult(null); setReloadKey((key) => key + 1); }}
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
        >
          ↻ Muat ulang
        </button>
      </div>

      {isLoading && <p className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-base font-bold text-slate-500">Memuat statistik…</p>}

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-base font-bold leading-6 text-red-700">{error}</p>
      )}

      {data && (() => {
        const insight = getInsight(data);
        const { pwa, browser } = data.stats;
        return (
          <>
            <section aria-labelledby="ringkasan-pwa" className="space-y-3">
              <h4 id="ringkasan-pwa" className="text-xl font-black text-slate-900">Ringkasan PWA · {data.days} hari terakhir</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard icon="👥" tone="emerald" label="Pengguna PWA hari ini" value={String(data.dauToday.pwa)} note={`Rata-rata ${decimal(data.averageDau.pwa)} pengguna per hari`} />
                <KpiCard icon="🎯" tone="sky" label="Konversi PWA" value={percent(pwa.conversionRate)} note={`${pwa.buyers} pembeli dari ${pwa.visitors} pengguna`} />
                <KpiCard icon="💰" tone="amber" label="Pendapatan PWA" value={rupiah(pwa.revenue)} note={`Dari ${pwa.paidOrders} pesanan yang sudah lunas`} />
                <KpiCard icon="🛒" tone="violet" label="Rata-rata belanja" value={pwa.paidOrders ? rupiah(pwa.aov) : '–'} note="Per pesanan lunas lewat PWA" />
              </div>
            </section>

            <p className={`rounded-xl border p-4 text-base font-semibold leading-6 ${INSIGHT_TONES[insight.tone]}`}>💡 {insight.text}</p>

            <section aria-labelledby="antusias" className="space-y-3">
              <h4 id="antusias" className="text-xl font-black text-slate-900">Seberapa antusias pengguna?</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <KpiCard icon="📱" tone="emerald" label="Pengguna PWA unik" value={String(pwa.visitors)} note={`${percent(data.pwaShare)} dari semua pengunjung (${data.totalVisitors})`} />
                <KpiCard icon="🔁" tone="sky" label="Yang kembali lagi" value={percent(pwa.returningRate)} note={`${pwa.returningVisitors} pengguna aktif di 2 hari atau lebih`} />
                <KpiCard icon="🧾" tone="amber" label="Pesanan dibuat lewat PWA" value={String(pwa.orders)} note="Termasuk yang belum lunas" />
              </div>
            </section>

            <section aria-labelledby="grafik" className="space-y-3">
              <h4 id="grafik" className="text-xl font-black text-slate-900">Pengguna per hari</h4>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <DailyChart daily={data.daily} />
              </div>
            </section>

            <section aria-labelledby="banding" className="space-y-3">
              <h4 id="banding" className="text-xl font-black text-slate-900">PWA dibanding browser biasa</h4>
              <ComparisonTable pwa={pwa} browser={browser} />
            </section>

            <details className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-base leading-7 text-slate-700">
              <summary className="cursor-pointer text-base font-black text-slate-900">Cara membaca &amp; menghitung angka ini</summary>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li><span className="font-black">Pengguna</span> dihitung per perangkat (anonim), bukan per orang. Satu orang yang memakai 2 HP dihitung 2. Di iPhone, aplikasi PWA dan Safari terhitung terpisah.</li>
                <li><span className="font-black">Konversi</span> = pembeli ÷ pengguna. Pembeli = perangkat yang membuat pesanan (yang ditolak/dibatalkan tidak dihitung).</li>
                <li><span className="font-black">Pendapatan &amp; rata-rata belanja</span> hanya dari pesanan yang sudah lunas, sama seperti Total Pendapatan di bagian atas dashboard.</li>
                <li>Kalau pengguna banyak tapi konversi rendah, masalahnya biasanya di harga, menu, atau alur checkout — bukan di jumlah pengunjung.</li>
                <li>Perangkat yang pernah membuka halaman admin tidak dihitung, supaya pemakaian admin tidak tercampur dengan pelanggan.</li>
                <li>Data baru terkumpul sejak fitur ini dipasang. {data.unattributedOrders > 0 ? `${data.unattributedOrders} pesanan di periode ini belum ada data sumbernya (pesanan lama atau dari perangkat admin), jadi tidak masuk hitungan PWA maupun browser.` : 'Semua pesanan di periode ini sudah punya data sumber.'}</li>
              </ul>
            </details>
          </>
        );
      })()}
    </div>
  );
}
