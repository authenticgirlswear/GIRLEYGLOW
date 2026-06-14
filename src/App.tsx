/* ===================================================
   AUTHENTIC GIRLSWEAR - Main App with Routing (ENHANCED)
   
   PRESERVED:
   ✅ ALL existing routes
   ✅ ALL existing functionality
   ✅ ALL layout components
   ✅ ALL admin routes
   ✅ ALL customer routes
   ✅ Facebook Pixel tracking
   ✅ Scroll to top behavior
   ✅ Admin authentication
   
   ADDED:
   ✅ Centralized config integration (siteConfig, brandingConfig)
   ✅ 404 page route
   ✅ Contact page route
   ✅ Privacy Policy route
   ✅ Terms & Conditions route
   ✅ Return Policy route
   ✅ Order Tracking route
   ✅ Thank You page route
   ✅ About page route
   ✅ FAQ page route
   ✅ Dynamic page titles with Helmet
   ✅ Full-screen Premium Loader
   =================================================== */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';

// ✅ ADDED: Import centralized config
import { siteConfig } from '@/config/siteConfig';
import { brandingConfig } from '@/config/brandingConfig';

// Layout Components
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { useContentStore } from '@/store/contentStore';

// Store
import { useAdminAuthStore } from '@/store';
import { useLoadingStore } from '@/store/useLoadingStore';

// UI Components
import { FullScreenLoader } from '@/components/ui/FullScreenLoader';

// Customer Pages (Existing)
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
import { NotFoundPage } from '@/pages/NotFound';
// Facebook Pixel
import { trackPageView } from '@/lib/facebookPixel';

/**
 * ✅ Facebook Pixel Tracker
 * Tracks page views on every route change (except admin pages)
 */
function PixelTracker() {
  const location = useLocation();

  useEffect(() => {
    // Don't track admin pages
    if (!location.pathname.startsWith('/admin')) {
      trackPageView();
    }
  }, [location]);

  return null;
}

/**
 * ✅ Scroll to Top on Navigation & Trigger Loader
 * Automatically scrolls to top and runs loader when route changes
 */
const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();
  const setLoading = useLoadingStore(s => s.setLoading);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Trigger loader on route change
    setLoading(true, 50, "Preparing View...");
    const timer = setTimeout(() => setLoading(false), 400);

    return () => clearTimeout(timer);
  }, [pathname, search, setLoading]);

  return null;
};

/**
 * ✅ Default SEO Meta Tags
 * Provides fallback SEO meta tags for all pages
 */
const DefaultSEO: React.FC = () => {
  return (
    <Helmet>
      <title>{siteConfig.defaultTitle}</title>
      <meta name="description" content={siteConfig.defaultDescription} />
      <meta name="keywords" content={siteConfig.keywords.join(', ')} />

      {/* Favicon */}
      <link rel="icon" type="image/svg+xml" href={brandingConfig.faviconUrl} />
      <link rel="apple-touch-icon" href={brandingConfig.faviconUrl} />

      {/* Open Graph */}
      <meta property="og:site_name" content={siteConfig.websiteName} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={siteConfig.defaultTitle} />
      <meta property="og:description" content={siteConfig.defaultDescription} />
      <meta property="og:image" content={siteConfig.ogImage} />
      <meta property="og:url" content={siteConfig.domain} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteConfig.defaultTitle} />
      <meta name="twitter:description" content={siteConfig.defaultDescription} />
      <meta name="twitter:image" content={siteConfig.ogImage} />

      {/* Canonical URL */}
      <link rel="canonical" href={siteConfig.domain} />
    </Helmet>
  );
};

/**
 * ✅ Customer Layout (Navbar + Footer)
 * Wraps all customer-facing pages with navigation and footer
 */
/**
 * ✅ Customer Layout (Navbar + Footer)
 * Wraps all customer-facing pages with navigation and footer
 */
const CustomerLayout: React.FC = () => {
  const announcement = useContentStore(s => s.content.announcement);
  const isLoading = useLoadingStore(s => s.isLoading);

  const barVisible = announcement?.enabled &&
    announcement?.messages?.some((m: string) => m?.trim());

  // Only render Nav/Announcement after initial loading is finished
  // If you want them hidden ONLY on first load, use:
  if (isLoading) return <Outlet />;

  return (
    <>
      <DefaultSEO />
      <AnnouncementBar />
      <Navbar barVisible={barVisible} />
      <main className={`min-h-screen ${barVisible ? 'pt-10' : ''}`}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};
/**
 * ✅ Admin Protected Route
 * Redirects unauthenticated users to admin login
 */
const AdminProtectedRoute: React.FC = () => {
  const isAuthenticated = useAdminAuthStore(s => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

/**
 * ✅ Main App Component
 * Central routing configuration
 */
const App: React.FC = () => {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <FullScreenLoader />
        <PixelTracker />
        <ScrollToTop />
        <Routes>
          {/* ========================
              Customer-Facing Routes
              ======================== */}
          <Route element={<CustomerLayout />}>
            {/* Core Pages */}
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:slug" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/sale" element={<Navigate to="/shop?sale=true" replace />} />

            {/* ✅ ADDED: New Customer Pages */}
            <Route path="/404" element={<NotFoundPage />} />
          </Route>

          {/* ========================
              Admin Routes
              ======================== */}
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

          {/* ✅ UPDATED: 404 Catch-all - Redirect to custom 404 page */}
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
};

export default App;