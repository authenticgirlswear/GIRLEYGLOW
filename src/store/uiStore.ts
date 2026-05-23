import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/types';

// ─── UI Store (no persistence — ephemeral per session) ─────────────────────────

interface UIStore {
  mobileMenuOpen: boolean;
  searchOpen: boolean;
  quickViewProduct: Product | null;
  setMobileMenuOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setQuickViewProduct: (product: Product | null) => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  mobileMenuOpen: false,
  searchOpen: false,
  quickViewProduct: null,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setQuickViewProduct: (product) => set({ quickViewProduct: product }),
}));

// ─── Recently Viewed Store (persisted in localStorage) ─────────────────────────

interface RecentlyViewedStore {
  productIds: string[];
  addProduct: (id: string) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      productIds: [],

      addProduct: (id) => {
        const current = get().productIds.filter((pid) => pid !== id);
        set({ productIds: [id, ...current].slice(0, 10) });
      },

      clear: () => set({ productIds: [] }),
    }),
    { name: 'authentic-girlswear-recent' },
  ),
);
