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
  // Nama yang diedit admin di products adalah nama yang harus terlihat pembeli.
  // Nama menu induk tetap dipakai sebagai fallback untuk data lama yang kosong.
  const displayName = selected.name || menu?.name || 'Produk';
  const hasVariants = variants.length > 1;
  const variantLabel = selected.variant_name || (hasVariants ? selected.name : 'Tersedia');
  const priceLabel = `Rp ${selected.price.toLocaleString('id-ID')}`;

  const handleAdd = () => {
    if (isOutOfStock) return;
    addItem({
      id: selected.id,
      name: displayName,
      menuName: displayName,
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
    <div className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-black/6 bg-white shadow-[0_7px_22px_rgba(91,44,16,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(91,44,16,0.12)]">
      <div className="relative aspect-square w-full overflow-hidden bg-[#f8f1eb] sm:aspect-[1.08/1]">
        <img src={imageUrl} alt={displayName} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
        <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#dc2626] shadow-sm">{hasVariants ? 'Varian tersedia' : 'Favorit'}</span>
        {selected.stock > 0 && selected.stock <= 4 && <div className="absolute bottom-2.5 left-2.5 rounded-full bg-orange-500 px-2.5 py-1 text-[9px] font-black text-white shadow-sm">🔥 Sisa {selected.stock}</div>}
      </div>
      <div className="flex flex-1 flex-col bg-white p-3.5 sm:p-4">
        <h3 className="line-clamp-2 min-h-10 text-[14px] font-black leading-5 tracking-[-0.02em] text-[#171717] sm:text-[15px]">{displayName}</h3>
        <p className="mt-1 line-clamp-1 text-[11px] font-medium text-[#a0958e]">{description}</p>
        {hasVariants && <div className="mb-3"><label htmlFor={`variant-${product.id}`} className="block text-[11px] font-bold text-gray-500 mb-1">Pilih varian</label><select id={`variant-${product.id}`} value={selected.id} onChange={(event) => { setSelectedId(event.target.value); setIsAdded(false); }} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-red-600">{variants.map((variant) => <option key={variant.id} value={variant.id} disabled={variant.stock <= 0}>{variant.variant_name || variant.name} — Rp {variant.price.toLocaleString('id-ID')} {variant.stock <= 0 ? '(Habis)' : ''}</option>)}</select></div>}
        <div className="mt-auto flex min-h-10 items-end justify-between gap-2 pt-4"><div><p className="text-[15px] font-black tracking-tight text-[#171717] sm:text-base">{priceLabel}</p>{hasVariants && <p className="mt-0.5 text-[10px] font-bold text-[#a0958e]">{variantLabel}</p>}</div>{selected.stock <= 0 ? <span className="rounded-full bg-red-50 px-2 py-1 text-[9px] font-extrabold text-red-600">Habis</span> : <span className={`rounded-full px-2 py-1 text-[9px] font-extrabold ${selected.stock <= 5 ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}>{selected.stock} tersedia</span>}</div>
        <button onClick={handleAdd} aria-label={`Tambah ${displayName}${hasVariants ? ` varian ${variantLabel}` : ''} ke keranjang`} disabled={isOutOfStock || isAdded} className={`mt-3 flex min-h-10 w-full items-center justify-center rounded-xl text-xs font-black transition-all active:scale-[0.97] ${isOutOfStock ? 'cursor-not-allowed bg-[#f3f0ee] text-[#b8aea8]' : isAdded ? 'bg-green-600 text-white' : 'bg-[#dc2626] text-white shadow-[0_7px_14px_rgba(220,38,38,0.18)] hover:bg-[#b91c1c]'}`}>{isOutOfStock ? 'Stok habis' : isAdded ? '✓ Masuk keranjang' : '+ Tambah'}</button>
      </div>
    </div>
  );
}