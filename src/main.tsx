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
      // Show the page shell immediately — Navbar, Hero skeleton, etc. render at once.
      // Data loads in the background and sections populate as they arrive.
      // This makes FCP instant on slow mobile connections.
      setLoading(true, 20, 'Loading...');
      try {
        await Promise.all([loadContent(), loadCategories()]);
        if (isMounted) {
          // No artificial delay — dismiss loader as soon as data is ready
          setLoading(false, 100, 'Ready');
        }
      } catch (error) {
        if (isMounted) setLoading(false);
      }
    };

    initApp();

    return () => {
      isMounted = false;
    };
  }, [loadContent, loadCategories, setLoading]);

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
