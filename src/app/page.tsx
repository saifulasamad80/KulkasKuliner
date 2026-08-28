import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import FloatingCart from '@/components/FloatingCart';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="p-10 text-center">
        <div className="inline-block bg-red-100 text-red-700 px-4 py-2 rounded font-bold">
          CRITICAL ERROR: Gagal memuat katalog dari Supabase.<br/>
          <span className="text-sm font-normal">{error.message}</span>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="p-10 text-center text-gray-500 font-medium">
        Katalog kosong.
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50 relative">
      <header className="mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">KulkasKuliner</h1>
        <p className="text-gray-500 mt-1">Katalog Frozen Food Fresh - Langsung dari Gudang</p>
      </header>

      {/* Grid Katalog (Panggil Client Component) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {/* Indikator Keranjang */}
      <FloatingCart />
    </main>
  );
}