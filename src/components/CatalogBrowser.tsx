"use client";

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { supabase } from '@/lib/supabase';

export default function CatalogBrowser({ products }: { products: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");
  
  const [liveProducts, setLiveProducts] = useState(products);

  useEffect(() => {
    setLiveProducts(products);

    const fetchFreshestData = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (data && !error) {
        setLiveProducts(data); 
      }
    };
    fetchFreshestData();

    const channel = supabase
      .channel('public:products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' }, 
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setLiveProducts((current) => 
              current.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p))
            );
          } else if (payload.eventType === 'INSERT') {
            setLiveProducts((current) => [...current, payload.new]);
          } else if (payload.eventType === 'DELETE') {
            setLiveProducts((current) => current.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [products]);

  // INJEKSI UPDATE: Ubah label tombol biar pembeli gak bingung
  const categoryMeta = [
    { id: "Semua", label: "All" }, 
    { id: "Pasta", label: "Pasta & Pizza" }, 
    { id: "Kebab", label: "Kebab" },
    { id: "Durian", label: "Durian" },
    { id: "Pempek", label: "Pempek" },
    { id: "Lauk & Cemilan", label: "Lauk & Cemilan" }
  ];

  const categories = categoryMeta.filter(c => c.id !== "Semua").map(c => c.id);

  const popularProducts = [...liveProducts]
    .sort((a, b) => (Number(b.rating_avg) || 0) - (Number(a.rating_avg) || 0))
    .slice(0, 4);

  // INJEKSI ALGORITMA: Tambahin kata kunci "pizza" masuk ke kategori Pasta
  const getProductsByCategory = (cat: string) => {
    return liveProducts.filter((p) => {
      const nameLower = p.name.toLowerCase();
      
      if (cat === "Pasta") return nameLower.includes("pasta") || nameLower.includes("pizza");
      if (cat === "Kebab") return nameLower.includes("kebab");
      if (cat === "Durian") return nameLower.includes("durian");
      if (cat === "Pempek") return nameLower.includes("pempek");
      if (cat === "Lauk & Cemilan") {
        return !nameLower.includes("pasta") && 
               !nameLower.includes("pizza") && 
               !nameLower.includes("kebab") && 
               !nameLower.includes("durian") && 
               !nameLower.includes("pempek");
      }
      return true; 
    });
  };

  const isSearching = searchQuery.trim() !== "";
  const searchResults = isSearching 
    ? liveProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="w-full">
      
      <div className="mb-8 space-y-4">
        
        <div className="relative max-w-xl mx-auto">
          <input 
            type="text" 
            placeholder="Search for frozen food or meals..." 
            className="w-full pl-11 pr-4 py-[10px] bg-white border-none rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] focus:ring-2 focus:ring-red-600 outline-none text-gray-700 text-[14px] transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-4 top-[11px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {!isSearching && (
          <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar justify-start md:justify-center px-1">
            {categoryMeta.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all ${
                  activeCategory === cat.id 
                    ? "bg-red-600 text-white shadow-sm" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {isSearching ? (
        searchResults.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-gray-100">
             <p className="text-gray-500 font-medium">Menu tidak ditemukan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {searchResults.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )
      ) : activeCategory === "Semua" ? (
        <div className="space-y-10">
          
          {popularProducts.length > 0 && (
            <div className="pt-2">
              <h3 className="text-[18px] font-bold text-gray-900 mb-4 px-1 flex items-center gap-2">
                Popular Menu 
                <span className="text-red-500 text-[14px]">🔥</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {popularProducts.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          )}

          {categories.map(cat => {
             const catProducts = getProductsByCategory(cat);
             if (catProducts.length === 0) return null;
             
             return (
               <div key={cat} className="pt-4 border-t border-gray-100">
                  <h3 className="text-[18px] font-bold text-gray-900 mb-4 px-1">
                     {/* Ubah text judul rak untuk khusus kategori Pasta */}
                     {cat === "Pasta" ? "Pasta & Pizza" : cat}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {catProducts.map(p => <ProductCard key={p.id} product={p} />)}
                  </div>
               </div>
             )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {getProductsByCategory(activeCategory).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

    </div>
  );
}