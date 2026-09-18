"use client";

import { useEffect, useMemo, useState } from 'react';
import ProductCard from './ProductCard';
import { supabase } from '@/lib/supabase';
import { getProductMenu } from '@/lib/types';
import type { Product } from '@/lib/types';

function groupProducts(products: Product[]) {
  const groups = new Map<string, Product[]>();
  for (const product of products) {
    const key = product.menu_id || `product:${product.id}`;
    groups.set(key, [...(groups.get(key) ?? []), product]);
  }
  return [...groups.values()].map((variants) => variants.sort((a, b) => (a.variant_name || a.name).localeCompare(b.variant_name || b.name)));
}

function matchesCategory(product: Product, category: string) {
  const name = `${getProductMenu(product)?.name ?? ''} ${product.name}`.toLowerCase();
  if (category === 'Pasta') return name.includes('pasta') || name.includes('pizza');
  if (category === 'Kebab') return name.includes('kebab');
  if (category === 'Durian') return name.includes('durian');
  if (category === 'Pempek') return name.includes('pempek');
  if (category === 'Lauk & Cemilan') return !['pasta', 'pizza', 'kebab', 'durian', 'pempek'].some((word) => name.includes(word));
  return true;
}

export default function CatalogBrowser({ products }: { products: Product[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [liveProducts, setLiveProducts] = useState(products);

  useEffect(() => {
    const fetchFreshestData = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, stock, image_url, is_active, description, menu_id, variant_name, menus(id, name, description, image_url, is_active)')
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (data && !error) setLiveProducts(data as unknown as Product[]);
    };
    void fetchFreshestData();
    const channel = supabase.channel('public:products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => { void fetchFreshestData(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const grouped = useMemo(() => groupProducts(liveProducts), [liveProducts]);
  const categoryMeta = [
    { id: 'Semua', label: 'Semua', icon: '✦' }, { id: 'Pasta', label: 'Pasta & Pizza', icon: '🍕' }, { id: 'Kebab', label: 'Kebab', icon: '🌯' },
    { id: 'Durian', label: 'Durian', icon: '🥭' }, { id: 'Pempek', label: 'Pempek', icon: '🍽️' }, { id: 'Lauk & Cemilan', label: 'Lauk & Cemilan', icon: '🍱' },
  ];
  const isSearching = searchQuery.trim() !== '';
  const searchResults = grouped.filter((variants) => variants.some((product) => `${getProductMenu(product)?.name ?? ''} ${product.name} ${product.variant_name ?? ''}`.toLowerCase().includes(searchQuery.toLowerCase())));
  const categoryResults = (category: string) => grouped.filter((variants) => variants.some((product) => matchesCategory(product, category)));
  const renderGrid = (groups: Product[][]) => <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">{groups.map((variants) => <ProductCard key={variants[0].menu_id || variants[0].id} product={variants[0]} variants={variants} />)}</div>;

  return (
    <div className="w-full">
      <div className="mb-10 rounded-[26px] border border-black/6 bg-white p-3 shadow-[0_12px_35px_rgba(91,44,16,0.06)] sm:p-4">
        <div className="relative"><label htmlFor="catalog-search" className="sr-only">Cari produk</label><input id="catalog-search" type="search" enterKeyHint="search" placeholder="Cari frozen food, lauk, atau cemilan..." aria-label="Cari produk" className="h-12 w-full rounded-2xl border border-[#eee5df] bg-[#fffaf7] pl-11 pr-4 text-base font-semibold text-[#171717] outline-none transition focus:border-[#dc2626] focus:ring-4 focus:ring-red-100 sm:text-sm" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /><span className="absolute left-4 top-3 text-xl text-[#a99c93]">⌕</span></div>
        {!isSearching && <div className="custom-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">{categoryMeta.map((category) => { const count = category.id === 'Semua' ? grouped.length : categoryResults(category.id).length; return <button key={category.id} type="button" onClick={() => setActiveCategory(category.id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-extrabold transition-all sm:px-4 ${activeCategory === category.id ? 'bg-[#dc2626] text-white shadow-[0_7px_15px_rgba(220,38,38,0.2)]' : 'bg-[#f8f4f1] text-[#6b625c] hover:bg-orange-50 hover:text-[#dc2626]'}`}><span className="text-sm">{category.icon}</span>{category.label}<span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeCategory === category.id ? 'bg-white/20 text-white' : 'bg-white text-[#a99c93]'}`}>{count}</span></button>; })}</div>}
      </div>
      {isSearching ? (searchResults.length ? renderGrid(searchResults) : <div className="bg-white p-12 text-center rounded-xl border border-gray-100"><p className="text-gray-500 font-medium">Menu tidak ditemukan.</p></div>) : activeCategory === 'Semua' ? <div className="space-y-10">{categoryMeta.slice(1).map((category) => { const results = categoryResults(category.id); return results.length ? <section key={category.id} className="pt-4 border-t border-gray-100"><h3 className="text-[18px] font-bold text-gray-900 mb-4 px-1">{category.label}</h3>{renderGrid(results)}</section> : null; })}</div> : renderGrid(categoryResults(activeCategory))}
    </div>
  );
}