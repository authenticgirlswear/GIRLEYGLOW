import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/types';

// ─── Row ↔ Domain ─────────────────────────────────────────────────────────────

function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    slug: String(row.slug ?? ''),
    description: String(row.description ?? ''),
    image: String(row.image ?? ''),
    productCount: Number(row.product_count ?? 0),
    gradient: String(row.gradient ?? ''),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function categoryToRow(cat: Partial<Category>): Record<string, unknown> {
  return {
    name: cat.name,
    slug: cat.slug,
    description: cat.description ?? '',
    image: cat.image ?? '',
    product_count: cat.productCount ?? 0,
    gradient: cat.gradient ?? '',
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface CategoryStore {
  categories: Category[];
  loading: boolean;
  hasFetched: boolean;
  error: string | null;

  loadCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'createdAt'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryStore>()((set, get) => ({
  categories: [],
  loading: false,
  hasFetched: false,
  error: null,

  // ── Fetch ───────────────────────────────────────────────────────────────────
  loadCategories: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      set({
        categories: (data ?? []).map(rowToCategory),
        loading: false,
        hasFetched: true,
      });
    } catch (err) {
      console.error('[CategoryStore] loadCategories:', err);
      set({
        loading: false,
        hasFetched: true,
        error: err instanceof Error ? err.message : 'Failed to load categories',
      });
    }
  },

  // ── Add ─────────────────────────────────────────────────────────────────────
  addCategory: async (category) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(categoryToRow(category))
        .select()
        .single();

      if (error) throw error;

      set({ categories: [...get().categories, rowToCategory(data)] });
    } catch (err) {
      console.error('[CategoryStore] addCategory:', err);
      throw err; // Let the UI surface this
    }
  },

  // ── Update ───────────────────────────────────────────────────────────────────
  updateCategory: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(categoryToRow(updates))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updated = rowToCategory(data);
      set({
        categories: get().categories.map((c) =>
          c.id === id ? updated : c,
        ),
      });
    } catch (err) {
      console.error('[CategoryStore] updateCategory:', err);
      throw err;
    }
  },

  // ── Delete ───────────────────────────────────────────────────────────────────
  deleteCategory: async (id) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set({ categories: get().categories.filter((c) => c.id !== id) });
    } catch (err) {
      console.error('[CategoryStore] deleteCategory:', err);
      throw err;
    }
  },
}));
