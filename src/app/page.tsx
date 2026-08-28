import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import FloatingCart from '@/components/FloatingCart';

export const revalidate = 60;

export default async function Home() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    return <div className="p-10 text-center text-red-500 font-bold">Gagal memuat katalog: {error.message}</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* 1. HERO SECTION (Desain Split Grid Baru) */}
      <section className="bg-[#1e3a8a] text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 flex flex-col md:flex-row items-center gap-10 lg:gap-16">
          
          {/* Sisi Kiri: Foto Utama */}
          <div className="w-full md:w-1/2 flex justify-center order-1 md:order-1 relative">
            <div className="relative w-full max-w-sm lg:max-w-md aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-yellow-400 transform hover:scale-[1.02] transition-transform duration-300">
              {/* PERBAIKAN: Path gambar disesuaikan dengan nama file lu */}
              <img 
                src="/kulkul.jpeg" 
                alt="Kulkas Kuliner Jakarta Timur" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl"></div>
            </div>
          </div>

          {/* Sisi Kanan: Teks & Call to Action */}
          <div className="w-full md:w-1/2 text-center md:text-left flex flex-col items-center md:items-start order-2 md:order-2">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 leading-tight">
              Stok Dapur Premium, <br/>
              <span className="text-yellow-400">Langsung Jalan!</span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl font-medium mb-8 leading-relaxed text-blue-100 max-w-lg">
              Solusi andalan keluarga di Jakarta Timur. Dari Pempek, Durian, Bebek, sampai stok *frozen food* harian—semua siap diantar ke depan pintu Anda hari ini.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a 
                href="#katalog" 
                className="bg-yellow-400 text-blue-900 px-8 py-4 rounded-full font-black text-lg hover:bg-yellow-300 transition-all hover:scale-105 shadow-lg text-center"
              >
                👇 Pesan Sekarang
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* 2. KATALOG SECTION */}
      <section id="katalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-4 scroll-mt-10">
        <div className="flex items-center justify-between mb-8 border-b-2 border-gray-200 pb-4">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Katalog Produk</h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider hidden sm:inline-block">
            Stok Real-Time
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products?.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <FloatingCart />

      {/* FOOTER & PINTU BELAKANG ADMIN */}
      <footer className="mt-20 border-t border-gray-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-xs text-gray-400 font-medium">
          <p>© 2026 KulkasKuliner. All rights reserved.</p>
          {/* Link Admin Menyamar (Security through Obscurity) */}
          <a 
            href="/admin" 
            className="hover:text-gray-600 transition-colors opacity-40 hover:opacity-100"
            title="System Ops"
          >
            System Ops
          </a>
        </div>
      </footer>
    </main>
  );
}