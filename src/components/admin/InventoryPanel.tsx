"use client";

import { useState } from 'react';
import type { Product } from '@/lib/types';
import type { CreateProductInput, ProductInput } from '@/hooks/useAdminData';
import { deleteMenuImage, useProductForm } from '@/hooks/useProductForm';
import ProductAddForm from './ProductAddForm';
import ProductListItem from './ProductListItem';

type InventoryPanelProps = {
  products: Product[];
  createProduct: (input: CreateProductInput) => Promise<void>;
  updateProduct: (id: string, input: ProductInput) => Promise<void>;
  toggleProductActive: (id: string, currentStatus: boolean) => Promise<void>;
};

export default function InventoryPanel({ products, createProduct, updateProduct, toggleProductActive }: InventoryPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const newForm = useProductForm();
  const editForm = useProductForm();

  const uploadProductImage = async (file: File, form: ReturnType<typeof useProductForm>) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/admin/uploads/menu-image', { method: 'POST', body: formData });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || 'Foto gagal diunggah.');
      form.applyUploadedUrl(result.url);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Foto gagal diunggah.');
    } finally {
      setUploadingImage(false);
    }
  };

  const cancelNewProduct = async () => {
    await newForm.discardPendingImage();
    setIsAdding(false);
  };

  const cancelEditProduct = async () => {
    await editForm.discardPendingImage();
    setEditingId(null);
  };

  const handleAddProduct = async (input: CreateProductInput) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await createProduct(input);
      alert('Menu berhasil ditambahkan!');
      newForm.reset();
      setIsAdding(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Produk gagal disimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveEditProduct = async (id: string) => {
    if (isSaving) return;
    if (editForm.value.name.trim().length < 2 || editForm.value.price <= 0 || editForm.value.stock < 0) {
      return alert('Nama, harga, dan stok belum valid. Cek lagi sebelum menyimpan.');
    }
    setIsSaving(true);
    try {
      await updateProduct(id, {
        name: editForm.value.name,
        price: editForm.value.price,
        stock: editForm.value.stock,
        image_url: editForm.value.image_url,
        description: editForm.value.description,
        menu_id: editForm.value.menu_id,
        variant_name: editForm.value.variant_name || null,
        menu_name: editForm.value.menu_name || null,
      });
      setEditingId(null);
      await editForm.cleanUpAfterSave();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Produk gagal diperbarui.');
    } finally {
      setIsSaving(false);
    }
  };

  const startEditProduct = (product: Product) => {
    if (editingId && editingId !== product.id && editForm.pendingImageUrl) {
      void deleteMenuImage(editForm.pendingImageUrl);
    }
    setEditingId(product.id);
    editForm.load({
      name: product.name,
      price: product.price,
      stock: product.stock,
      image_url: product.image_url || '',
      description: product.description || '',
      menu_id: product.menu_id || null,
      menu_name: Array.isArray(product.menus) ? product.menus[0]?.name || '' : product.menus?.name || '',
      variant_name: product.variant_name || '',
    });
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await toggleProductActive(product.id, product.is_active);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Produk gagal diperbarui.');
    }
  };

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900 sm:text-xl">Daftar Produk</h3>
          <p className="mt-0.5 text-xs font-medium text-slate-500">{products.length} produk tersimpan</p>
        </div>
        <button
          type="button"
          onClick={() => { if (isAdding) void cancelNewProduct(); else setIsAdding(true); }}
          disabled={uploadingImage || isSaving}
          className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-black shadow-sm transition-colors disabled:opacity-50 min-[420px]:w-auto ${isAdding ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50' : 'bg-green-600 text-white hover:bg-green-700'}`}
        >
          {isAdding ? "Batal" : "+ Tambah Produk"}
        </button>
      </div>

      {isAdding && (
        <ProductAddForm
          form={newForm}
          uploadingImage={uploadingImage}
          isSaving={isSaving}
          onSubmit={handleAddProduct}
          onUploadImage={(file) => void uploadProductImage(file, newForm)}
        />
      )}

      <div className="space-y-3 sm:max-h-[600px] sm:overflow-y-auto sm:pr-2 sm:custom-scrollbar">
        {products.map((product) => (
          <ProductListItem
            key={product.id}
            product={product}
            isEditing={editingId === product.id}
            editForm={editForm}
            uploadingImage={uploadingImage}
            isSaving={isSaving}
            onStartEdit={startEditProduct}
            onSaveEdit={() => void saveEditProduct(product.id)}
            onCancelEdit={() => void cancelEditProduct()}
            onUploadImage={(file) => void uploadProductImage(file, editForm)}
            onToggleActive={() => void handleToggleActive(product)}
          />
        ))}
      </div>
    </>
  );
}
