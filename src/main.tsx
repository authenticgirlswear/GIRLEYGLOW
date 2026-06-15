import {
  StrictMode,
  Component,
  useEffect,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App';
import { useContentStore, useCategoryStore } from '@/store';
import { useLoadingStore } from '@/store/useLoadingStore';
import { siteConfig } from '@/config/siteConfig';

// ─── Error Boundary ──────────────────────────────────────────────────────────

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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #FFF5F7 0%, #FFF0F3 100%)',
          }}
        >
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
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ─── Root Component ───────────────────────────────────────────────────────────

function Root() {
  const loadContent = useContentStore((s) => s.loadContent);
  const loadCategories = useCategoryStore((s) => s.loadCategories);
  const setLoading = useLoadingStore((s) => s.setLoading);

  useEffect(() => {
    let isMounted = true;

    const initApp = async () => {
      setLoading(true, 20, 'Connecting to Database...');
      try {
        await Promise.all([loadContent(), loadCategories()]);
        if (isMounted) {
          setLoading(true, 85, 'Optimizing Assets...');
          // Small delay so the loader doesn't flash for instant connections
          await new Promise((resolve) => setTimeout(resolve, 150));
          setLoading(false, 100, 'Ready');
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setLoading(false);
      }
    };

    initApp();

    return () => {
      isMounted = false;
    };
  }, [loadContent, loadCategories, setLoading]);

  // Dev-only console branding
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(
        `%c🌸 ${siteConfig.websiteName} %c v1.0.0 `,
        'background: linear-gradient(135deg, #B07D6B 0%, #D4A59A 100%); color: white; padding: 8px 16px; border-radius: 4px 0 0 4px; font-weight: bold; font-size: 14px;',
        'background: #f5f5f5; color: #333; padding: 8px 16px; border-radius: 0 4px 4px 0; font-size: 14px;',
      );
    }
  }, []);

  return (
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root element. Please check your index.html file.');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </StrictMode>,
);

if (import.meta.hot) {
  import.meta.hot.accept();
}
