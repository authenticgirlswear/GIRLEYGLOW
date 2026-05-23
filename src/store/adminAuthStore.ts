import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser } from '@/types';

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
        if (
          email === 'admin@authenticgirlswear.com' &&
          password === 'admin123'
        ) {
          set({
            admin: {
              id: '1',
              email: 'admin@authenticgirlswear.com',
              name: 'Admin User',
              role: 'super_admin',
              createdAt: '2025-01-01',
            },
            isAuthenticated: true,
          });
          return true;
        }
        return false;
      },

      logout: () => set({ admin: null, isAuthenticated: false }),

      setAuthenticated: (val) => set({ isAuthenticated: val }),
    }),
    { name: 'authentic-girlswear-admin' },
  ),
);
