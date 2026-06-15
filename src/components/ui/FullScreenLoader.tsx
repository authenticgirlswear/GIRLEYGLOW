import { useLoadingStore } from '../../store/useLoadingStore';
import { memo } from 'react';

/**
 * FullScreenLoader — pure CSS, zero Framer Motion dependency on initial load.
 *
 * WHY NO FRAMER MOTION HERE:
 * The loader renders during initial app boot (before React hydration completes).
 * Loading Framer Motion (32KB gzip) just for a fade-out animation adds to TBT
 * and delays FCP on mobile. CSS transitions are free — the browser handles them
 * natively without any JS parse cost.
 *
 * CLS NOTE: position:fixed takes zero layout space so it never causes layout shift.
 * The previous AnimatePresence approach could leave ghost elements that caused CLS.
 */
export const FullScreenLoader = memo(() => {
    const { isLoading, message } = useLoadingStore();

    return (
        <div
            role="status"
            aria-label={message || 'Loading'}
            aria-live="polite"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
                /* CSS transition — zero JS cost */
                opacity: isLoading ? 1 : 0,
                pointerEvents: isLoading ? 'all' : 'none',
                transition: 'opacity 0.5s ease',
                /* willChange only when visible to hint GPU compositing */
                willChange: isLoading ? 'opacity' : 'auto',
            }}
        >
            {/* Loader animation — pure CSS */}
            <div className="loader">
                <span className="loader-text">LOADING</span>
                <span className="load"></span>
            </div>

            {/* Status message */}
            <p
                style={{
                    marginTop: '3rem',
                    fontSize: '0.75rem',
                    fontWeight: 300,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: '#9ca3af',
                    transition: 'opacity 0.3s ease',
                    opacity: message ? 1 : 0,
                }}
            >
                {message}
            </p>
        </div>
    );
});

FullScreenLoader.displayName = 'FullScreenLoader';
