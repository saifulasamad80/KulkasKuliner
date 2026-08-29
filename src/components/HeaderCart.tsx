"use client";

import { useCartStore } from '@/store/useCartStore';
import { useEffect, useState } from 'react';
import Link from 'next/link'; 

export default function HeaderCart() {
  const [isClient, setIsClient] = useState(false);
  const items = useCartStore((state) => state.items);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Link href="/cart" className="relative p-2 text-gray-700 hover:text-red-600 transition-colors group flex items-center">
      {/* Ikon Keranjang Belanja */}
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      
      {/* Badge Notifikasi Angka (Hanya muncul jika ada barang) */}
      {totalItems > 0 && (
        <span className="absolute top-0 right-0 bg-red-600 text-white text-[11px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white group-hover:scale-110 transition-transform shadow-sm">
          {totalItems}
        </span>
      )}
    </Link>
  );
}