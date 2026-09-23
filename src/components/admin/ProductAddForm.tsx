"use client";

import { useState } from 'react';
import type { CreateProductInput, ProductVariantInput } from '@/hooks/useAdminData';
import type { useProductForm } from '@/hooks/useProductForm';

type ProductAddFormProps = {
  form: ReturnType<typeof useProductForm>;
  uploadingImage: boolean;
  isSaving: boolean;
  onSubmit: (input: CreateProductInput) => void;
  onUploadImage: (file: File) => void;
};

type MenuMode = 'single' | 'variants';
type VariantDraft = ProductVariantInput & { id: number };

const inputClass = 'min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-base font-semibold text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100';
const labelClass = 'mb-1.5 block text-sm font-black text-slate-800';

function createVariant(id: number): VariantDraft {
  return { id, variant_name: '', price: 0, stock: 0, cost_price: 0 };
}

export default function ProductAddForm({ form, uploadingImage, isSaving, onSubmit, onUploadImage }: ProductAddFormProps) {
  const [mode, setMode] = useState<MenuMode>('single');
  const [variants, setVariants] = useState<VariantDraft[]>([createVariant(1), createVariant(2)]);
  const [nextVariantId, setNextVariantId] = useState(3);
  const isBusy = uploadingImage || isSaving;

  const changeMode = (nextMode: MenuMode) => {
    setMode(nextMode);
    if (nextMode === 'single') {
      form.setField('menu_name', '');
      form.setField('variant_name', '');
    } else {
      form.setField('menu_name', form.value.name);
    }
  };

  const updateVariant = (id: number, field: keyof ProductVariantInput, value: string | number) => {
    setVariants((current) => current.map((variant) => variant.id === id ? { ...variant, [field]: value } : variant));
  };

  const addVariant = () => {
    if (variants.length >= 25) return;
    setVariants((current) => [...current, createVariant(nextVariantId)]);
    setNextVariantId((current) => current + 1);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (mode === 'single') {
      if (form.value.name.trim().length < 2 || form.value.price <= 0 || form.value.stock < 0) {
        alert('Nama menu, harga, dan stok belum valid. Cek lagi, Bro.');
        return;
      }
      onSubmit({ ...form.value, name: form.value.name.trim(), menu_id: null, menu_name: null, variant_name: null });
      return;
    }

    const menuName = form.value.menu_name.trim();
    const normalizedVariants = variants.map(({ variant_name, price, stock, cost_price }) => ({ variant_name: variant_name.trim(), price, stock, cost_price }));
    const uniqueNames = new Set(normalizedVariants.map((variant) => variant.variant_name.toLocaleLowerCase('id-ID')));

    if (menuName.length < 2) return alert('Nama menu wajib diisi minimal 2 huruf.');
    if (normalizedVariants.length < 2) return alert('Menu bervarian wajib punya minimal 2 varian.');
    if (normalizedVariants.some((variant) => !variant.variant_name || variant.price <= 0 || variant.stock < 0)) {
      return alert('Setiap varian wajib punya nama, harga valid, dan stok minimal 0.');
    }
    if (uniqueNames.size !== normalizedVariants.length) return alert('Nama varian nggak boleh kembar dalam satu menu.');

    onSubmit({
      kind: 'variants',
      menu_name: menuName,
      image_url: form.value.image_url,
      description: form.value.description,
      variants: normalizedVariants,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-7 overflow-hidden rounded-3xl border border-green-200 bg-white shadow-[0_18px_45px_-30px_rgba(22,101,52,0.65)]">
      <div className="bg-linear-to-br from-green-700 via-green-600 to-emerald-500 px-4 py-5 text-white sm:px-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-green-100">Menu Baru</p>
        <h4 className="mt-1 text-2xl font-black tracking-tight">Mau jual menu seperti apa?</h4>
        <p className="mt-1 text-sm font-medium leading-5 text-green-50/90">Pilih jenisnya dulu. Form bakal menyesuaikan otomatis.</p>
      </div>

      <div className="space-y-6 p-4 sm:p-6">
        <fieldset>
          <legend className="mb-2 text-sm font-black text-slate-900">1. Pilih jenis menu</legend>
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
            <button type="button" aria-pressed={mode === 'single'} onClick={() => changeMode('single')} className={`min-h-20 rounded-2xl border-2 p-3.5 text-left transition ${mode === 'single' ? 'border-green-600 bg-green-50 ring-4 ring-green-100' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <span className="block text-base font-black text-slate-950">🍱 Menu biasa</span>
              <span className="mt-1 block text-sm leading-5 text-slate-600">Satu pilihan harga dan stok.</span>
            </button>
            <button type="button" aria-pressed={mode === 'variants'} onClick={() => changeMode('variants')} className={`min-h-20 rounded-2xl border-2 p-3.5 text-left transition ${mode === 'variants' ? 'border-violet-600 bg-violet-50 ring-4 ring-violet-100' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <span className="block text-base font-black text-slate-950">✨ Punya varian</span>
              <span className="mt-1 block text-sm leading-5 text-slate-600">Banyak pilihan, beda harga atau stok.</span>
            </button>
          </div>
        </fieldset>

        <section aria-labelledby="product-information-heading" className="space-y-4">
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">Langkah 2</p><h5 id="product-information-heading" className="text-lg font-black text-slate-950">Informasi utama</h5></div>
          <label className="block">
            <span className={labelClass}>{mode === 'variants' ? 'Nama menu yang dilihat pembeli' : 'Nama menu'}</span>
            <input type="text" required maxLength={120} placeholder={mode === 'variants' ? 'Contoh: Ayam Ungkep' : 'Contoh: Ati Ampela Ungkep'} className={inputClass} value={mode === 'variants' ? form.value.menu_name : form.value.name} onChange={(event) => mode === 'variants' ? form.setField('menu_name', event.target.value) : form.setField('name', event.target.value)} />
            <span className="mt-1.5 block text-xs font-medium leading-5 text-slate-500">{mode === 'variants' ? 'Cukup isi sekali. Semua varian bakal tampil di bawah menu ini.' : 'Pakai nama yang singkat dan gampang dicari pembeli.'}</span>
          </label>
          <label className="block">
            <span className={labelClass}>Deskripsi singkat <span className="font-semibold text-slate-400">(opsional)</span></span>
            <span className="relative block">
              <textarea rows={3} maxLength={90} placeholder="Contoh: Siap goreng, bumbu meresap, isi 4 potong." className={`${inputClass} min-h-24 resize-y pb-8 pr-14`} value={form.value.description} onChange={(event) => form.setField('description', event.target.value)} />
              <span className={`absolute bottom-3 right-3 text-xs font-black ${form.value.description.length >= 90 ? 'text-red-600' : 'text-slate-400'}`}>{form.value.description.length}/90</span>
            </span>
          </label>
        </section>

        {mode === 'single' ? (
          <section aria-labelledby="single-stock-heading" className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4"><p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">Langkah 3</p><h5 id="single-stock-heading" className="text-lg font-black text-slate-950">Harga dan stok</h5></div>
            <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2">
              <label className="block"><span className={labelClass}>Harga jual</span><span className="relative block"><span className="pointer-events-none absolute left-3.5 top-3.5 text-sm font-black text-slate-500">Rp</span><input type="number" required min="1" inputMode="numeric" placeholder="25000" className={`${inputClass} pl-10`} value={form.value.price || ''} onChange={(event) => form.setField('price', Number(event.target.value))} /></span></label>
              <label className="block"><span className={labelClass}>Stok tersedia</span><input type="number" required min="0" inputMode="numeric" placeholder="0" className={inputClass} value={form.value.stock} onChange={(event) => form.setField('stock', Number(event.target.value))} /></label>
              <label className="block"><span className={labelClass}>Modal (harga beli dari distributor) <span className="font-semibold text-slate-400">(opsional)</span></span><span className="relative block"><span className="pointer-events-none absolute left-3.5 top-3.5 text-sm font-black text-slate-500">Rp</span><input type="number" min="0" inputMode="numeric" placeholder="18000" className={`${inputClass} pl-10`} value={form.value.cost_price || ''} onChange={(event) => form.setField('cost_price', Number(event.target.value))} /></span><span className="mt-1.5 block text-xs font-medium leading-5 text-slate-500">Dipakai buat hitung keuntungan bersih di Modul Laporan.</span></label>
            </div>
          </section>
        ) : (
          <section aria-labelledby="variant-heading" className="rounded-2xl border border-violet-200 bg-violet-50/60 p-3.5 sm:p-4">
            <div className="mb-4 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-end min-[480px]:justify-between">
              <div><p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">Langkah 3</p><h5 id="variant-heading" className="text-lg font-black text-slate-950">Isi pilihan varian</h5><p className="mt-1 text-sm leading-5 text-slate-600">Harga dan stok diatur per pilihan.</p></div>
              <span className="w-fit rounded-full bg-violet-700 px-3 py-1.5 text-xs font-black text-white">{variants.length} varian</span>
            </div>
            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div key={variant.id} className="rounded-2xl border border-violet-200 bg-white p-3.5 shadow-sm sm:p-4">
                  <div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm font-black text-violet-800">Varian {index + 1}</p>{variants.length > 2 && <button type="button" onClick={() => setVariants((current) => current.filter((item) => item.id !== variant.id))} className="min-h-10 rounded-xl bg-red-50 px-3 text-sm font-black text-red-600 hover:bg-red-100">Hapus</button>}</div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,.85fr)_minmax(0,.6fr)_minmax(0,.85fr)]">
                    <label className="block"><span className={labelClass}>Nama varian</span><input type="text" required maxLength={120} placeholder="Contoh: Isi 2" className={inputClass} value={variant.variant_name} onChange={(event) => updateVariant(variant.id, 'variant_name', event.target.value)} /></label>
                    <label className="block"><span className={labelClass}>Harga jual</span><span className="relative block"><span className="pointer-events-none absolute left-3.5 top-3.5 text-sm font-black text-slate-500">Rp</span><input type="number" required min="1" inputMode="numeric" placeholder="25000" className={`${inputClass} pl-10`} value={variant.price || ''} onChange={(event) => updateVariant(variant.id, 'price', Number(event.target.value))} /></span></label>
                    <label className="block"><span className={labelClass}>Stok</span><input type="number" required min="0" inputMode="numeric" placeholder="0" className={inputClass} value={variant.stock} onChange={(event) => updateVariant(variant.id, 'stock', Number(event.target.value))} /></label>
                    <label className="block"><span className={labelClass}>Modal <span className="font-semibold text-slate-400">(opsional)</span></span><span className="relative block"><span className="pointer-events-none absolute left-3.5 top-3.5 text-sm font-black text-slate-500">Rp</span><input type="number" min="0" inputMode="numeric" placeholder="18000" className={`${inputClass} pl-10`} value={variant.cost_price || ''} onChange={(event) => updateVariant(variant.id, 'cost_price', Number(event.target.value))} /></span></label>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" disabled={variants.length >= 25} onClick={addVariant} className="mt-3 min-h-12 w-full rounded-2xl border-2 border-dashed border-violet-300 bg-white px-4 text-sm font-black text-violet-700 transition hover:border-violet-500 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50">{variants.length >= 25 ? 'Maksimal 25 Varian' : '+ Tambah Varian Lagi'}</button>
          </section>
        )}

        <section aria-labelledby="product-photo-heading" className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">Langkah 4</p><h5 id="product-photo-heading" className="text-lg font-black text-slate-950">Foto menu</h5><p className="mt-1 text-sm leading-5 text-slate-600">Satu foto dipakai untuk tampilan menu ini.</p></div>
          <label className="block"><span className={labelClass}>Pilih dari perangkat <span className="font-semibold text-slate-400">(opsional)</span></span><input type="file" accept="image/jpeg,image/png,image/webp" disabled={isBusy} onChange={(event) => { const file = event.target.files?.[0]; if (file) onUploadImage(file); }} className="block min-h-12 w-full cursor-pointer rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700 file:mr-3 file:min-h-12 file:border-0 file:bg-slate-900 file:px-4 file:text-sm file:font-black file:text-white disabled:opacity-50" /><span className="mt-1.5 block text-xs font-medium text-slate-500">JPG, PNG, atau WebP. Maksimal 5 MB.</span></label>
          <label className="block"><span className={labelClass}>Atau tempel URL foto</span><input type="url" placeholder="https://..." className={inputClass} value={form.value.image_url} onChange={(event) => form.changeImageUrl(event.target.value)} /></label>
          {form.value.image_url && <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-white p-3"><img src={form.value.image_url} alt="Pratinjau foto menu" className="h-16 w-16 rounded-xl border border-slate-200 object-cover" /><div className="min-w-0 flex-1"><p className="text-sm font-black text-slate-900">Foto siap dipakai</p><p className="mt-0.5 truncate text-xs font-medium text-slate-500">{form.value.image_url}</p></div><button type="button" disabled={isBusy} onClick={() => void form.removeImage()} className="min-h-11 rounded-xl bg-red-50 px-3 text-sm font-black text-red-600 hover:bg-red-100 disabled:opacity-50">Hapus</button></div>}
        </section>

        <div className="sticky bottom-3 z-10 rounded-2xl border border-green-200 bg-white/95 p-2 shadow-[0_16px_35px_-18px_rgba(15,23,42,0.55)] backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <button type="submit" disabled={isBusy} className="min-h-14 w-full rounded-2xl bg-green-600 px-5 text-base font-black text-white shadow-[0_10px_22px_rgba(22,163,74,0.25)] transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60">{uploadingImage ? 'Mengunggah foto...' : isSaving ? 'Menyimpan menu...' : mode === 'variants' ? `Simpan Menu + ${variants.length} Varian` : 'Simpan Menu Baru'}</button>
        </div>
      </div>
    </form>
  );
}