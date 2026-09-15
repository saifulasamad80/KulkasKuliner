"use client";

import { useState } from 'react';
import type { Product } from '@/lib/types';
import type { ProductInput } from '@/hooks/useAdminData';
import { deleteMenuImage, useProductForm } from '@/hooks/useProductForm';
import ProductAddForm from './ProductAddForm';
import ProductListItem from './ProductListItem';

type InventoryPanelProps = {
  products: Product[];
  createProduct: (input: ProductInput) => Promise<void>;
  updateProduct: (id: string, input: ProductInput) => Promise<void>;
  toggleProductActive: (id: string, currentStatus: boolean) => Promise<void>;
};

export default function InventoryPanel({ products, createProduct, updateProduct, toggleProductActive }: InventoryPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.value.name || newForm.value.price <= 0) return alert("Nama dan Harga wajib diisi valid!");
    try {
      await createProduct(newForm.value);
      alert("Produk ditambah!");
      newForm.reset();
      setIsAdding(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Produk gagal disimpan.');
    }
  };

  const saveEditProduct = async (id: string) => {
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
    <div id="inventori" className="h-fit rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex justify-between items-center mb-5 border-b pb-2">
        <h3 className="text-xl font-bold text-gray-800">Menu Aktif</h3>
        <button
          onClick={() => { if (isAdding) void cancelNewProduct(); else setIsAdding(true); }}
          disabled={uploadingImage}
          className="bg-green-600 text-white px-3 py-1 text-sm font-bold rounded hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {isAdding ? "Batal" : "+ Tambah Produk"}
        </button>
      </div>

      {isAdding && (
        <ProductAddForm
          form={newForm}
          uploadingImage={uploadingImage}
          onSubmit={handleAddProduct}
          onUploadImage={(file) => void uploadProductImage(file, newForm)}
        />
      )}

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {products.map((product) => (
          <ProductListItem
            key={product.id}
            product={product}
            isEditing={editingId === product.id}
            editForm={editForm}
            uploadingImage={uploadingImage}
            onStartEdit={startEditProduct}
            onSaveEdit={() => void saveEditProduct(product.id)}
            onCancelEdit={() => void cancelEditProduct()}
            onUploadImage={(file) => void uploadProductImage(file, editForm)}
            onToggleActive={() => void handleToggleActive(product)}
          />
        ))}
      </div>
    </div>
  );
}
