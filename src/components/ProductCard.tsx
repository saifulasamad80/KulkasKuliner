"use client";

import { useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { getProductMenu } from '@/lib/types';
import type { Product } from '@/lib/types';

export default function ProductCard({ product, variants = [product] }: { product: Product; variants?: Product[] }) {
  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items);
  const initialVariant = variants.find((variant) => variant.stock > 0) ?? product;
  const [selectedId, setSelectedId] = useState(initialVariant.id);
  const [isAdded, setIsAdded] = useState(false);
  const selected = variants.find((variant) => variant.id === selectedId)
    ?? variants.find((variant) => variant.stock > 0)
    ?? product;
  const cartItem = items.find((item) => item.id === selected.id);
  const currentCartQty = cartItem?.quantity ?? 0;
  const isOutOfStock = selected.stock <= 0 || currentCartQty >= selected.stock;
  const menu = getProductMenu(selected);
  const menuName = menu?.name ?? selected.name;
  const hasVariants = variants.length > 1;
  const variantLabel = selected.variant_name || (hasVariants ? selected.name : 'Tersedia');
  const priceLabel = `Rp ${selected.price.toLocaleString('id-ID')}`;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addItem({
      id: selected.id,
      name: menuName,
      menuName,
      variantName: selected.variant_name || (hasVariants ? selected.name : undefined),
      price: selected.price,
      stock: selected.stock,
    });
    setIsAdded(true);
    window.setTimeout(() => setIsAdded(false), 1500);
  };

  const imageUrl = selected.image_url || product.image_url || menu?.image_url || '/icon.png';
  const description = selected.description || menu?.description || 'Deskripsi belum tersedia.';

  return (
    <div className="bg-white rounded-[12px] shadow-sm hover:shadow-md border border-gray-100 overflow-hidden flex flex-col h-full transition-all duration-200 relative group">
      <div className="aspect-[4/3] w-full bg-gray-50 overflow-hidden relative">
        <img src={imageUrl} alt={menuName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        {selected.stock > 0 && selected.stock <= 4 && <div className="absolute top-2 left-2 bg-orange-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm animate-pulse z-10">🔥 SISA {selected.stock}!</div>}
      </div>
      <div className="p-[16px] flex flex-col flex-1 bg-white">
        <h3 className="font-semibold text-gray-900 text-[15px] leading-[20px] line-clamp-2">{menuName}</h3>
        <p className="text-[12px] text-gray-500 mb-3 line-clamp-2 font-medium leading-relaxed mt-2">{description}</p>
        {hasVariants && <div className="mb-3"><label htmlFor={`variant-${product.id}`} className="block text-[11px] font-bold text-gray-500 mb-1">Pilih varian</label><select id={`variant-${product.id}`} value={selected.id} onChange={(event) => { setSelectedId(event.target.value); setIsAdded(false); }} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-red-600">{variants.map((variant) => <option key={variant.id} value={variant.id} disabled={variant.stock <= 0}>{variant.variant_name || variant.name} — Rp {variant.price.toLocaleString('id-ID')} {variant.stock <= 0 ? '(Habis)' : ''}</option>)}</select></div>}
        <div className="flex items-center gap-2 mb-3 mt-auto"><p className="text-[16px] font-bold text-gray-900">{priceLabel}</p>{hasVariants && <span className="text-[11px] text-gray-400">{variantLabel}</span>}</div>
        <div className="mb-3">{selected.stock <= 0 ? <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-50 text-red-600">Habis Terjual</span> : <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium ${selected.stock <= 5 ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}>Sisa {selected.stock} di Kulkas</span>}</div>
        <button onClick={handleAdd} aria-label={`Tambah ${menuName}${hasVariants ? ` varian ${variantLabel}` : ''} ke keranjang`} disabled={isOutOfStock || isAdded} className={`w-full font-semibold py-[10px] rounded-full text-[14px] transition-all active:scale-[0.97] shadow-sm ${isOutOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60' : isAdded ? 'bg-green-600 text-white' : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-md'}`}>{isOutOfStock ? 'Stok Habis' : isAdded ? '✓ Ditambahkan!' : 'Tambah'}</button>
      </div>
    </div>
  );
}