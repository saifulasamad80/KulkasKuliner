export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  description?: string | null;
  menu_id?: string | null;
  variant_name?: string | null;
  menus?: Menu | Menu[] | null;
};

export type Menu = {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  is_active: boolean;
};

export function getProductMenu(product: Product) {
  return Array.isArray(product.menus) ? product.menus[0] ?? null : product.menus ?? null;
}

export type CartItem = {
  id: string;
  name: string;
  menuName?: string;
  variantName?: string;
  price: number;
  stock: number;
  quantity: number;
};

export type OrderSnapshotItem = {
  id: string;
  name: string;
  menu_name?: string | null;
  variant_name?: string | null;
  price: number;
  quantity: number;
};

export type CheckoutResponse = {
  orderNumber: string;
  totalAmount: number;
  whatsappUrl: string;
  items: OrderSnapshotItem[];
  notificationSent: boolean;
};
