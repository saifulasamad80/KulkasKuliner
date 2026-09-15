"use client";

import { useSyncExternalStore } from 'react';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link'; 

export default function FloatingCart() {
  const isMounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const items = useCartStore((state) => state.items);

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  if (!isMounted || totalItems === 0) return null;

  return (
    <Link href="/cart" aria-label={`Buka keranjang, ${totalItems} item`} className="fixed bottom-5 right-4 z-50 flex items-center gap-3 rounded-full bg-[#dc2626] px-4 py-3 text-white shadow-[0_12px_28px_rgba(220,38,38,0.32)] ring-4 ring-red-600/10 transition-all hover:-translate-y-1 hover:bg-[#b91c1c] active:scale-95 sm:bottom-7 sm:right-7 sm:px-5">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <span className="text-sm font-black">Lihat keranjang</span>
      <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 text-xs font-black text-[#dc2626]">
        {totalItems}
      </span>
    </Link>
  );
}
