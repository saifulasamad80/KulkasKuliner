"use client";

import type { useProductForm } from '@/hooks/useProductForm';

type ProductAddFormProps = {
  form: ReturnType<typeof useProductForm>;
  uploadingImage: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onUploadImage: (file: File) => void;
};

export default function ProductAddForm({ form, uploadingImage, onSubmit, onUploadImage }: ProductAddFormProps) {
  return (
    <form onSubmit={onSubmit} className="mb-6 bg-green-50 p-4 border border-green-200 rounded-lg space-y-3 shadow-inner">
      <input type="text" placeholder="Nama Produk" required
        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none transition-shadow"
        value={form.value.name} onChange={e => form.setField('name', e.target.value)}
      />
      <input type="text" placeholder="Nama varian (opsional, contoh: Pedas)"
        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
        value={form.value.variant_name} onChange={e => form.setField('variant_name', e.target.value)}
      />
      <input type="text" placeholder="Nama menu induk (untuk mengelompokkan varian)"
        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
        value={form.value.menu_name} onChange={e => form.setField('menu_name', e.target.value)}
      />
      <div className="relative">
        <textarea placeholder="Deskripsi Produk (Maksimal 90 huruf biar gak kepotong)" rows={2} maxLength={90}
          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none transition-shadow pr-12"
          value={form.value.description} onChange={e => form.setField('description', e.target.value)}
        />
        <span className={`absolute bottom-3 right-3 text-[10px] font-black ${form.value.description.length >= 90 ? 'text-red-600 animate-pulse' : 'text-gray-400'}`}>
          {form.value.description.length}/90
        </span>
      </div>
      <div className="flex gap-2">
        <input type="number" placeholder="Harga (Rp)" required min="1"
          className="w-1/2 p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none transition-shadow"
          value={form.value.price || ''} onChange={e => form.setField('price', parseInt(e.target.value))}
        />
        <input type="number" placeholder="Stok Gudang" required min="0"
          className="w-1/2 p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none transition-shadow"
          value={form.value.stock || ''} onChange={e => form.setField('stock', parseInt(e.target.value))}
        />
      </div>
      <label className="block text-xs font-bold text-gray-600">Foto menu (JPG/PNG/WebP, maks. 5 MB)
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingImage} onChange={e => { const file = e.target.files?.[0]; if (file) onUploadImage(file); }} className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900" />
      </label>
      <input type="url" placeholder="URL foto hasil upload"
        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none transition-shadow"
        value={form.value.image_url} onChange={e => form.changeImageUrl(e.target.value)}
      />
      {form.value.image_url && (
        <button type="button" disabled={uploadingImage} onClick={() => void form.removeImage()} className="w-full border border-red-200 bg-white text-red-600 font-bold py-2 rounded-lg text-xs hover:bg-red-50 disabled:opacity-50">Hapus Foto dari Form</button>
      )}
      <button type="submit" className="w-full bg-green-600 text-white font-bold py-2.5 rounded-lg text-sm hover:bg-green-700 transition-colors shadow-sm">Simpan Produk Baru</button>
    </form>
  );
}
