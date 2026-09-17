"use client";

import type { ReactNode } from 'react';

type DashboardModuleProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

/** Full-width card wrapper that groups one section of the admin dashboard. */
export default function DashboardModule({ title, subtitle, children }: DashboardModuleProps) {
  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_45px_-30px_rgba(15,23,42,0.55)]">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="h-9 w-1.5 rounded-full bg-red-600" aria-hidden="true" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-600">Area Kerja</p>
            <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">{title}</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}
