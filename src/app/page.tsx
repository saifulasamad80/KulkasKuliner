import { supabase } from '@/lib/supabase';

// Memaksa Next.js untuk selalu mengambil data terbaru (No Static Caching)
// Ini krusial agar perubahan stok di Supabase langsung terlihat saat halaman di-refresh.
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch data langsung di level Server Component
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="p-10 text-center">
        <div className="inline-block bg-red-100 text-red-700 px-4 py-2 rounded font-bold">
          CRITICAL ERROR: Gagal memuat katalog dari Supabase.
          <br />
          <span className="text-sm font-normal">{error.message}</span>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="p-10 text-center text-gray-500 font-medium">
        Katalog kosong. Pastikan Anda sudah menjalankan INSERT SQL di Supabase.
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50">
      <header className="mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">KulkasKuliner</h1>
        <p className="text-gray-500 mt-1">Katalog Frozen Food Fresh - Langsung dari Gudang</p>
      </header>

      {/* Grid Katalog */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((p) => (
          <div key={p.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col hover:shadow-md transition-shadow">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-800 leading-snug">{p.name}</h2>
              <p className="text-2xl font-black text-blue-600 mt-3">
                Rp {p.price.toLocaleString('id-ID')}
              </p>
              
              <div className="mt-3">
                {p.stock > 0 ? (
                  <span className="inline-flex items-center text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                    Stok Tersedia: {p.stock}
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>
                    Stok Habis
                  </span>
                )}
              </div>
            </div>

            {/* Tombol Add to Cart (UI Only saat ini) */}
            <button
              disabled={p.stock === 0}
              className={`mt-6 w-full py-2.5 rounded-lg font-bold transition-all duration-200 ${
                p.stock > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-sm'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {p.stock > 0 ? 'Tambah ke Keranjang' : 'Barang Kosong'}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}