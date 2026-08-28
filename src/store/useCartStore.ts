import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Omit<CartItem, 'quantity'>) => void;
  increaseQty: (id: string) => void;
  decreaseQty: (id: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  // RESOLUSI INFINITE LOOP: Fungsi ini sekarang resmi menjadi bagian dari Store
  decreaseItemToMaxStock: (id: string, maxStock: number) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === product.id);

        if (existingItem) {
          if (existingItem.quantity >= product.stock) {
            alert(`Maksimal pembelian untuk ${product.name} adalah ${product.stock}`);
            return;
          }
          set({
            items: currentItems.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          if (product.stock > 0) {
            set({ items: [...currentItems, { ...product, quantity: 1 }] });
          }
        }
      },

      increaseQty: (id) => {
        const currentItems = get().items;
        const targetItem = currentItems.find((item) => item.id === id);
        
        if (targetItem && targetItem.quantity < targetItem.stock) {
          set({
            items: currentItems.map((item) =>
              item.id === id ? { ...item, quantity: item.quantity + 1 } : item
            ),
          });
        } else {
          alert('Batas stok maksimal tercapai.');
        }
      },

      decreaseQty: (id) => {
        const currentItems = get().items;
        const targetItem = currentItems.find((item) => item.id === id);

        if (targetItem && targetItem.quantity > 1) {
          set({
            items: currentItems.map((item) =>
              item.id === id ? { ...item, quantity: item.quantity - 1 } : item
            ),
          });
        } else {
          set({ items: currentItems.filter((item) => item.id !== id) });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      clearCart: () => set({ items: [] }),

      // Implementasi fungsi penyesuaian stok yang aman dari re-render
      decreaseItemToMaxStock: (id, maxStock) => {
        const currentItems = get().items;
        set({
          items: currentItems.map((item) => 
            item.id === id ? { ...item, quantity: maxStock } : item
          )
        });
      }
    }),
    {
      name: 'kulkas-kuliner-cart',
    }
  )
);