"use client";

import { useState } from 'react';
import ProductCard from './ProductCard';

export default function CatalogBrowser({ products }: { products: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");

  const categoryMeta = [
    { id: "Semua", label: "Semua", icon: "🔥" },
    { id: "Pasta", label: "Pasta", icon: "🍝" },
    { id: "Kebab", label: "Kebab", icon: "🌯" },
    { id: "Durian", label: "Durian", icon: "🍈" },
    { id: "Pempek", label: "Pempek", icon: "🥟" },
    { id: "Lauk & Cemilan", label: "Lauk & Cemilan", icon: "🍗" }
  ];

  const categories = categoryMeta.filter(c => c.id !== "Semua").map(c => c.id);

  const getProductsByCategory = (cat: string) => {
    return products.filter((p) => {
      const nameLower = p.name.toLowerCase();
      if (cat === "Pasta") return nameLower.includes("pasta");
      if (cat === "Kebab") return nameLower.includes("kebab");
      if (cat === "Durian") return nameLower.includes("durian");
      if (cat === "Pempek") return nameLower.includes("pempek");
      if (cat === "Lauk & Cemilan") {
        return !nameLower.includes("pasta") && 
               !nameLower.includes("kebab") && 
               !nameLower.includes("durian") && 
               !nameLower.includes("pempek");
      }
      return true; 
    });
  };

  const isSearching = searchQuery.trim() !== "";
  const searchResults = isSearching 
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="w-full">
      
      {/* AREA PINTAR (SEARCH & MENU KAPSUL) */}
      <div className="mb-12 space-y-6">
        
        {/* Kolom Pencarian */}
        <div className="relative max-w-xl mx-auto">
          <input 
            type="text" 
            placeholder="Cari menu (misal: Lasagna, Ayam)..." 
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700 transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 absolute left-4 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Tombol Kapsul (Visual Menu FOMO Upgrade - Avatar Pill) */}
        {!isSearching && (
          <div className="flex overflow-x-auto gap-3 pb-4 custom-scrollbar justify-start md:justify-center px-2 pt-2">
            {categoryMeta.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                // RESOLUSI UX: Padding asimetris (kiri sempit, kanan lebar) menciptakan bentuk pil modern
                className={`flex items-center gap-3 whitespace-nowrap pl-1.5 pr-5 py-1.5 rounded-full text-sm font-black transition-all duration-300 ${
                  activeCategory === cat.id 
                    ? "bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-[0_4px_15px_rgba(37,99,235,0.4)] scale-105 border border-transparent" 
                    : "bg-white text-gray-900 border-2 border-gray-100 shadow-[0_4px_10px_rgba(0,0,0,0.06)] hover:border-blue-200 hover:text-blue-700 hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                {/* RESOLUSI UX: Membungkus Emoji dengan Lingkaran (Avatar) */}
                <div className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors shadow-inner ${
                  activeCategory === cat.id
                    ? "bg-white/20"
                    : "bg-blue-50"
                }`}>
                  <span className="text-xl leading-none">{cat.icon}</span>
                </div>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* AREA ETALASE PRODUK */}
      {isSearching ? (
        searchResults.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300">
             <p className="text-gray-500 font-bold">Menu "{searchQuery}" tidak ditemukan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {searchResults.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )
      ) : activeCategory === "Semua" ? (
        <div className="space-y-12">
          {categories.map(cat => {
             const catProducts = getProductsByCategory(cat);
             if (catProducts.length === 0) return null;
             
             const meta = categoryMeta.find(c => c.id === cat);
             
             return (
               <div key={cat} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-100">
                    <span className="text-3xl">{meta?.icon}</span>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{cat}</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {catProducts.map(p => <ProductCard key={p.id} product={p} />)}
                  </div>
               </div>
             )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {getProductsByCategory(activeCategory).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

    </div>
  );
}