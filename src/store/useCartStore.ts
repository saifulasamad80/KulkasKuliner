import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Definisi tipe data ketat (Strict Typing)
export interface CartItem {
  id: string;
  name: string;
  price: number;
  stock: number; // Kita wajib bawa stok untuk validasi maksimal
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Omit<CartItem, 'quantity'>) => void;
  increaseQty: (id: string) => void;
  decreaseQty: (id: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      // Logika Tambah Barang dengan Validasi Stok
      addItem: (product) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === product.id);

        if (existingItem) {
          // Validasi Brutal: Jangan izinkan tambah jika melebihi stok database
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
          // Tambah barang baru jika belum ada
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
          // Jika kuantitas 1 dan dikurangi, hapus dari keranjang
          set({ items: currentItems.filter((item) => item.id !== id) });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'kulkas-kuliner-cart', // Nama key yang akan tersimpan di LocalStorage browser
    }
  )
);