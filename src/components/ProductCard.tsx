"use client";

import { useCartStore } from '@/store/useCartStore';

// Definisi tipe data (wajib di TypeScript)
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col hover:shadow-md transition-shadow">
      <div className="flex-1">
        <h2 className="text-lg font-bold text-gray-800 leading-snug">{product.name}</h2>
        <p className="text-2xl font-black text-blue-600 mt-3">
          Rp {product.price.toLocaleString('id-ID')}
        </p>
        
        <div className="mt-3">
          {product.stock > 0 ? (
            <span className="inline-flex items-center text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
              Stok Tersedia: {product.stock}
            </span>
          ) : (
            <span className="inline-flex items-center text-xs font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>
              Stok Habis
            </span>
          )}
        </div>
      </div>

      <button
        onClick={handleAddToCart}
        disabled={product.stock === 0}
        className={`mt-6 w-full py-2.5 rounded-lg font-bold transition-all duration-200 ${
          product.stock > 0
            ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-sm'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {product.stock > 0 ? 'Tambah ke Keranjang' : 'Barang Kosong'}
      </button>
    </div>
  );
}