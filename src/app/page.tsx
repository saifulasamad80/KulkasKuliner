import { supabase } from '@/lib/supabase';
import HeaderCart from '@/components/HeaderCart'; // INJEKSI KERANJANG HEADER
import Link from 'next/link';
import PwaInstallButton from '@/components/PwaInstallButton';
import CatalogBrowser from '@/components/CatalogBrowser';

export const revalidate = 60;

export default async function Home() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true) 
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
    <main className="min-h-screen bg-white relative pb-20">
      
      {/* BANNER PROMO */}
      <div className="bg-orange-600 text-white text-[12px] md:text-sm font-bold text-center py-2.5 px-4 shadow-sm relative z-50">
        🔥 PROMO HARI INI: Order via Website masuk antrean VIP & dapat Subsidi Ongkir!
      </div>

      {/* HEADER NAVIGASI ALA FOODDASH DENGAN KERANJANG BARU */}
      <header className="bg-white sticky top-0 z-40 border-b border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[65px] flex items-center justify-between">
          <div className="font-black text-2xl tracking-tight text-gray-900">
            <span className="text-red-600">Kulkas</span>Kuliner
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/admin" className="text-[12px] font-bold text-gray-500 hover:text-red-600 transition-colors bg-gray-50 hover:bg-red-50 px-3.5 py-1.5 rounded-full border border-gray-200 hover:border-red-200 active:scale-95 hidden sm:block">
              Login Admin
            </Link>
            {/* KERANJANG SEKARANG BERADA DI ATAS SINI */}
            <HeaderCart /> 
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="bg-white pt-8 pb-12 md:pt-16 md:pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            
            <div className="text-center md:text-left z-10 order-2 md:order-1">
               <h1 className="text-4xl md:text-5xl lg:text-[54px] font-black text-gray-900 leading-[1.1] mb-5 tracking-tight">
                  Stok Dapur Aman,<br/>
                  <span className="text-red-600 drop-shadow-sm">Perut Kenyang.</span>
               </h1>
               <p className="text-gray-600 text-[15px] md:text-[17px] mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed font-medium">
                  Distributor Frozen Food Premium Jakarta Timur. Sedia pempek, durian, bebek bumbu hitam, dan aneka lauk praktis keluarga. Pesan sekarang, kurir instan langsung jalan!
               </p>
               
               <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 md:gap-4">
                  <a href="#katalog" className="w-full sm:w-auto bg-red-600 text-white font-bold text-[15px] px-8 py-3.5 rounded-full hover:bg-red-700 transition-all active:scale-[0.96] shadow-[0_4px_14px_0_rgb(220,38,38,0.39)] flex items-center justify-center gap-2">
                     Pesan Sekarang
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                     </svg>
                  </a>
                  <PwaInstallButton />
               </div>
            </div>
            
            <div className="relative z-10 w-full max-w-[400px] mx-auto md:max-w-none aspect-square md:aspect-[4/3] rounded-[24px] overflow-hidden shadow-2xl border-4 border-white transform md:rotate-2 hover:rotate-0 transition-transform duration-500 order-1 md:order-2">
               <img src="/kulkul.jpeg" alt="Frozen Food KulkasKuliner" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none"></div>
            </div>
         </div>
      </section>

      {/* CATALOG SECTION */}
      <section id="katalog" className="bg-gray-50 pt-10 pb-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 px-1">
            <h2 className="text-2xl md:text-[28px] font-black text-gray-900 tracking-tight">Menu Andalan Kami</h2>
            <p className="text-gray-500 text-sm mt-1 font-medium">Pilih menu favorit keluarga Anda hari ini.</p>
          </div>

          {(!products || products.length === 0) ? (
            <div className="bg-white p-12 text-center rounded-[16px] shadow-sm border border-gray-200 mt-6">
              <p className="text-gray-500 font-medium text-lg">Semua produk sedang habis atau diarsipkan.</p>
            </div>
          ) : (
            <CatalogBrowser products={products} />
          )}
        </div>
      </section>

      {/* FLOATING CART DIHAPUS DARI SINI */}
      
    </main>
  );
}