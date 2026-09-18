import ProductCard from '@/components/ProductCard';
import type { FavoriteMenu } from '@/lib/types';

export default function FavoriteMenusSection({ favoriteMenus }: { favoriteMenus: FavoriteMenu[] }) {
  if (favoriteMenus.length === 0) return null;

  return (
    <section aria-labelledby="favorite-menus-heading" className="mb-12 rounded-[26px] border border-red-100 bg-linear-to-br from-red-50 via-white to-orange-50 p-4 shadow-[0_12px_35px_rgba(220,38,38,0.07)] sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#dc2626]">Paling sering dipilih</p>
          <h2 id="favorite-menus-heading" className="text-2xl font-black tracking-tighter text-[#171717] sm:text-3xl">Menu favorit pelanggan</h2>
          <p className="mt-1 text-sm font-medium text-[#81766e]">Urutan ini berdasarkan pesanan yang sudah dibayar atau selesai.</p>
        </div>
        <span className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-black text-red-700 shadow-sm">Top {favoriteMenus.length}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {favoriteMenus.map((menu) => (
          <div key={menu.key} className="relative">
            <ProductCard product={menu.products[0]} variants={menu.products} />
            <div className="pointer-events-none absolute right-2.5 top-2.5 z-10 rounded-full bg-[#171717]/85 px-2.5 py-1 text-[9px] font-black text-white shadow-sm">
              {menu.isFallback ? 'Pilihan siap stok' : `${menu.soldQuantity} terjual`}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}