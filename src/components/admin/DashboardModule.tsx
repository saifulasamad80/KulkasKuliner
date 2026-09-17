"use client";

import type { ReactNode } from 'react';

type DashboardModuleProps = {
  title: string;
  children: ReactNode;
};

/** Full-width card wrapper that groups one section of the admin dashboard. */
export default function DashboardModule({ title, children }: DashboardModuleProps) {
  return (
    <section className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-lg font-black text-gray-400 uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </section>
  );
}
