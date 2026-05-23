import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';

// ─── Row ↔ Domain ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProduct(item: any): Product {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description || '',
    shortDescription: item.short_description || '',
    price: Number(item.price) || 0,
    comparePrice: item.compare_price ?? undefined,
    images: item.images || [],
    category: item.category_name || '',
    categorySlug: item.category_slug || '',
    sizes: item.sizes || [],
    colors: item.colors || [],
    stock: Number(item.stock) || 0,
    sku: item.sku || '',
    tags: item.tags || [],
    isFeatured: item.is_featured || false,
    isTrending: item.is_trending || false,
    isNewArrival: item.is_new_arrival || false,
    isOnSale: item.is_on_sale || false,
    rating: Number(item.rating) || 0,
    reviewCount: Number(item.review_count) || 0,
    createdAt: item.created_at || '',
    updatedAt: item.updated_at || '',
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface ProductStore {
  products: Product[];
  loading: boolean;
  hasFetched: boolean;
  error: string | null;

  fetchProducts: () => Promise<void>;
  /** Force a fresh fetch, bypassing hasFetched guard */
  refetchProducts: () => Promise<void>;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
}

async function fetchFromSupabase(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToProduct);
}

export const useProductStore = create<ProductStore>()((set, get) => ({
  products: [],
  loading: false,
  hasFetched: false,
  error: null,

  // ── Fetch (guarded — call freely, won't duplicate) ──────────────────────────
  fetchProducts: async () => {
    if (get().hasFetched || get().loading) return;
    set({ loading: true, error: null });
    try {
      const products = await fetchFromSupabase();
      set({ products, loading: false, hasFetched: true });
    } catch (err) {
      console.error('[ProductStore] fetchProducts:', err);
      set({
        loading: false,
        hasFetched: true,
        error: err instanceof Error ? err.message : 'Failed to load products',
      });
    }
  },

  // ── Force refresh (use after admin mutations) ───────────────────────────────
  refetchProducts: async () => {
    set({ loading: true, error: null, hasFetched: false });
    try {
      const products = await fetchFromSupabase();
      set({ products, loading: false, hasFetched: true });
    } catch (err) {
      console.error('[ProductStore] refetchProducts:', err);
      set({
        loading: false,
        hasFetched: true,
        error: err instanceof Error ? err.message : 'Failed to load products',
      });
    }
  },

  // ── Optimistic local mutations (used by admin after Supabase write) ──────────
  addProduct: (product) =>
    set({ products: [product, ...get().products] }),

  updateProduct: (id, updates) =>
    set({
      products: get().products.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    }),

  deleteProduct: (id) =>
    set({ products: get().products.filter((p) => p.id !== id) }),
}));
