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
    { id: 'Semua', label: 'Semua' }, { id: 'Pasta', label: 'Pasta & Pizza' }, { id: 'Kebab', label: 'Kebab' },
    { id: 'Durian', label: 'Durian' }, { id: 'Pempek', label: 'Pempek' }, { id: 'Lauk & Cemilan', label: 'Lauk & Cemilan' },
  ];
  const isSearching = searchQuery.trim() !== '';
  const searchResults = grouped.filter((variants) => variants.some((product) => `${getProductMenu(product)?.name ?? ''} ${product.name} ${product.variant_name ?? ''}`.toLowerCase().includes(searchQuery.toLowerCase())));
  const categoryResults = (category: string) => grouped.filter((variants) => variants.some((product) => matchesCategory(product, category)));
  const renderGrid = (groups: Product[][]) => <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">{groups.map((variants) => <ProductCard key={variants[0].menu_id || variants[0].id} product={variants[0]} variants={variants} />)}</div>;

  return (
    <div className="w-full">
      <div className="mb-8 space-y-4">
        <div className="relative max-w-xl mx-auto"><input type="text" placeholder="Cari frozen food atau lauk..." aria-label="Cari produk" className="w-full pl-11 pr-4 py-[10px] bg-white border-none rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] focus:ring-2 focus:ring-red-600 outline-none text-gray-700 text-[14px]" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /><span className="absolute left-4 top-[9px] text-gray-400">⌕</span></div>
        {!isSearching && <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar justify-start md:justify-center px-1">{categoryMeta.map((category) => <button key={category.id} onClick={() => setActiveCategory(category.id)} className={`whitespace-nowrap px-4 py-2.5 rounded-full text-[13px] font-semibold ${activeCategory === category.id ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{category.label}</button>)}</div>}
      </div>
      {isSearching ? (searchResults.length ? renderGrid(searchResults) : <div className="bg-white p-12 text-center rounded-xl border border-gray-100"><p className="text-gray-500 font-medium">Menu tidak ditemukan.</p></div>) : activeCategory === 'Semua' ? <div className="space-y-10">{categoryMeta.slice(1).map((category) => { const results = categoryResults(category.id); return results.length ? <section key={category.id} className="pt-4 border-t border-gray-100"><h3 className="text-[18px] font-bold text-gray-900 mb-4 px-1">{category.label}</h3>{renderGrid(results)}</section> : null; })}</div> : renderGrid(categoryResults(activeCategory))}
    </div>
  );
}