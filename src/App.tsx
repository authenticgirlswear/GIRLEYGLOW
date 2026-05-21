/* ===================================================
   AUTHENTIC GIRLSWEAR - Main App with Routing
   =================================================== */

import React from 'react';
import { Analytics } from "@vercel/analytics/react"
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
// Layout Components
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AdminLayout } from '@/components/layout/AdminLayout';

// Store
import { useAdminAuthStore } from '@/store';

// Customer Pages
import { HomePage } from '@/pages/Home';
import { ShopPage } from '@/pages/Shop';
import { ProductDetailPage } from '@/pages/ProductDetail';
import { CartPage } from '@/pages/Cart';
import { CheckoutPage } from '@/pages/Checkout';
import { SearchPage } from '@/pages/Search';
import { CategoryPage } from '@/pages/CategoryPage';

// Admin Pages
import { AdminLoginPage } from '@/pages/admin/AdminLogin';
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { AdminProducts } from '@/pages/admin/Products';
import { AdminCategories } from '@/pages/admin/Categories';
import { AdminOrders } from '@/pages/admin/Orders';
import { AdminCustomers } from '@/pages/admin/Customers';
import { AdminContent } from '@/pages/admin/Content';
import { AdminCoupons, AdminInventory, AdminReports } from '@/pages/admin/CouponsInventoryReports';

// ===== Scroll to Top on Navigation =====
const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
};

// ===== Customer Layout (Navbar + Footer) =====
const CustomerLayout: React.FC = () => (
  <>
    <Navbar />
    <main className="min-h-screen">
      <Outlet />
    </main>
    <Footer />
  </>
);

// ===== Admin Protected Route =====
const AdminProtectedRoute: React.FC = () => {
  const isAuthenticated = useAdminAuthStore(s => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

// ===== Main App =====
const App: React.FC = () => {
  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        {/* ========================
            Customer-Facing Routes
            ======================== */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
        </Route>

        {/* ========================
            Admin Routes
            ======================== */}
        {/* Admin Login (no layout) */}
        <Route path="/admin" element={<AdminLoginPage />} />

        {/* Protected Admin Routes */}
        <Route element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/customers" element={<AdminCustomers />} />
            <Route path="/admin/content" element={<AdminContent />} />
            <Route path="/admin/coupons" element={<AdminCoupons />} />
            <Route path="/admin/inventory" element={<AdminInventory />} />
            <Route path="/admin/reports" element={<AdminReports />} />
          </Route>
        </Route>

        {/* 404 Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
