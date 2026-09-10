"use client";

import { useCartStore } from '@/store/useCartStore';
import { useState } from 'react';
import type { Product } from '@/lib/types';

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, items } = useCartStore();
  
  // STATE BARU BUAT ANIMASI TOMBOL
  const [isAdded, setIsAdded] = useState(false);

  const cartItem = items.find(item => item.id === product.id);
  const currentCartQty = cartItem ? cartItem.quantity : 0;
  
  const isOutOfStock = product.stock <= 0 || currentCartQty >= product.stock;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
    });
    
    // NYALAKAN ANIMASI
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500); // Balik ke normal setelah 1.5 detik
  };

  const realDescription = product.description || "Deskripsi belum tersedia.";

  return (
    <div className="bg-white rounded-[12px] shadow-sm hover:shadow-md border border-gray-100 overflow-hidden flex flex-col h-full transition-all duration-200 relative group">
      
      <div className="aspect-[4/3] w-full bg-gray-50 overflow-hidden relative">
        <img 
          src={product.image_url || '/icon.png'} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        {(product.stock > 0 && product.stock <= 4) && (
          <div className="absolute top-2 left-2 bg-orange-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 animate-pulse z-10">
            <span>🔥</span> SISA {product.stock}!
          </div>
        )}

      </div>

      <div className="p-[16px] flex flex-col flex-1 bg-white">
        
        <div className="flex justify-between items-start mb-0.5 gap-2">
          <h3 className="font-semibold text-gray-900 text-[15px] leading-[20px] line-clamp-2">{product.name}</h3>
          
        </div>

        <p className="text-[12px] text-gray-500 mb-3 line-clamp-2 font-medium leading-relaxed mt-2">
          {realDescription}
        </p>
        
        <div className="flex items-center gap-2 mb-3 mt-auto">
          <p className="text-[16px] font-bold text-gray-900">Rp {product.price.toLocaleString('id-ID')}</p>
        </div>

        <div className="mb-3">
          {product.stock <= 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-50 text-red-600">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              Habis Terjual
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
              product.stock <= 5 
                ? 'bg-orange-50 text-orange-700' 
                : 'bg-green-50 text-green-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${product.stock <= 5 ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></span>
              Sisa {product.stock} di Kulkas
            </span>
          )}
        </div>

        {/* TOMBOL BERUBAH WARNA SAAT DIKLIK */}
        <button
          onClick={handleAdd}
          aria-label={`Tambah ${product.name} ke keranjang`}
          disabled={isOutOfStock || isAdded}
          className={`w-full font-semibold py-[10px] rounded-full text-[14px] transition-all active:scale-[0.97] shadow-sm flex items-center justify-center gap-2 ${
            isOutOfStock 
              ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60" 
              : isAdded 
                ? "bg-green-600 text-white" 
                : "bg-red-600 text-white hover:bg-red-700 hover:shadow-md"
          }`}
        >
          {isOutOfStock ? "Stok Habis" : isAdded ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Ditambahkan!
            </>
          ) : "Tambah"}
        </button>
      </div>
    </div>
  );
}
