import { getProductMenu, type Product } from '@/lib/types';

export type ExistingMenuOption = {
  menuId: string;
  menuName: string;
  imageUrl: string;
  description: string;
  existingVariantNames: string[];
};

/** Menus that already have at least one variant product, so another one can be added alongside it. */
export function getExistingMenuOptions(products: Product[]): ExistingMenuOption[] {
  const byMenu = new Map<string, ExistingMenuOption>();
  for (const product of products) {
    if (!product.variant_name || !product.menu_id) continue;
    const menu = getProductMenu(product);
    const existing = byMenu.get(product.menu_id);
    if (existing) {
      existing.existingVariantNames.push(product.variant_name);
      continue;
    }
    byMenu.set(product.menu_id, {
      menuId: product.menu_id,
      menuName: menu?.name || product.name,
      imageUrl: menu?.image_url || product.image_url || '',
      description: menu?.description || product.description || '',
      existingVariantNames: [product.variant_name],
    });
  }
  return Array.from(byMenu.values()).sort((a, b) => a.menuName.localeCompare(b.menuName, 'id-ID'));
}
