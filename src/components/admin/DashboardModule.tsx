"use client";

import type { ReactNode } from 'react';

type DashboardModuleProps = {
  title: string;
  children: ReactNode;
};

export default function DashboardModule({ title, children }: DashboardModuleProps) {
  return (
    <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-100 p-4 shadow-sm sm:p-6">
      <h2 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-amber-900">{title}</h2>
      {children}
    </section>
  );
}
