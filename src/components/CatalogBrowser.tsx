"use client";

import { useState } from 'react';
import ProductCard from './ProductCard';

export default function CatalogBrowser({ products }: { products: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");

  const categories = ["Pasta", "Kebab", "Durian", "Pempek", "Lauk & Cemilan"];
  const displayCategories = ["Semua", ...categories];

  // Mesin Logika Klasifikasi Produk
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
      return true; // Untuk "Semua"
    });
  };

  const isSearching = searchQuery.trim() !== "";
  const searchResults = isSearching 
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="w-full">
      
      {/* AREA PINTAR (SEARCH & MENU KAPSUL) */}
      <div className="mb-10 space-y-6">
        
        {/* Kolom Pencarian */}
        <div className="relative max-w-xl mx-auto">
          <input 
            type="text" 
            placeholder="Cari menu (misal: Lasagna, Ayam)..." 
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-300 rounded-full shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700 transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 absolute left-4 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Tombol Kapsul (Visual Menu untuk Pelanggan Baru) */}
        {!isSearching && (
          <div className="flex overflow-x-auto gap-2.5 pb-2 custom-scrollbar justify-start md:justify-center px-2">
            {displayCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-black transition-all shadow-sm ${
                  activeCategory === cat 
                    ? "bg-blue-600 text-white border-2 border-blue-600 scale-105" 
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* AREA ETALASE PRODUK */}
      {isSearching ? (
        // MODE 1: Hasil Pencarian
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
        // MODE 2: Etalase Terkelompok (GoFood Style - Sangat memanjakan mata pelanggan baru)
        <div className="space-y-12">
          {categories.map(cat => {
             const catProducts = getProductsByCategory(cat);
             if (catProducts.length === 0) return null;
             return (
               <div key={cat} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-100">
                    <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
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
        // MODE 3: Fokus 1 Kategori (Jika Chip diklik)
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {getProductsByCategory(activeCategory).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

    </div>
  );
}