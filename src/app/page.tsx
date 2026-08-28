import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import FloatingCart from '@/components/FloatingCart';

// RESOLUSI PRF-01: Incremental Static Regeneration (Cache 60 Detik)
export const revalidate = 60;

export default async function Home() {
  // RESOLUSI LOGIC LEAK: Filter mutlak is_active = true
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true) // <-- INI ADALAH GEMBOKNYA. Jangan pernah dihapus.
    .order('name', { ascending: true });

  if (error) {
    console.error("Gagal menarik data produk:", error);
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 shadow-sm text-center">
          <h2 className="font-bold text-xl mb-2">Koneksi Database Terputus</h2>
          <p>Gagal memuat katalog KulkasKuliner. Silakan muat ulang halaman.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* HERO SECTION */}
      <section className="bg-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
           <img src="/kulkul.jpeg" alt="Background" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight drop-shadow-md">KulkasKuliner Jakarta Timur</h1>
          <p className="text-lg md:text-xl font-medium text-blue-100 max-w-2xl mx-auto mb-8 drop-shadow">
            Distributor Frozen Food Premium & Praktis. Solusi bekal keluarga dan stok dapur harian Anda.
          </p>
          <a href="#katalog" className="inline-block bg-yellow-400 text-blue-900 font-black px-8 py-3.5 rounded-full hover:bg-yellow-300 transition-colors shadow-lg transform hover:scale-105 duration-200">
            LIHAT KATALOG
          </a>
        </div>
      </section>

      {/* KATALOG SECTION */}
      <section id="katalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Katalog Produk</h2>
          <div className="w-24 h-1.5 bg-blue-600 mx-auto mt-4 rounded-full"></div>
        </div>

        {(!products || products.length === 0) ? (
          <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-500 font-medium text-lg">Semua produk sedang habis atau diarsipkan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <FloatingCart />
    </main>
  );
}