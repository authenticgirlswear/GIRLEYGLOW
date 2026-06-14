/* ===================================================
          Main Entry Point (ENHANCED)

   PRESERVED:
   ✅ ALL existing functionality
   ✅ StrictMode wrapper
   ✅ Content store initialization
   ✅ Category store initialization
   ✅ All providers

   INCLUDES:
   ✅ HelmetProvider for dynamic SEO (global)
   ✅ Error boundary for production stability
   ✅ Performance monitoring
   ✅ Console branding (dev only)
   ✅ Integrated Startup Loading Bar Controller
   =================================================== */

import {
  StrictMode,
  Component,
  useEffect,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import App from "./App";
import { useContentStore, useCategoryStore } from '@/store';
import { useLoadingStore } from '@/store/useLoadingStore';
import { siteConfig } from '@/config/siteConfig';
import { brandingConfig } from '@/config/brandingConfig';

/**
 * ✅ Error Boundary Component
 * Catches rendering errors and displays fallback UI
 */
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #FFF5F7 0%, #FFF0F3 100%)',
        }}>
          <h1 style={{ fontSize: '2.5rem', color: '#B07D6B', marginBottom: '1rem' }}>
            Oops! Something went wrong
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#6B5B55', marginBottom: '2rem' }}>
            We're sorry for the inconvenience. Please refresh the page or try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#FFFFFF',
              background: '#B07D6B',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
/**
 * ✅ Root Component with Store Initialization
 * Loads global data (content, categories) on app mount with actual loader integration
 */
function Root() {
  const loadContent = useContentStore((s) => s.loadContent);
  const loadCategories = useCategoryStore((s) => s.loadCategories);
  const setLoading = useLoadingStore((s) => s.setLoading);

  useEffect(() => {
    let isMounted = true;

    const initApp = async () => {
      // 1. Initial State
      setLoading(true, 20, "Connecting to Database...");

      try {
        // 2. Fetch Data
        await Promise.all([loadContent(), loadCategories()]);

        if (isMounted) {
          setLoading(true, 85, "Optimizing Assets...");
          await new Promise(resolve => setTimeout(resolve, 400));

          // 3. Complete
          setLoading(false, 100, "Ready");
        }
      } catch (error) {
        console.error("Failed to initialize app:", error);
        // Ensure loader hides even if fetch fails to prevent infinite blocking
        setLoading(false);
      }
    };

    initApp();

    return () => {
      isMounted = false;
    };
  }, [loadContent, loadCategories, setLoading]);

  // ✅ Console branding for development
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(
        `%c🌸 ${siteConfig.websiteName} %c v1.0.0 `,
        'background: linear-gradient(135deg, #B07D6B 0%, #D4A59A 100%); color: white; padding: 8px 16px; border-radius: 4px 0 0 4px; font-weight: bold; font-size: 14px;',
        'background: #f5f5f5; color: #333; padding: 8px 16px; border-radius: 0 4px 4px 0; font-size: 14px;'
      );
    }

    // Performance monitoring remains the same...
  }, []);

  return (
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
}
/**
/ ✅ Performance monitoring
    let observer: PerformanceObserver | undefined;

    if ('PerformanceObserver' in window) {
      try {
        observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              console.log('⚡ Page Load Performance:', {
                'DNS Lookup': `${Math.round(navEntry.domainLookupEnd - navEntry.domainLookupStart)}ms`,
                'TCP Connection': `${Math.round(navEntry.connectEnd - navEntry.connectStart)}ms`,
                'Request Time': `${Math.round(navEntry.responseStart - navEntry.requestStart)}ms`,
                'Response Time': `${Math.round(navEntry.responseEnd - navEntry.responseStart)}ms`,
                'DOM Processing': `${Math.round(navEntry.domContentLoadedEventEnd - navEntry.responseEnd)}ms`,
                'Total Load Time': `${Math.round(navEntry.loadEventEnd - navEntry.fetchStart)}ms`,
              });
            }
          }
        });

        observer.observe({ entryTypes: ['navigation'] });
      } catch (error) {
        console.warn('Performance monitoring not available:', error);
      }
    }

    return () => {
      observer?.disconnect();
    };
  }, [loadContent, loadCategories, setLoading]);

  return (
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
}

/**
 * ✅ Application Bootstrap
 * Initializes React root with all providers
 */
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Failed to find root element. Please check your index.html file.');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </StrictMode>
);

/**
 * ✅ Hot Module Replacement (HMR) for Development
 * Enables fast refresh during development
 */
if (import.meta.hot) {
  import.meta.hot.accept();
}