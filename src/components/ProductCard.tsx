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

  // Logika Harga Coret (Fake Slashed Price) untuk efek FOMO
  // Kita buat harga "asli" terlihat 20% lebih mahal agar pembeli merasa untung
  const fakeOriginalPrice = product.price * 1.2;

  return (
    <div className="bg-white rounded-[12px] shadow-sm hover:shadow-md border border-gray-100 overflow-hidden flex flex-col h-full transition-all duration-200 relative group">
      
      {/* AREA FOTO (16:9 / Aspect 4:3) dengan Radius FoodDash */}
      <div className="aspect-[4/3] w-full bg-gray-50 overflow-hidden relative">
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        
        {/* OVERLAY GELAP (Agar badge terlihat jelas) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        {/* BADGE 1: SCARCITY (FoodDash Secondary Color: #EA580C / Orange) */}
        {(product.stock > 0 && product.stock <= 4) && (
          <div className="absolute top-2 left-2 bg-orange-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 animate-pulse z-10">
            <span>🔥</span> SISA {product.stock}!
          </div>
        )}

        {/* BADGE 2: HERO PRODUCT (FoodDash Badge Style) */}
        {(product.name.toLowerCase().includes('durian') || product.name.toLowerCase().includes('bebek')) && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 z-10">
            <span>⭐</span> POPULER
          </div>
        )}
      </div>

      {/* AREA DESKRIPSI & CTA (Padding 12px/18px ala FoodDash) */}
      <div className="p-[16px] flex flex-col flex-1 bg-white">
        
        {/* Nama Resto/Produk (FoodDash h4: 15px semibold) */}
        <h3 className="font-semibold text-gray-900 text-[15px] leading-[20px] mb-1 line-clamp-2">{product.name}</h3>
        
        {/* Harga Asli vs Harga Coret */}
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[16px] font-bold text-gray-900">Rp {product.price.toLocaleString('id-ID')}</p>
          <p className="text-[12px] font-medium text-gray-400 line-through">Rp {fakeOriginalPrice.toLocaleString('id-ID')}</p>
        </div>

        {/* Status Chip (FoodDash Semantic Colors) */}
        <div className="mt-auto mb-4">
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
              Tersedia
            </span>
          )}
        </div>

        {/* TOMBOL CTA (FoodDash Primary: #DC2626, Pill Shape) */}
        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          className={`w-full font-semibold py-[10px] rounded-full text-[14px] transition-all active:scale-[0.97] shadow-sm flex items-center justify-center gap-2 ${
            isOutOfStock 
              ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60" 
              : "bg-red-600 text-white hover:bg-red-700 hover:shadow-md"
          }`}
        >
          {isOutOfStock ? (
            "Stok Habis"
          ) : (
            <>
              <span>+</span>
              <span>Tambah</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}