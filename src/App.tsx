import React, { useEffect, lazy, Suspense } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import { siteConfig } from '@/config/siteConfig';
import { brandingConfig } from '@/config/brandingConfig';

// Layout
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { useContentStore } from '@/store/contentStore';
import { useAdminAuthStore } from '@/store';
import { useLoadingStore } from '@/store/useLoadingStore';
import { FullScreenLoader } from '@/components/ui/FullScreenLoader';
import { supabase } from '@/lib/supabase';

// Customer pages — Home is eager (LCP critical), rest are lazy
import { HomePage } from '@/pages/Home';

const ShopPage = lazy(() =>
  import('@/pages/Shop').then((m) => ({ default: m.ShopPage })),
);
const ProductDetailPage = lazy(() =>
  import('@/pages/ProductDetail').then((m) => ({ default: m.ProductDetailPage })),
);
const CartPage = lazy(() =>
  import('@/pages/Cart').then((m) => ({ default: m.CartPage })),
);
const CheckoutPage = lazy(() =>
  import('@/pages/Checkout').then((m) => ({ default: m.CheckoutPage })),
);
const SearchPage = lazy(() =>
  import('@/pages/Search').then((m) => ({ default: m.SearchPage })),
);
const CategoryPage = lazy(() =>
  import('@/pages/CategoryPage').then((m) => ({ default: m.CategoryPage })),
);
const NotFoundPage = lazy(() =>
  import('@/pages/NotFound').then((m) => ({ default: m.NotFoundPage })),
);

// Admin pages — lazy loaded (shoppers never download these)
import { AdminLoginPage } from '@/pages/admin/AdminLogin';
const AdminDashboard = lazy(() =>
  import('@/pages/admin/Dashboard').then((m) => ({ default: m.AdminDashboard })),
);
const AdminProducts = lazy(() =>
  import('@/pages/admin/Products').then((m) => ({ default: m.AdminProducts })),
);
const AdminCategories = lazy(() =>
  import('@/pages/admin/Categories').then((m) => ({ default: m.AdminCategories })),
);
const AdminOrders = lazy(() =>
  import('@/pages/admin/Orders').then((m) => ({ default: m.AdminOrders })),
);
const AdminCustomers = lazy(() =>
  import('@/pages/admin/Customers').then((m) => ({ default: m.AdminCustomers })),
);
const AdminContent = lazy(() =>
  import('@/pages/admin/Content').then((m) => ({ default: m.AdminContent })),
);
const AdminCoupons = lazy(() =>
  import('@/pages/admin/CouponsInventoryReports').then((m) => ({ default: m.AdminCoupons })),
);
const AdminInventory = lazy(() =>
  import('@/pages/admin/CouponsInventoryReports').then((m) => ({ default: m.AdminInventory })),
);
const AdminReports = lazy(() =>
  import('@/pages/admin/CouponsInventoryReports').then((m) => ({ default: m.AdminReports })),
);

import { trackPageView } from '@/lib/facebookPixel';

// ─── Lazy-load fallback (shared for admin + customer secondary pages) ─────────

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <p className="text-[#6B5B55] text-sm animate-pulse">Loading...</p>
  </div>
);

// Keep alias for clarity in admin routes
const AdminFallback = PageFallback;

// ─── Facebook Pixel tracker ───────────────────────────────────────────────────

function PixelTracker() {
  const location = useLocation();
  useEffect(() => {
    if (!location.pathname.startsWith('/admin')) {
      trackPageView();
    }
  }, [location]);
  return null;
}

// ─── Scroll to top on route change ───────────────────────────────────────────

const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, search]);

  return null;
};

// ─── Default SEO (fallback for every page) ───────────────────────────────────

const DefaultSEO: React.FC = () => (
  <Helmet>
    <title>{siteConfig.defaultTitle}</title>
    <meta name="description" content={siteConfig.defaultDescription} />
    <meta name="keywords" content={siteConfig.keywords.join(', ')} />
    <link rel="icon" type="image/svg+xml" href={brandingConfig.faviconUrl} />
    <link rel="apple-touch-icon" href={brandingConfig.faviconUrl} />
    <meta property="og:site_name" content={siteConfig.websiteName} />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={siteConfig.defaultTitle} />
    <meta property="og:description" content={siteConfig.defaultDescription} />
    <meta property="og:image" content={siteConfig.ogImage} />
    <meta property="og:url" content={siteConfig.domain} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={siteConfig.defaultTitle} />
    <meta name="twitter:description" content={siteConfig.defaultDescription} />
    <meta name="twitter:image" content={siteConfig.ogImage} />
    <link rel="canonical" href={siteConfig.domain} />
  </Helmet>
);

// ─── Customer layout ──────────────────────────────────────────────────────────

const CustomerLayout: React.FC = () => {
  const announcement = useContentStore((s) => s.content.announcement);
  const isLoading = useLoadingStore((s) => s.isLoading);

  const barVisible =
    announcement?.enabled && announcement?.messages?.some((m: string) => m?.trim());

  return (
    <>
      <DefaultSEO />
      {/* Skip to main content — keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:bg-white focus:text-rose-gold focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      {/* Always render Navbar so fixed positioning is stable — prevents CLS */}
      {!isLoading && <AnnouncementBar />}
      {!isLoading && <Navbar barVisible={barVisible} />}
      <main id="main-content" className={`min-h-screen ${barVisible && !isLoading ? 'pt-10' : ''}`}>
        <Outlet />
      </main>
      {!isLoading && <Footer />}
    </>
  );
};

// ─── Admin protected route — validates Supabase session ──────────────────────

const AdminProtectedRoute: React.FC = () => {
  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated);
  const setAuthenticated = useAdminAuthStore((s) => s.setAuthenticated);
  const [checking, setChecking] = React.useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthenticated(!!data.session);
      setChecking(false);
    });
  }, [setAuthenticated]);

  if (checking) return <AdminFallback />;
  if (!isAuthenticated) return <Navigate to="/admin" replace />;
  return <Outlet />;
};

// ─── App ──────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <FullScreenLoader />
      <PixelTracker />
      <ScrollToTop />
      <Routes>
        {/* Customer routes */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/shop"
            element={<Suspense fallback={<PageFallback />}><ShopPage /></Suspense>}
          />
          <Route
            path="/product/:slug"
            element={<Suspense fallback={<PageFallback />}><ProductDetailPage /></Suspense>}
          />
          <Route
            path="/cart"
            element={<Suspense fallback={<PageFallback />}><CartPage /></Suspense>}
          />
          <Route
            path="/checkout"
            element={<Suspense fallback={<PageFallback />}><CheckoutPage /></Suspense>}
          />
          <Route
            path="/search"
            element={<Suspense fallback={<PageFallback />}><SearchPage /></Suspense>}
          />
          <Route
            path="/category/:slug"
            element={<Suspense fallback={<PageFallback />}><CategoryPage /></Suspense>}
          />
          <Route path="/sale" element={<Navigate to="/shop?sale=true" replace />} />
          <Route
            path="/404"
            element={<Suspense fallback={<PageFallback />}><NotFoundPage /></Suspense>}
          />
        </Route>

        {/* Admin login (public) */}
        <Route path="/admin" element={<AdminLoginPage />} />

        {/* Admin protected routes */}
        <Route element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route
              path="/admin/dashboard"
              element={
                <Suspense fallback={<AdminFallback />}>
                  <AdminDashboard />
                </Suspense>
              }
            />
            <Route
              path="/admin/products"
              element={
                <Suspense fallback={<AdminFallback />}>
                  <AdminProducts />
                </Suspense>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <Suspense fallback={<AdminFallback />}>
                  <AdminCategories />
                </Suspense>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <Suspense fallback={<AdminFallback />}>
                  <AdminOrders />
                </Suspense>
              }
            />
            <Route
              path="/admin/customers"
              element={
                <Suspense fallback={<AdminFallback />}>
                  <AdminCustomers />
                </Suspense>
              }
            />
            <Route
              path="/admin/content"
              element={
                <Suspense fallback={<AdminFallback />}>
                  <AdminContent />
                </Suspense>
              }
            />
            <Route
              path="/admin/coupons"
              element={
                <Suspense fallback={<AdminFallback />}>
                  <AdminCoupons />
                </Suspense>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <Suspense fallback={<AdminFallback />}>
                  <AdminInventory />
                </Suspense>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <Suspense fallback={<AdminFallback />}>
                  <AdminReports />
                </Suspense>
              }
            />
          </Route>
        </Route>

        {/* 404 catch-all */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
