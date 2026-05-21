/* ===================================================
   AUTHENTIC GIRLSWEAR - Zustand Stores
   Fixed: categories persist, real orders show in admin
   =================================================== */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, Coupon, AdminUser, OrderStatus, PaymentStatus, Category } from '@/types';
import { coupons as mockCoupons } from '@/data/mockData';
import { supabase } from '@/lib/supabase';

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
    }),
    { name: 'authentic-girlswear-admin' }
  )
);

// ==========================================
// ORDER STORE — REPLACE THIS ENTIRE SECTION
// in your store/index.ts
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
  // ✅ NEW: replaces a full order (persists item + total edits)
  updateOrder: (order: RealOrder) => void;
  // ✅ NEW: no-op for localStorage store (data is already in memory),
  //         but satisfies the fetchOrders() call in AdminOrders on mount
  fetchOrders: () => void;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],

      // Called when customer completes checkout
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

      // ✅ Replaces the whole order object — persists item edits, total edits, etc.
      updateOrder: (updatedOrder) => {
        set({
          orders: get().orders.map(o =>
            o.id === updatedOrder.id
              ? { ...updatedOrder, updatedAt: new Date().toISOString() }
              : o
          ),
        });
      },

      // ✅ Orders live in localStorage via `persist`, so fetchOrders is a no-op here.
      // If you later switch to Supabase, replace this body with a real fetch.
      fetchOrders: () => {
        // already loaded from localStorage by zustand/persist on boot — nothing to do
      },
    }),
    { name: 'authentic-girlswear-orders' }
  )
);

// ==========================================
// CATEGORY STORE — persists add/edit/delete
// ==========================================
const defaultCategories: Category[] = [
  { id: '1', name: 'Dresses', slug: 'dresses', description: 'Beautiful dresses for every occasion', image: 'product-gradient-1', productCount: 0, gradient: 'linear-gradient(135deg, #F4C2C2, #E6E6FA)', createdAt: new Date().toISOString() },
  { id: '2', name: 'Tops', slug: 'tops', description: 'Stylish tops and blouses', image: 'product-gradient-2', productCount: 0, gradient: 'linear-gradient(135deg, #F7E7CE, #F4C2C2)', createdAt: new Date().toISOString() },
  { id: '3', name: 'Bottoms', slug: 'bottoms', description: 'Skirts, pants and more', image: 'product-gradient-3', productCount: 0, gradient: 'linear-gradient(135deg, #E3BCA4, #FADBD8)', createdAt: new Date().toISOString() },
];

interface CategoryStore {
  categories: Category[];
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
}

export const useCategoryStore = create<CategoryStore>()(
  persist(
    (set, get) => ({
      categories: defaultCategories,

      addCategory: (category) => {
        set({ categories: [...get().categories, category] });
      },

      updateCategory: (id, updates) => {
        set({
          categories: get().categories.map(c => c.id === id ? { ...c, ...updates } : c),
        });
      },

      deleteCategory: (id) => {
        set({ categories: get().categories.filter(c => c.id !== id) });
      },
    }),
    { name: 'authentic-girlswear-categories' } // ← saved to localStorage, survives refresh
  )
);

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