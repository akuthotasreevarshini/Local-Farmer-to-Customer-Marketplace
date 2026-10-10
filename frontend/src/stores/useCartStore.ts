import { create } from 'zustand';

interface CartState {
  cartCount: number;

  syncCart: (count: number) => void;
}

export const useCartStore = create<CartState>()((set) => ({
  cartCount: 0,

  /**
   * Call this after any cart mutation (add, update, remove) with the
   * total item count returned by the server.
   */
  syncCart: (count) => set({ cartCount: count }),
}));
