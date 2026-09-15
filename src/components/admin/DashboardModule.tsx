"use client";

import type { ReactNode } from 'react';

export type DashboardModuleId = 'pesanan' | 'menu' | 'iklan';

type DashboardModuleProps = {
  id: DashboardModuleId;
  title: string;
  summary: string;
  open: boolean;
  onToggle: (id: DashboardModuleId) => void;
  children: ReactNode;
};

export default function DashboardModule({ id, title, summary, open, onToggle, children }: DashboardModuleProps) {
  return (
    <section className={`mb-6 rounded-2xl border shadow-sm transition-colors ${open ? 'border-amber-300 bg-amber-100' : 'border-amber-200 bg-amber-50 hover:border-amber-300 hover:bg-amber-100'}`}>
      <button
        type="button"
        id={`${id}-tab`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 sm:p-6"
      >
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-amber-900">{title}</h2>
          <p className="mt-1 text-sm font-medium text-amber-800/80">{summary}</p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-900 shadow-sm">
          {open ? 'Tutup' : 'Buka'}
        </span>
      </button>
      {open && (
        <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-tab`} className="border-t border-amber-200 p-4 sm:p-6">
          {children}
        </div>
      )}
    </section>
  );
}
