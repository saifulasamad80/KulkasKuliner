export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  description?: string | null;
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  stock: number;
  quantity: number;
};

export type OrderSnapshotItem = {
  id: string;
  name: string;
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
