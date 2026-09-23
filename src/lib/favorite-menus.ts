import type { FavoriteMenu, Product } from '@/lib/types';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

type SalesRow = {
  status?: unknown;
  order_items?: Array<{
    product_id?: unknown;
    quantity?: unknown;
  }> | null;
};

function groupProducts(products: Product[], soldByProductId: Map<string, number>): FavoriteMenu[] {
  const groups = new Map<string, FavoriteMenu>();

  for (const product of products.filter((item) => item.is_active && item.stock > 0)) {
    const key = product.menu_id || `product:${product.id}`;
    const existing = groups.get(key);
    if (existing) {
      existing.products.push(product);
      existing.soldQuantity += soldByProductId.get(product.id) ?? 0;
      existing.stock += product.stock;
      continue;
    }

    groups.set(key, {
      key,
      label: product.menus
        ? Array.isArray(product.menus)
          ? product.menus[0]?.name || product.name
          : product.menus.name
        : product.name,
      products: [product],
      soldQuantity: soldByProductId.get(product.id) ?? 0,
      stock: product.stock,
      isFallback: true,
    });
  }

  return [...groups.values()];
}

function fallbackFavorites(products: Product[]) {
  return groupProducts(products, new Map())
    .sort((a, b) => a.label.localeCompare(b.label, 'id-ID'))
    .slice(0, 3);
}

export type ProductSalesMap = Map<string, number>;

/**
 * Total quantity sold per product id, counting only paid/completed orders,
 * across the store's full order history (unlike the dashboard's orders list,
 * which is capped to the most recent 50). Powers the admin sales report;
 * also reused by getFavoriteMenus below so it isn't queried twice per
 * dashboard load.
 */
export async function getProductSalesMap(): Promise<ProductSalesMap> {
  const soldByProductId: ProductSalesMap = new Map();

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('orders')
      .select('status, order_items(product_id, quantity)')
      .in('status', ['paid', 'completed']);

    if (error) throw error;

    for (const rawRow of (data ?? []) as unknown as SalesRow[]) {
      if (rawRow.status !== 'paid' && rawRow.status !== 'completed') continue;
      for (const item of rawRow.order_items ?? []) {
        const productId = typeof item.product_id === 'string' ? item.product_id : '';
        const quantity = Number(item.quantity);
        if (productId && Number.isInteger(quantity) && quantity > 0) {
          soldByProductId.set(productId, (soldByProductId.get(productId) ?? 0) + quantity);
        }
      }
    }
  } catch (error) {
    console.error('Data penjualan produk gagal dimuat:', error);
  }

  return soldByProductId;
}

/**
 * Sales ranking stays on the server. Orders that are still unpaid or canceled
 * never affect the public favorite-menu section.
 *
 * `soldByProductId`, if the caller already computed it (the admin data route
 * needs the same map for the sales report), is reused instead of querying
 * again; otherwise it's computed here.
 */
export async function getFavoriteMenus(products: Product[], soldByProductId?: ProductSalesMap): Promise<FavoriteMenu[]> {
  const availableProducts = products.filter((product) => product.is_active && product.stock > 0);
  if (availableProducts.length === 0) return [];

  try {
    const sales = soldByProductId ?? (await getProductSalesMap());
    const ranked = groupProducts(availableProducts, sales)
      .sort((a, b) => b.soldQuantity - a.soldQuantity || a.label.localeCompare(b.label, 'id-ID'));
    const withSales = ranked.filter((menu) => menu.soldQuantity > 0).slice(0, 3);
    const selectedKeys = new Set(withSales.map((menu) => menu.key));
    const fillers = ranked.filter((menu) => !selectedKeys.has(menu.key)).slice(0, 3 - withSales.length);

    return [...withSales, ...fillers].map((menu) => ({
      ...menu,
      isFallback: menu.soldQuantity === 0,
    }));
  } catch (error) {
    console.error('Ranking menu favorit gagal dimuat:', error);
    return fallbackFavorites(availableProducts);
  }
}