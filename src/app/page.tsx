import { supabase } from '@/lib/supabase';
import HeaderCart from '@/components/HeaderCart'; 
import FloatingCart from '@/components/FloatingCart';
import PwaInstallButton from '@/components/PwaInstallButton';
import CatalogBrowser from '@/components/CatalogBrowser';
import FavoriteMenusSection from '@/components/FavoriteMenusSection';
import type { Product } from '@/lib/types';
import { getFavoriteMenus } from '@/lib/favorite-menus';

export const revalidate = 60;

export default async function Home() {
  const groupedResult = await supabase
    .from('products')
    .select('id, name, price, stock, image_url, is_active, description, menu_id, variant_name, menus(id, name, description, image_url, is_active)')
    .eq('is_active', true) 
    .order('name', { ascending: true });
  let products: Product[] = (groupedResult.data ?? []) as unknown as Product[];
  let error = groupedResult.error;

  // Migration katalog dijalankan terpisah dari deploy aplikasi. Selama schema
  // belum punya menus, katalog legacy tetap harus bisa dirender.
  if (error) {
    const legacyResult = await supabase
      .from('products')
      .select('id, name, price, stock, image_url, is_active, description')
      .eq('is_active', true)
      .order('name', { ascending: true });
    products = (legacyResult.data ?? []) as Product[];
    error = legacyResult.error;
  }

  const favoriteMenus = await getFavoriteMenus(products);

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
    <main className="min-h-screen overflow-hidden bg-[#fffaf5] pb-24 text-[#171717]">
      
      <div className="relative z-50 flex items-center justify-center gap-2 bg-[#171717] px-4 py-2.5 text-center text-[11px] font-bold tracking-[0.08em] text-white sm:text-xs">
        <span className="text-orange-400">✦</span><span>PROMO HARI INI</span><span className="hidden font-medium text-white/80 sm:inline">· Harga spesial, stok siap, kirim cepat via WhatsApp.</span>
      </div>

      <header className="sticky top-0 z-40 border-b border-black/6 bg-[#fffaf5]/90 shadow-[0_8px_30px_rgba(91,44,16,0.05)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16.25 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-black text-[21px] tracking-tighter sm:text-2xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dc2626] text-xl text-white shadow-[0_8px_18px_rgba(220,38,38,0.25)]">✦</span>
            <span><span className="text-[#dc2626]">Kulkas</span>Kuliner</span>
          </div>
          
          {/* PERBAIKAN: Tombol Admin Dihapus. Hanya ada ikon keranjang. */}
          <div className="flex items-center gap-3 md:gap-6">
            <a href="#katalog" className="hidden text-sm font-bold text-[#6b625c] transition-colors hover:text-[#dc2626] sm:inline">Lihat menu</a>
            <HeaderCart /> 
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-[#fffaf5] px-4 pb-14 pt-10 sm:px-6 sm:pt-14 lg:px-8 lg:pb-20 lg:pt-20">
         <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            
            <div className="z-10 order-2 text-center lg:order-1 lg:text-left">
               <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/75 px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-[0.13em] text-orange-700 shadow-sm"><span className="h-2 w-2 animate-pulse rounded-full bg-green-500" /> Stok fresh hari ini</div>
               <h1 className="text-[42px] font-black leading-[0.98] tracking-[-0.065em] text-[#171717] sm:text-6xl lg:text-[68px]">
                   Stok Kulkas Aman,<br/>
                   <span className="text-[#dc2626]">Perut Kenyang.</span>
               </h1>
               <p className="mx-auto mb-8 mt-6 max-w-lg text-[15px] font-medium leading-7 text-[#6b625c] lg:mx-0 sm:text-[17px]">
                  Frozen food premium buat stok rumah yang praktis. Pilih menu favorit, masukin keranjang, dan biar kami siapin sampai depan pintu.
               </p>
               
               <div className="flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                  <a href="#katalog" className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-[#dc2626] px-7 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(220,38,38,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#b91c1c] active:scale-[0.97] sm:w-auto">
                     Mulai belanja
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                     </svg>
                  </a>
                  <PwaInstallButton />
               </div>
               <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-bold text-[#81766e] lg:justify-start"><span>✦ Pilihan premium</span><span className="text-green-600">✓ Siap antar</span><span className="text-red-500">♥ Praktis dimasak</span></div>
            </div>
            
            <div className="relative z-10 order-1 mx-auto aspect-[1.18/1] w-full max-w-147.5 overflow-hidden rounded-[30px] border-[6px] border-white bg-[#f5dfca] shadow-[0_24px_55px_rgba(91,44,16,0.18)] transition-transform duration-500 hover:rotate-1 lg:order-2 lg:aspect-[1.3/1]">
               <img src="/kulkul.jpeg" alt="Pilihan frozen food KulkasKuliner" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
               <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/0 to-black/5 pointer-events-none"></div>
               <div className="absolute bottom-5 left-5 text-white sm:bottom-7 sm:left-7"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">KulkasKuliner</p><p className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Menu praktis, rasa serius.</p></div>
            </div>
         </div>
      </section>

      <section id="katalog" className="border-t border-black/4 bg-[#fffaf5] px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pt-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#dc2626]">Dari freezer ke meja makan</p><h2 className="text-3xl font-black tracking-tighter text-[#171717] sm:text-4xl">Menu andalan kami</h2><p className="mt-2 text-sm font-medium text-[#81766e]">Pilih stok favorit buat nemenin hari ini.</p></div>
            <div className="hidden rounded-2xl bg-orange-50 px-4 py-3 text-right sm:block"><p className="text-[10px] font-bold uppercase tracking-wider text-orange-700">Tips belanja</p><p className="mt-1 text-xs font-bold text-[#6b625c]">Ambil beberapa menu sekalian ✦</p></div>
          </div>

          {(!products || products.length === 0) ? (
            <div className="rounded-[26px] border border-dashed border-orange-200 bg-white p-12 text-center shadow-[0_10px_30px_rgba(91,44,16,0.05)]">
              <span className="text-4xl">🧊</span><p className="mt-4 text-lg font-black text-[#171717]">Freezer lagi diberesin</p><p className="mt-1 text-sm font-medium text-[#81766e]">Semua produk sedang habis atau diarsipkan.</p>
            </div>
          ) : (
            <>
              <FavoriteMenusSection favoriteMenus={favoriteMenus} />
              <CatalogBrowser products={products as Product[]} excludedMenuKeys={favoriteMenus.map((menu) => menu.key)} />
            </>
          )}
        </div>
      </section>
      <FloatingCart />
    </main>
  );
}
