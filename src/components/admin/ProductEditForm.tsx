"use client";

import type { useProductForm } from '@/hooks/useProductForm';

type ProductEditFormProps = {
  form: ReturnType<typeof useProductForm>;
  uploadingImage: boolean;
  onSave: () => void;
  onCancel: () => void;
  onUploadImage: (file: File) => void;
};

export default function ProductEditForm({ form, uploadingImage, onSave, onCancel, onUploadImage }: ProductEditFormProps) {
  return (
    <div className="space-y-2 bg-blue-50/50 p-2 -mx-2 rounded-lg border border-blue-100">
      <input type="text" placeholder="Nama Produk"
        className="w-full p-2 border border-gray-300 rounded text-sm font-bold bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
        value={form.value.name} onChange={e => form.setField('name', e.target.value)}
      />
      <input type="text" placeholder="Nama varian"
        className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
        value={form.value.variant_name} onChange={e => form.setField('variant_name', e.target.value)}
      />
      <input type="text" placeholder="Nama menu induk"
        className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
        value={form.value.menu_name} onChange={e => form.setField('menu_name', e.target.value)}
      />
      <div className="relative">
        <textarea placeholder="Deskripsi (Maksimal 90 huruf)" rows={2} maxLength={90}
          className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none pr-12"
          value={form.value.description} onChange={e => form.setField('description', e.target.value)}
        />
        <span className={`absolute bottom-3 right-3 text-[10px] font-black ${form.value.description.length >= 90 ? 'text-red-600 animate-pulse' : 'text-gray-400'}`}>
          {form.value.description.length}/90
        </span>
      </div>
      <div className="flex gap-2">
        <input type="number" placeholder="Harga"
          className="w-1/2 p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
          value={form.value.price} onChange={e => form.setField('price', parseInt(e.target.value))}
        />
        <input type="number" placeholder="Stok"
          className="w-1/2 p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
          value={form.value.stock} onChange={e => form.setField('stock', parseInt(e.target.value))}
        />
      </div>
      <label className="block text-xs font-bold text-gray-600">Ganti foto
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingImage} onChange={e => { const file = e.target.files?.[0]; if (file) onUploadImage(file); }} className="mt-1 w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900" />
      </label>
      <input type="text" placeholder="URL Foto"
        className="w-full p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
        value={form.value.image_url} onChange={e => form.changeImageUrl(e.target.value)}
      />
      {form.value.image_url && (
        <button type="button" disabled={uploadingImage} onClick={() => void form.removeImage()} className="w-full border border-red-200 bg-white text-red-600 font-bold py-2 rounded-lg text-xs hover:bg-red-50 disabled:opacity-50">Hapus Foto</button>
      )}
      <div className="flex gap-2 mt-3">
        <button disabled={uploadingImage} onClick={onSave} className="bg-blue-600 text-white px-3 py-2 text-xs font-bold rounded-lg flex-1 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">Simpan Perubahan</button>
        <button disabled={uploadingImage} onClick={onCancel} className="bg-gray-200 text-gray-800 px-3 py-2 text-xs font-bold rounded-lg flex-1 hover:bg-gray-300 transition-colors disabled:opacity-50">Batal</button>
      </div>
    </div>
  );
}
