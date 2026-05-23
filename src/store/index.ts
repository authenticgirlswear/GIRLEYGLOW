/* ===================================================
   AUTHENTIC GIRLSWEAR - Zustand Stores
   Fixed: categories persist, real orders show in admin
   =================================================== */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, Coupon, AdminUser, OrderStatus, PaymentStatus, Category } from '@/types';
import { coupons as mockCoupons } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
export { useContentStore, defaultContent } from './contentStore';
export type { ContentData, Banner, AnnouncementSettings } from './contentStore';

// ==========================================
// CART STORE
// ==========================================
interface CartStore {
  items: CartItem[];
  coupon: Coupon | null;
  couponCode: string;
  couponError: string;

  addItem: (product: Product, size: string, color: string, quantity?: number) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;

  getSubtotal: () => number;
  getDiscount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      couponCode: '',
      couponError: '',

      addItem: (product, size, color, quantity = 1) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          i => i.product.id === product.id && i.selectedSize === size && i.selectedColor === color
        );
        if (existingIndex >= 0) {
          const newItems = [...items];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + quantity,
          };
          set({ items: newItems });
        } else {
          set({ items: [...items, { product, quantity, selectedSize: size, selectedColor: color }] });
        }
      },

      removeItem: (productId, size, color) => {
        set({
          items: get().items.filter(
            i => !(i.product.id === productId && i.selectedSize === size && i.selectedColor === color)
          ),
        });
      },

      updateQuantity: (productId, size, color, quantity) => {
        if (quantity <= 0) { get().removeItem(productId, size, color); return; }
        set({
          items: get().items.map(i =>
            i.product.id === productId && i.selectedSize === size && i.selectedColor === color
              ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [], coupon: null, couponCode: '', couponError: '' }),

      applyCoupon: (code) => {
        const coupon = mockCoupons.find(c => c.code.toLowerCase() === code.toLowerCase() && c.isActive);
        if (!coupon) { set({ couponError: 'Invalid coupon code', coupon: null, couponCode: '' }); return; }
        if (new Date(coupon.expiresAt) < new Date()) { set({ couponError: 'Coupon has expired', coupon: null, couponCode: '' }); return; }
        if (coupon.usedCount >= coupon.maxUses) { set({ couponError: 'Coupon usage limit reached', coupon: null, couponCode: '' }); return; }
        const subtotal = get().getSubtotal();
        if (subtotal < coupon.minOrderAmount) { set({ couponError: `Minimum order amount is $${coupon.minOrderAmount}`, coupon: null, couponCode: '' }); return; }
        set({ coupon, couponCode: code, couponError: '' });
      },

      removeCoupon: () => set({ coupon: null, couponCode: '', couponError: '' }),
      getSubtotal: () => get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      getDiscount: () => {
        const { coupon } = get();
        if (!coupon) return 0;
        const subtotal = get().getSubtotal();
        return coupon.type === 'percentage'
          ? Math.round(subtotal * coupon.discount) / 100
          : Math.min(coupon.discount, subtotal);
      },
      getTotal: () => get().getSubtotal() - get().getDiscount(),
      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    { name: 'authentic-girlswear-cart' }
  )
);

// ==========================================
// ADMIN AUTH STORE
// ==========================================
interface AdminAuthStore {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  setAuthenticated: (val: boolean) => void;
}
export const useAdminAuthStore = create<AdminAuthStore>()(
  persist(
    (set) => ({
      admin: null,
      isAuthenticated: false,
      login: (email, password) => {
        if (email === 'admin@authenticgirlswear.com' && password === 'admin123') {
          set({
            admin: { id: '1', email: 'admin@authenticgirlswear.com', name: 'Admin User', role: 'super_admin', createdAt: '2025-01-01' },
            isAuthenticated: true,
          });
          return true;
        }
        return false;
      },
      logout: () => set({ admin: null, isAuthenticated: false }),
      setAuthenticated: (val) => set({ isAuthenticated: val }),
    }),
    { name: 'authentic-girlswear-admin' }
  )
);

// ==========================================
// ORDER STORE
// ==========================================

export interface RealOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  transactionId?: string;
  couponCode?: string;
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    district?: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    productImage: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
  }>;
}

interface OrderStore {
  orders: RealOrder[];
  placeOrder: (order: RealOrder) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updatePaymentStatus: (id: string, status: PaymentStatus) => void;
  updateOrder: (order: RealOrder) => void;
  fetchOrders: () => void;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],

      placeOrder: (order) => {
        set({ orders: [order, ...get().orders] });
      },

      updateOrderStatus: (id, status) => {
        set({
          orders: get().orders.map(o =>
            o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o
          ),
        });
      },

      updatePaymentStatus: (id, status) => {
        set({
          orders: get().orders.map(o =>
            o.id === id ? { ...o, paymentStatus: status, updatedAt: new Date().toISOString() } : o
          ),
        });
      },

      updateOrder: (updatedOrder) => {
        set({
          orders: get().orders.map(o =>
            o.id === updatedOrder.id
              ? { ...updatedOrder, updatedAt: new Date().toISOString() }
              : o
          ),
        });
      },

      fetchOrders: () => {
        // already loaded from localStorage by zustand/persist on boot — nothing to do
      },
    }),
    { name: 'authentic-girlswear-orders' }
  )
);

// ==========================================
// CATEGORY STORE — Supabase as source of truth
// ==========================================

/**
 * Expected Supabase table schema (categories):
 *   id          uuid / text  primary key
 *   name        text
 *   slug        text
 *   description text
 *   image       text
 *   product_count int  (default 0)
 *   gradient    text
 *   created_at  timestamptz
 *
 * All mutations (add / update / delete) hit Supabase first,
 * then refresh local Zustand state from the returned row —
 * so the UI always reflects the DB, even across tabs/deploys.
 */

interface CategoryStore {
  categories: Category[];
  loading: boolean;
  error: string | null;

  loadCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'createdAt'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

/** Maps a raw Supabase row → our Category type */
function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string) ?? '',
    image: (row.image as string) ?? '',
    productCount: Number(row.product_count ?? 0),
    gradient: (row.gradient as string) ?? '',
    createdAt: (row.created_at as string) ?? new Date().toISOString(),
  };
}

/** Maps our Category type → Supabase column names */
function categoryToRow(cat: Partial<Category>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (cat.name !== undefined) row.name = cat.name;
  if (cat.slug !== undefined) row.slug = cat.slug;
  if (cat.description !== undefined) row.description = cat.description;
  if (cat.image !== undefined) row.image = cat.image;
  if (cat.productCount !== undefined) row.product_count = cat.productCount;
  if (cat.gradient !== undefined) row.gradient = cat.gradient;
  return row;
}

export const useCategoryStore = create<CategoryStore>()((set, get) => ({
  categories: [],
  loading: false,
  error: null,

  /**
   * Fetch all categories from Supabase.
   * Call once on app boot (e.g. in a top-level layout or _app).
   * Subsequent calls are safe — they re-fetch and keep state fresh.
   */
  loadCategories: async () => {
    // Prevent concurrent fetches
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
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load categories';
      console.error('[CategoryStore] loadCategories error:', message);
      set({ loading: false, error: message });
    }
  },

  /**
   * Insert a new category into Supabase, then push it into local state.
   * Pass everything except createdAt — Supabase sets that via default.
   */
  addCategory: async (category) => {
    set({ error: null });

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([categoryToRow(category)])
        .select()
        .single();

      if (error) throw error;

      set({ categories: [...get().categories, rowToCategory(data)] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add category';
      console.error('[CategoryStore] addCategory error:', message);
      set({ error: message });
      // Re-throw so the calling UI can show its own error toast if needed
      throw err;
    }
  },

  /**
   * Update an existing category in Supabase, then sync local state
   * with the row Supabase returns (single source of truth).
   */
  updateCategory: async (id, updates) => {
    set({ error: null });

    try {
      const { data, error } = await supabase
        .from('categories')
        .update(categoryToRow(updates))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set({
        categories: get().categories.map(c =>
          c.id === id ? rowToCategory(data) : c
        ),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update category';
      console.error('[CategoryStore] updateCategory error:', message);
      set({ error: message });
      throw err;
    }
  },

  /**
   * Delete a category from Supabase, then remove it from local state.
   */
  deleteCategory: async (id) => {
    set({ error: null });

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set({ categories: get().categories.filter(c => c.id !== id) });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete category';
      console.error('[CategoryStore] deleteCategory error:', message);
      set({ error: message });
      throw err;
    }
  },
}));

// ==========================================
// ADMIN DATA STORE
// ==========================================
interface AdminDataStore {
  products: Product[];
  coupons: Coupon[];

  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  loadProducts: () => Promise<void>;

  addCoupon: (coupon: Coupon) => void;
  updateCoupon: (id: string, updates: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  toggleCoupon: (id: string) => void;
}

export const useAdminDataStore = create<AdminDataStore>()(
  persist(
    (set, get) => ({
      products: [],
      coupons: mockCoupons,

      loadProducts: async () => {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        set({ products: (data ?? []) as Product[] });
      },

      addProduct: (product) => set({ products: [...get().products, product] }),
      updateProduct: (id, updates) => set({ products: get().products.map(p => p.id === id ? { ...p, ...updates } : p) }),
      deleteProduct: (id) => set({ products: get().products.filter(p => p.id !== id) }),

      addCoupon: (coupon) => set({ coupons: [...get().coupons, coupon] }),
      updateCoupon: (id, updates) => set({ coupons: get().coupons.map(c => c.id === id ? { ...c, ...updates } : c) }),
      deleteCoupon: (id) => set({ coupons: get().coupons.filter(c => c.id !== id) }),
      toggleCoupon: (id) => set({ coupons: get().coupons.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c) }),
    }),
    { name: 'authentic-girlswear-admin-data' }
  )
);

// ==========================================
// UI STORE
// ==========================================
interface UIStore {
  mobileMenuOpen: boolean;
  searchOpen: boolean;
  quickViewProduct: Product | null;
  setMobileMenuOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setQuickViewProduct: (product: Product | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  mobileMenuOpen: false,
  searchOpen: false,
  quickViewProduct: null,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setQuickViewProduct: (product) => set({ quickViewProduct: product }),
}));

// ==========================================
// RECENTLY VIEWED STORE
// ==========================================
interface RecentlyViewedStore {
  productIds: string[];
  addProduct: (id: string) => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      addProduct: (id) => {
        const current = get().productIds.filter(pid => pid !== id);
        set({ productIds: [id, ...current].slice(0, 10) });
      },
    }),
    { name: 'authentic-girlswear-recent' }
  )
);

// ==========================================
// PRODUCT STORE (Supabase-powered)
// ==========================================
interface ProductStore {
  products: Product[];
  loading: boolean;
  hasFetched: boolean;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
}

export const useProductStore = create<ProductStore>()((set, get) => ({
  products: [],
  loading: false,
  hasFetched: false,

  fetchProducts: async () => {
    if (get().hasFetched) return;
    set({ loading: true });
    const { data, error } = await supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false });
    if (error) { console.error('Error fetching products:', error); set({ loading: false }); return; }

    const mapped: Product[] = (data || []).map((item: any) => ({
      id: item.id, name: item.name, slug: item.slug,
      description: item.description || '', shortDescription: item.short_description || '',
      price: Number(item.price) || 0, comparePrice: item.compare_price || undefined,
      images: item.images || [], category: item.category_name || '',
      categorySlug: item.category_slug || '', sizes: item.sizes || [],
      colors: item.colors || [], stock: Number(item.stock) || 0,
      sku: item.sku || '', tags: item.tags || [],
      isFeatured: item.is_featured || false, isTrending: item.is_trending || false,
      isNewArrival: item.is_new_arrival || false, isOnSale: item.is_on_sale || false,
      rating: Number(item.rating) || 0, reviewCount: Number(item.review_count) || 0,
      createdAt: item.created_at || '', updatedAt: item.updated_at || '',
    }));

    set({ products: mapped, loading: false, hasFetched: true });
  },

  addProduct: (product) => set({ products: [product, ...get().products] }),
  updateProduct: (id, updates) => set({ products: get().products.map(p => p.id === id ? { ...p, ...updates } : p) }),
  deleteProduct: (id) => set({ products: get().products.filter(p => p.id !== id) }),
}));