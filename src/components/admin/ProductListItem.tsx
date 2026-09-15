"use client";

import type { Product } from '@/lib/types';
import type { useProductForm } from '@/hooks/useProductForm';
import ProductEditForm from './ProductEditForm';

type ProductListItemProps = {
  product: Product;
  isEditing: boolean;
  editForm: ReturnType<typeof useProductForm>;
  uploadingImage: boolean;
  onStartEdit: (product: Product) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onUploadImage: (file: File) => void;
  onToggleActive: () => void;
};

export default function ProductListItem({
  product,
  isEditing,
  editForm,
  uploadingImage,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onUploadImage,
  onToggleActive,
}: ProductListItemProps) {
  return (
    <div className={`p-4 border rounded-xl flex flex-col gap-3 transition-colors ${!product.is_active ? 'bg-gray-100 opacity-70' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}>
      {isEditing ? (
        <ProductEditForm
          form={editForm}
          uploadingImage={uploadingImage}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
          onUploadImage={onUploadImage}
        />
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
              <img src={product.image_url || '/icon.png'} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-gray-900 leading-tight truncate">{product.name}</h3>
              <div className="flex items-center flex-wrap gap-2 mt-1.5">
                <span className="text-xs font-bold text-blue-700">Rp {product.price.toLocaleString('id-ID')}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  SISA: {product.stock}
                </span>
                {!product.is_active && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-800 text-white">DIARSIPKAN</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-3 mt-1 border-t border-gray-100">
            <button onClick={() => onStartEdit(product)} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
              Edit Item
            </button>
            <span className="text-gray-300">|</span>
            <button onClick={onToggleActive} className={`text-xs font-bold transition-colors ${product.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}>
              {product.is_active ? 'Sembunyikan' : 'Tampilkan Publik'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
