"use client";

import { useCartStore } from '@/store/useCartStore';
import { useEffect, useState } from 'react';
import Link from 'next/link'; 

export default function FloatingCart() {
  const [isClient, setIsClient] = useState(false);
  const items = useCartStore((state) => state.items);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  if (totalItems === 0) return null; 

  return (
    <Link href="/cart" className="fixed bottom-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-2xl hover:bg-red-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 group z-50 ring-4 ring-red-600/20">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <span className="font-bold text-lg bg-white text-red-700 px-2.5 py-0.5 rounded-full shadow-inner">
        {totalItems}
      </span>
    </Link>
  );
}