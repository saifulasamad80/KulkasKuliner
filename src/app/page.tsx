import { supabase } from '@/lib/supabase';
import FloatingCart from '@/components/FloatingCart';
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
      
      {/* SENJATA PSIKOLOGIS 3: BANNER FOMO VIP & ONGKIR */}
      <div className="bg-orange-600 text-white text-[12px] md:text-sm font-bold text-center py-2.5 px-4 shadow-sm relative z-50">
        🔥 PROMO HARI INI: Order via Website masuk antrean VIP & dapat Subsidi Ongkir!
      </div>

      {/* HEADER NAVIGASI ALA FOODDASH */}
      <header className="bg-white sticky top-0 z-40 border-b border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[60px] flex items-center justify-between">
          {/* Logo Typography Modern */}
          <div className="font-black text-2xl tracking-tight text-gray-900">
            <span className="text-red-600">Kulkas</span>Kuliner
          </div>
          {/* Tombol Login Admin Tersembunyi (Ghost Button) */}
          <Link href="/admin" className="text-[12px] font-bold text-gray-500 hover:text-red-600 transition-colors bg-gray-50 hover:bg-red-50 px-4 py-2 rounded-full border border-gray-200 hover:border-red-200 active:scale-95">
            Login Admin
          </Link>
        </div>
      </header>

      {/* HERO SECTION: BERSIH, TERANG, MERAH MENGGODA */}
      <section className="bg-white pt-8 pb-12 md:pt-16 md:pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            
            {/* Teks Penawaran Utama */}
            <div className="text-center md:text-left z-10 order-2 md:order-1">
               <h1 className="text-4xl md:text-5xl lg:text-[54px] font-black text-gray-900 leading-[1.1] mb-5 tracking-tight">
                  Stok Dapur Aman,<br/>
                  <span className="text-red-600 drop-shadow-sm">Perut Kenyang.</span>
               </h1>
               <p className="text-gray-600 text-[15px] md:text-[17px] mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed font-medium">
                  Distributor Frozen Food Premium Jakarta Timur. Sedia pempek, durian, bebek bumbu hitam, dan aneka lauk praktis keluarga. Pesan sekarang, kurir instan langsung jalan!
               </p>
               
               <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 md:gap-4">
                  {/* FOODDASH CTA: Pill Shape, Red Primary */}
                  <a href="#katalog" className="w-full sm:w-auto bg-red-600 text-white font-bold text-[15px] px-8 py-3.5 rounded-full hover:bg-red-700 transition-all active:scale-[0.96] shadow-[0_4px_14px_0_rgb(220,38,38,0.39)] flex items-center justify-center gap-2">
                     Pesan Sekarang
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                     </svg>
                  </a>
                  <PwaInstallButton />
               </div>
            </div>
            
            {/* Gambar Maskot/Hero dengan gaya membulat & miring */}
            <div className="relative z-10 w-full max-w-[400px] mx-auto md:max-w-none aspect-square md:aspect-[4/3] rounded-[24px] overflow-hidden shadow-2xl border-4 border-white transform md:rotate-2 hover:rotate-0 transition-transform duration-500 order-1 md:order-2">
               <img src="/kulkul.jpeg" alt="Frozen Food KulkasKuliner" className="w-full h-full object-cover" />
               {/* Overlay Tipis */}
               <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none"></div>
            </div>
         </div>

         {/* Dekorasi Glow Latar Belakang */}
         <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-red-500/5 blur-[80px] z-0 pointer-events-none"></div>
         <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-orange-500/5 blur-[80px] z-0 pointer-events-none"></div>
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-gray-500 font-medium text-lg">Semua produk sedang habis atau diarsipkan.</p>
            </div>
          ) : (
            <CatalogBrowser products={products} />
          )}
        </div>
      </section>

      <FloatingCart />
      
    </main>
  );
}