"use client";

import type { Product } from '@/lib/types';
import { getProductMenu } from '@/lib/types';
import type { useProductForm } from '@/hooks/useProductForm';
import ProductEditForm from './ProductEditForm';

type ProductListItemProps = {
  product: Product;
  isEditing: boolean;
  editForm: ReturnType<typeof useProductForm>;
  uploadingImage: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  onStartEdit: (product: Product) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onUploadImage: (file: File) => void;
  onToggleActive: () => void;
  onDelete: () => void;
};

export default function ProductListItem({
  product,
  isEditing,
  editForm,
  uploadingImage,
  isSaving,
  isDeleting,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onUploadImage,
  onToggleActive,
  onDelete,
}: ProductListItemProps) {
  const menu = getProductMenu(product);
  const displayName = product.variant_name ? menu?.name || product.name : product.name;

  return (
    <article className={`flex flex-col gap-3 rounded-2xl border p-3.5 transition-colors sm:p-4 ${!product.is_active ? 'border-gray-200 bg-gray-100 opacity-70' : 'border-gray-200 bg-white shadow-sm hover:shadow-md'}`}>
      {isEditing ? (
        <ProductEditForm
          form={editForm}
          uploadingImage={uploadingImage}
          isSaving={isSaving}
          isVariant={Boolean(product.variant_name)}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
          onUploadImage={onUploadImage}
        />
      ) : (
        <>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 sm:h-14 sm:w-14">
              <img src={product.image_url || '/icon.png'} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="line-clamp-2 text-base font-black leading-5 text-gray-950">{displayName}</h3>
              {product.variant_name && (
                <p className="mt-1 inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-xs font-black text-violet-700">
                  Varian: {product.variant_name}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm font-black text-blue-700">Rp {product.price.toLocaleString('id-ID')}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  SISA: {product.stock}
                </span>
                {product.cost_price > 0 ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800">
                    Untung: Rp {(product.price - product.cost_price).toLocaleString('id-ID')}/pcs
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">
                    Modal belum diisi
                  </span>
                )}
                {!product.is_active && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-800 text-white">DIARSIPKAN</span>}
              </div>
            </div>
          </div>
          <div className="mt-1 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3">
            <button onClick={() => onStartEdit(product)} disabled={isDeleting} className="min-h-10 rounded-lg bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50">
              Edit Item
            </button>
            <button onClick={onToggleActive} disabled={isDeleting} className={`min-h-10 rounded-lg px-3 py-2 text-xs font-black transition-colors disabled:opacity-50 ${product.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
              {product.is_active ? 'Sembunyikan' : 'Tampilkan Publik'}
            </button>
            <button onClick={onDelete} disabled={isDeleting} className="min-h-10 rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-black text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50">
              {isDeleting ? 'Menghapus…' : '🗑️ Hapus'}
            </button>
          </div>
        </>
      )}
    </article>
  );
}
