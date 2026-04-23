import { create } from "zustand";
import cartApi from "../api/cartApi";

const useCartStore = create((set, get) => ({
  items: [],
  totalItems: 0,
  totalAmount: 0,
  loading: false,

  fetchCart: async () => {
    try {
      set({ loading: true });
      const res = await cartApi.getCart();
      const data = res.data;
      set({
        items: data.items || [],
        totalItems: data.totalItems || 0,
        totalAmount: data.totalAmount || 0,
      });
    } catch {
      set({ items: [], totalItems: 0, totalAmount: 0 });
    } finally {
      set({ loading: false });
    }
  },

  addToCart: async (item) => {
    await cartApi.addToCart(item);
    await get().fetchCart();
  },

  updateQuantity: async (id, quantity) => {
    await cartApi.updateQuantity(id, quantity);
    await get().fetchCart();
  },

  removeItem: async (id) => {
    await cartApi.removeItem(id);
    await get().fetchCart();
  },

  clearCart: async () => {
    await cartApi.clearCart();
    set({ items: [], totalItems: 0, totalAmount: 0 });
  },

  clearLocal: () => set({ items: [], totalItems: 0, totalAmount: 0 }),
}));

export default useCartStore;
