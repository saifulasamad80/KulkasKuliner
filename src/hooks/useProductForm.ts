import { useState } from 'react';

export type ProductFormValue = {
  name: string;
  price: number;
  stock: number;
  image_url: string;
  description: string;
  menu_id: string | null;
  menu_name: string;
  variant_name: string;
};

export const emptyProductForm: ProductFormValue = {
  name: '',
  price: 0,
  stock: 0,
  image_url: '',
  description: '',
  menu_id: null,
  menu_name: '',
  variant_name: '',
};

/** Deletes a menu photo from Storage; safe to call on URLs that aren't ours. */
export async function deleteMenuImage(url: string) {
  if (!url || !url.includes('/storage/v1/object/public/menu-images/')) return;
  const response = await fetch('/api/admin/uploads/menu-image', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!response.ok && response.status !== 409) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null;
    console.error(result?.error || 'Cleanup foto menu gagal.');
  }
}

/**
 * State + actions for one product form (either the "add product" form or a
 * row's "edit product" form). Tracks an uploaded-but-not-yet-saved photo so it
 * can be cleaned up from Storage if it ends up unused.
 */
export function useProductForm() {
  const [value, setValue] = useState<ProductFormValue>(emptyProductForm);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState('');

  const setField = <K extends keyof ProductFormValue>(field: K, fieldValue: ProductFormValue[K]) => {
    setValue((current) => ({ ...current, [field]: fieldValue }));
  };

  /** Manual edits to the image URL field: drop any pending upload it replaces. */
  const changeImageUrl = (url: string) => {
    const previousPending = pendingImageUrl;
    setField('image_url', url);
    if (previousPending && previousPending !== url) {
      setPendingImageUrl(null);
      void deleteMenuImage(previousPending);
    }
  };

  /** Called once a file upload finishes: adopt the new URL, drop the old pending one. */
  const applyUploadedUrl = (url: string) => {
    const previousPending = pendingImageUrl;
    setField('image_url', url);
    setPendingImageUrl(url);
    if (previousPending && previousPending !== url) void deleteMenuImage(previousPending);
  };

  const removeImage = async () => {
    if (pendingImageUrl) await deleteMenuImage(pendingImageUrl);
    setPendingImageUrl(null);
    setField('image_url', '');
  };

  /** Load an existing product into the form (used by "Edit Item"). */
  const load = (initial: ProductFormValue) => {
    setPendingImageUrl(null);
    setOriginalImageUrl(initial.image_url);
    setValue(initial);
  };

  const reset = () => {
    setPendingImageUrl(null);
    setOriginalImageUrl('');
    setValue(emptyProductForm);
  };

  /** Cancel flow: throw away any photo that was uploaded but never saved. */
  const discardPendingImage = async () => {
    if (pendingImageUrl) await deleteMenuImage(pendingImageUrl);
    reset();
  };

  /** Save flow: clean up a replaced photo and/or an uploaded-but-unused one. */
  const cleanUpAfterSave = async () => {
    const savedImageUrl = value.image_url;
    const obsolete = originalImageUrl && originalImageUrl !== savedImageUrl ? originalImageUrl : '';
    const unusedPending = pendingImageUrl && pendingImageUrl !== savedImageUrl ? pendingImageUrl : '';
    reset();
    if (obsolete) await deleteMenuImage(obsolete);
    if (unusedPending) await deleteMenuImage(unusedPending);
  };

  return {
    value,
    pendingImageUrl,
    setField,
    changeImageUrl,
    applyUploadedUrl,
    removeImage,
    load,
    reset,
    discardPendingImage,
    cleanUpAfterSave,
  };
}
