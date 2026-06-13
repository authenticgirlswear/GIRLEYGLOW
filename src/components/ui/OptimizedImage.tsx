/* ===================================================
   AUTHENTIC GIRLSWEAR — Optimized <img> wrapper
   ----------------------------------------------------
   Goals
   - Native lazy-loading (loading="lazy") for off-screen
   - eager + fetchpriority="high" for above-the-fold LCP
   - decoding="async" so decode never blocks main thread
   - Cloudinary on-the-fly transforms (f_auto, q_auto, w_*)
     → modern formats (AVIF/WebP) + dynamic quality + width
   - Responsive srcset / sizes for DPR + viewport adaptive
   - Aspect-ratio reservation (width + height attrs) →
     prevents Cumulative Layout Shift (CLS)
   - Blur placeholder (background) while image loads
   - Graceful fallback for non-Cloudinary URLs
   =================================================== */

import React, { useState, useMemo, useCallback } from 'react';

// ─────────────────────────────────────────────────────
// Cloudinary URL helpers
// ─────────────────────────────────────────────────────

const CLOUDINARY_HOST = 'res.cloudinary.com';

/** Is this URL a Cloudinary delivery URL we can transform? */
export const isCloudinaryUrl = (url?: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    return url.includes(CLOUDINARY_HOST) && url.includes('/upload/');
};

/**
 * Inject a Cloudinary transform string into a delivery URL.
 * e.g.  https://res.cloudinary.com/x/image/upload/v123/a.jpg
 *   →   https://res.cloudinary.com/x/image/upload/f_auto,q_auto,w_640/v123/a.jpg
 *
 * Existing transforms are detected and replaced cleanly when possible.
 */
export const cld = (
    url: string,
    width?: number,
    extra: string[] = []
): string => {
    if (!isCloudinaryUrl(url)) return url;

    // Always request modern format + auto quality
    const base = ['f_auto', 'q_auto'];
    if (width && width > 0) base.push(`w_${Math.round(width)}`, 'c_limit');
    const transform = [...base, ...extra].join(',');

    // Split at "/upload/" so we can insert / replace transforms safely
    const [prefix, rest] = url.split('/upload/');
    if (!rest) return url;

    // If the segment after /upload/ already looks like a transform chain
    // (commas / known transform letters before the next slash) — replace it.
    const firstSlash = rest.indexOf('/');
    const head = firstSlash === -1 ? rest : rest.slice(0, firstSlash);
    const tail = firstSlash === -1 ? '' : rest.slice(firstSlash);

    const looksLikeTransform =
        head.includes(',') ||
        /^(f_|q_|w_|h_|c_|dpr_|e_|g_|ar_|b_|r_|a_|fl_|l_|pg_|t_|x_|y_|z_|so_|du_|eo_|vc_|af_|br_|fps_)/.test(
            head
        );

    if (looksLikeTransform) {
        return `${prefix}/upload/${transform}${tail}`;
    }
    return `${prefix}/upload/${transform}/${rest}`;
};

/** Build a srcSet for the given widths (e.g. [320, 640, 960, 1280]). */
export const buildSrcSet = (url: string, widths: number[]): string => {
    if (!isCloudinaryUrl(url)) return '';
    return widths
        .map((w) => `${cld(url, w)} ${w}w`)
        .join(', ');
};

// ─────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────

export interface OptimizedImageProps
    extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'loading' | 'src'> {
    /** Image source URL (Cloudinary URLs get transformed automatically) */
    src: string;
    alt: string;
    /** Intrinsic width attr — combined with `height` for CLS prevention */
    width?: number;
    /** Intrinsic height attr — combined with `width` for CLS prevention */
    height?: number;
    /** Target rendered width hint for Cloudinary transform (px). */
    targetWidth?: number;
    /** Responsive widths used for the srcset. */
    srcSetWidths?: number[];
    /** `sizes` attribute for responsive selection. */
    sizes?: string;
    /** Priority image (above the fold) → eager + fetchpriority="high". */
    priority?: boolean;
    /**
     * Wrapper className. The wrapper holds the aspect-ratio + blur
     * placeholder so the page never shifts while the image loads.
     */
    wrapperClassName?: string;
    /** Inline style for the wrapper. */
    wrapperStyle?: React.CSSProperties;
    /** Optional aspect ratio (e.g. "3/4", "16/9"). Reserves space → no CLS. */
    aspectRatio?: string;
    /** Fallback / placeholder background color while loading. */
    placeholderColor?: string;
    /** Optional onLoad pass-through. */
    onLoad?: React.ReactEventHandler<HTMLImageElement>;
}

/**
 * Drop-in <img> replacement that:
 *  - prevents layout shift (aspect-ratio + width/height attrs)
 *  - lazy-loads by default (`priority` opts into eager + high priority)
 *  - serves WebP/AVIF + responsive widths via Cloudinary transforms
 *  - shows a soft blur placeholder until decoded
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
    src,
    alt,
    width,
    height,
    targetWidth,
    srcSetWidths,
    sizes,
    priority = false,
    wrapperClassName = '',
    wrapperStyle,
    aspectRatio,
    placeholderColor = 'rgba(244, 194, 194, 0.18)', // blush tint
    className = '',
    onLoad,
    style,
    ...imgProps
}) => {
    const [loaded, setLoaded] = useState(false);

    // Default srcset widths cover mobile → desktop @1x/@2x
    const widths = useMemo(
        () => srcSetWidths ?? [320, 480, 640, 768, 960, 1280, 1600],
        [srcSetWidths]
    );

    const optimizedSrc = useMemo(
        () => (isCloudinaryUrl(src) ? cld(src, targetWidth ?? widths[widths.length - 1]) : src),
        [src, targetWidth, widths]
    );

    const srcSet = useMemo(() => buildSrcSet(src, widths), [src, widths]);

    const handleLoad = useCallback<React.ReactEventHandler<HTMLImageElement>>(
        (e) => {
            setLoaded(true);
            onLoad?.(e);
        },
        [onLoad]
    );

    // Wrapper reserves space — width/height attrs on the img also help
    const wrapperFinalStyle: React.CSSProperties = {
        aspectRatio,
        backgroundColor: loaded ? 'transparent' : placeholderColor,
        ...wrapperStyle,
    };

    return (
        <span
            className={`oi-wrapper ${wrapperClassName}`}
            style={wrapperFinalStyle}
        >
            <img
                src={optimizedSrc}
                srcSet={srcSet || undefined}
                sizes={srcSet ? sizes ?? '100vw' : undefined}
                alt={alt}
                width={width}
                height={height}
                loading={priority ? 'eager' : 'lazy'}
                // @ts-expect-error: React types lag behind the spec
                fetchpriority={priority ? 'high' : 'auto'}
                decoding="async"
                onLoad={handleLoad}
                className={className}
                style={{
                    opacity: loaded ? 1 : 0,
                    transition: 'opacity 350ms ease-out',
                    ...style,
                }}
                {...imgProps}
            />
        </span>
    );
};

export default OptimizedImage;