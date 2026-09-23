"use client";

import type { useProductForm } from '@/hooks/useProductForm';

type ProductEditFormProps = {
  form: ReturnType<typeof useProductForm>;
  uploadingImage: boolean;
  isSaving: boolean;
  isVariant: boolean;
  onSave: () => void;
  onCancel: () => void;
  onUploadImage: (file: File) => void;
};

const inputClass = 'min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base font-semibold text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100';
const labelClass = 'mb-1.5 block text-sm font-black text-slate-800';

export default function ProductEditForm({ form, uploadingImage, isSaving, isVariant, onSave, onCancel, onUploadImage }: ProductEditFormProps) {
  const isBusy = uploadingImage || isSaving;

  return (
    <div className="-mx-1 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-[0_14px_35px_-28px_rgba(37,99,235,0.7)] sm:-mx-2">
      <div className="bg-linear-to-r from-blue-700 to-cyan-600 px-4 py-4 text-white">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-100">Edit Produk</p>
        <h4 className="mt-0.5 text-xl font-black">{isVariant ? 'Atur varian ini' : 'Perbarui menu'}</h4>
        <p className="mt-1 text-sm leading-5 text-blue-50/90">{isVariant ? 'Perubahan harga dan stok cuma berlaku buat varian ini.' : 'Cek ulang informasi sebelum menyimpan.'}</p>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <section className="space-y-4">
          {isVariant && (
            <label className="block">
              <span className={labelClass}>Nama menu utama</span>
              <input type="text" maxLength={120} placeholder="Contoh: Ayam Ungkep" className={inputClass} value={form.value.menu_name} onChange={(event) => form.setField('menu_name', event.target.value)} />
              <span className="mt-1.5 block text-xs font-medium leading-5 text-amber-700">Mengubah nama ini ikut memindahkan varian ke kelompok menu yang dipilih.</span>
            </label>
          )}

          <div className={`grid grid-cols-1 gap-4 ${isVariant ? 'min-[560px]:grid-cols-2' : ''}`}>
            <label className="block">
              <span className={labelClass}>{isVariant ? 'Nama produk internal' : 'Nama menu'}</span>
              <input type="text" maxLength={120} placeholder="Nama produk" className={inputClass} value={form.value.name} onChange={(event) => form.setField('name', event.target.value)} />
              {isVariant && <span className="mt-1.5 block text-xs font-medium leading-5 text-slate-500">Dipakai di data pesanan lama dan pencarian admin.</span>}
            </label>
            {isVariant && (
              <label className="block">
                <span className={labelClass}>Nama varian yang dilihat pembeli</span>
                <input type="text" maxLength={120} placeholder="Contoh: Isi 4" className={inputClass} value={form.value.variant_name} onChange={(event) => form.setField('variant_name', event.target.value)} />
              </label>
            )}
          </div>

          <label className="block">
            <span className={labelClass}>Deskripsi singkat <span className="font-semibold text-slate-400">(opsional)</span></span>
            <span className="relative block">
              <textarea rows={3} maxLength={90} placeholder="Deskripsi menu" className={`${inputClass} min-h-24 resize-y pb-8 pr-14`} value={form.value.description} onChange={(event) => form.setField('description', event.target.value)} />
              <span className={`absolute bottom-3 right-3 text-xs font-black ${form.value.description.length >= 90 ? 'text-red-600' : 'text-slate-400'}`}>{form.value.description.length}/90</span>
            </span>
          </label>
        </section>

        <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <h5 className="mb-3 text-base font-black text-slate-950">Harga dan stok</h5>
          <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2">
            <label className="block"><span className={labelClass}>Harga jual</span><span className="relative block"><span className="pointer-events-none absolute left-3.5 top-3.5 text-sm font-black text-slate-500">Rp</span><input type="number" min="1" inputMode="numeric" className={`${inputClass} pl-10`} value={form.value.price || ''} onChange={(event) => form.setField('price', Number(event.target.value))} /></span></label>
            <label className="block"><span className={labelClass}>Stok tersedia</span><input type="number" min="0" inputMode="numeric" className={inputClass} value={form.value.stock} onChange={(event) => form.setField('stock', Number(event.target.value))} /></label>
            <label className="block"><span className={labelClass}>Modal (harga beli) <span className="font-semibold text-slate-400">(opsional)</span></span><span className="relative block"><span className="pointer-events-none absolute left-3.5 top-3.5 text-sm font-black text-slate-500">Rp</span><input type="number" min="0" inputMode="numeric" className={`${inputClass} pl-10`} value={form.value.cost_price || ''} onChange={(event) => form.setField('cost_price', Number(event.target.value))} /></span><span className="mt-1.5 block text-xs font-medium leading-5 text-slate-500">Dipakai buat hitung keuntungan bersih di Modul Laporan.</span></label>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div><h5 className="text-base font-black text-slate-950">Foto produk</h5><p className="mt-1 text-sm text-slate-600">Biarkan kalau fotonya nggak perlu diganti.</p></div>
          <label className="block"><span className={labelClass}>Pilih foto baru</span><input type="file" accept="image/jpeg,image/png,image/webp" disabled={isBusy} onChange={(event) => { const file = event.target.files?.[0]; if (file) onUploadImage(file); }} className="block min-h-12 w-full cursor-pointer rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 file:mr-3 file:min-h-12 file:border-0 file:bg-slate-900 file:px-4 file:text-sm file:font-black file:text-white disabled:opacity-50" /></label>
          <label className="block"><span className={labelClass}>URL foto</span><input type="url" placeholder="https://..." className={inputClass} value={form.value.image_url} onChange={(event) => form.changeImageUrl(event.target.value)} /></label>
          {form.value.image_url && <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"><img src={form.value.image_url} alt="Pratinjau foto produk" className="h-16 w-16 rounded-xl border border-slate-200 object-cover" /><div className="min-w-0 flex-1"><p className="text-sm font-black text-slate-900">Foto saat ini</p><p className="truncate text-xs text-slate-500">{form.value.image_url}</p></div><button type="button" disabled={isBusy} onClick={() => void form.removeImage()} className="min-h-11 rounded-xl bg-red-50 px-3 text-sm font-black text-red-600 hover:bg-red-100 disabled:opacity-50">Hapus</button></div>}
        </section>

        <div className="sticky bottom-3 z-10 grid grid-cols-1 gap-2 rounded-2xl border border-blue-100 bg-white/95 p-2 shadow-[0_16px_35px_-18px_rgba(15,23,42,0.55)] backdrop-blur min-[420px]:grid-cols-2 sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <button type="button" disabled={isBusy} onClick={onSave} className="min-h-12 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50">{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
          <button type="button" disabled={isBusy} onClick={onCancel} className="min-h-12 rounded-xl bg-slate-200 px-4 text-sm font-black text-slate-800 transition hover:bg-slate-300 disabled:opacity-50">Batal</button>
        </div>
      </div>
    </div>
  );
}