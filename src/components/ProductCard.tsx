"use client";

import { useCartStore } from '@/store/useCartStore';

export default function ProductCard({ product }: { product: any }) {
  const { addItem, items } = useCartStore();

  const cartItem = items.find(item => item.id === product.id);
  const currentCartQty = cartItem ? cartItem.quantity : 0;
  
  const isOutOfStock = product.stock <= 0 || currentCartQty >= product.stock;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addItem({ ...product, quantity: 1 });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="aspect-[4/3] w-full bg-gray-50 overflow-hidden relative">
        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        
        {/* RESOLUSI UI/UX: Injeksi Badge "Hot Items" & Scarcity */}
        
        {/* Badge 1: Sisa Stok Menipis (1 sampai 4) akan memicu status HAMPIR HABIS dengan animasi berkedip */}
        {(product.stock > 0 && product.stock <= 4) && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-md shadow-lg border border-red-400 flex items-center gap-1 animate-pulse z-10">
            <span>🔥</span> HAMPIR HABIS
          </div>
        )}

        {/* Badge 2: Hero Product (Jika mengandung kata 'durian' atau 'bebek') memicu status TERLARIS */}
        {(product.name.toLowerCase().includes('durian') || product.name.toLowerCase().includes('bebek')) && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 text-[10px] font-black px-2.5 py-1 rounded-md shadow-lg border border-yellow-300 flex items-center gap-1 z-10">
            <span>⭐</span> TERLARIS
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-sm mb-1">{product.name}</h3>
        <p className="text-xl font-black text-blue-600 mb-4">Rp {product.price.toLocaleString('id-ID')}</p>

        <div className="mt-auto mb-4">
          {product.stock <= 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
              Kulkas Kosong
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
              product.stock <= 5 
                ? 'bg-red-50 text-red-600 border border-red-100' 
                : 'bg-green-50 text-green-600 border border-green-100'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${product.stock <= 5 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
              {product.stock <= 5 ? `Sisa di Kulkas: ${product.stock}` : `Tersedia di Kulkas: ${product.stock}`}
            </span>
          )}
        </div>

        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {isOutOfStock ? "Stok Habis" : "Tambah ke Keranjang"}
        </button>
      </div>
    </div>
  );
}