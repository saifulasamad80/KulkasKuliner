"use client";

import { useCartStore } from '@/store/useCartStore';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string; // Tambahan tipe data baru
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
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col hover:shadow-lg transition-shadow overflow-hidden relative">
      {/* Container Foto */}
      <div className="w-full h-48 bg-gray-100 relative overflow-hidden group">
        <img 
          src={product.image_url || 'https://images.unsplash.com/photo-1606851094655-b25cb8a48b59?w=500&q=80'} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Overlay Stok Habis (Absolute) */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <span className="text-white font-black text-xl tracking-widest uppercase rotate-12 border-4 border-red-500 text-red-500 px-4 py-1">SOLD OUT</span>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-800 leading-snug line-clamp-2">{product.name}</h2>
          <p className="text-2xl font-black text-blue-600 mt-2">
            Rp {product.price.toLocaleString('id-ID')}
          </p>
          
          <div className="mt-3">
            {product.stock > 0 ? (
              <span className="inline-flex items-center text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                Sisa Gudang: {product.stock}
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>
                Kosong
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className={`mt-5 w-full py-2.5 rounded-lg font-bold transition-all duration-200 ${
            product.stock > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-sm'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {product.stock > 0 ? 'Tambah ke Keranjang' : 'Barang Kosong'}
        </button>
      </div>
    </div>
  );
}