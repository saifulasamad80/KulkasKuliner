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

  const fakeOriginalPrice = product.price * 1.2;

  // MENGAMBIL DATA NYATA DARI DATABASE (Tinggalkan Kosmetik Palsu)
  // Fallback: Jika di database kosong (null), kita tampilkan nilai default yang wajar
  const realRating = product.rating_avg ? Number(product.rating_avg).toFixed(1) : "0.0";
  const realReviews = product.rating_count || 0;
  const realDescription = product.description || "Frozen food siap saji.";

  return (
    <div className="bg-white rounded-[12px] shadow-sm hover:shadow-md border border-gray-100 overflow-hidden flex flex-col h-full transition-all duration-200 relative group">
      
      {/* AREA FOTO */}
      <div className="aspect-[4/3] w-full bg-gray-50 overflow-hidden relative">
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        {/* BADGE SCARCITY */}
        {(product.stock > 0 && product.stock <= 4) && (
          <div className="absolute top-2 left-2 bg-orange-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 animate-pulse z-10">
            <span>🔥</span> SISA {product.stock}!
          </div>
        )}

        {/* BADGE HERO PRODUCT */}
        {(product.name.toLowerCase().includes('durian') || product.name.toLowerCase().includes('bebek')) && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 z-10">
            <span>⭐</span> POPULER
          </div>
        )}
      </div>

      {/* AREA DESKRIPSI NYATA */}
      <div className="p-[16px] flex flex-col flex-1 bg-white">
        
        <div className="flex justify-between items-start mb-0.5 gap-2">
          <h3 className="font-semibold text-gray-900 text-[15px] leading-[20px] line-clamp-2">{product.name}</h3>
          <div className="flex flex-col items-end shrink-0">
            <div className="flex items-center gap-1 text-[13px] font-bold text-gray-900">
              <span className="text-yellow-400 text-[14px]">★</span> {realRating}
            </div>
            <span className="text-[11px] text-gray-400 font-medium">({realReviews})</span>
          </div>
        </div>

        {/* Deskripsi Asli dari Supabase */}
        <p className="text-[12px] text-gray-500 mb-2 truncate font-medium">
          {realDescription}
        </p>

        {/* Waktu Estimasi */}
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            15-30 min
          </span>
          <span className="text-gray-300 text-[10px]">●</span>
          <span>Instan</span>
          <span className="text-gray-300 text-[10px]">●</span>
          <span>$$</span>
        </div>
        
        <div className="flex items-center gap-2 mb-3 mt-auto">
          <p className="text-[16px] font-bold text-gray-900">Rp {product.price.toLocaleString('id-ID')}</p>
          <p className="text-[12px] font-medium text-gray-400 line-through">Rp {fakeOriginalPrice.toLocaleString('id-ID')}</p>
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

        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          className={`w-full font-semibold py-[10px] rounded-full text-[14px] transition-all active:scale-[0.97] shadow-sm flex items-center justify-center gap-2 ${
            isOutOfStock 
              ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60" 
              : "bg-red-600 text-white hover:bg-red-700 hover:shadow-md"
          }`}
        >
          {isOutOfStock ? "Stok Habis" : "Order Now"}
        </button>
      </div>
    </div>
  );
}