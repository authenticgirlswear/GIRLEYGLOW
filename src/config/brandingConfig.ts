/**
 * Branding Configuration
 * Central source for all brand identity values.
 * Import BRAND wherever brand name / description / tagline is needed.
 */

export const BRAND = {
    /** Top line of the stacked logo wordmark */
    nameTop: 'AUTHENTIC',

    /** Bottom line of the stacked logo wordmark */
    nameBottom: 'GIRLSWEAR',

    /** Combined single-line name used in copyright, page titles, etc. */
    fullName: 'Authentic Girlswear',

    /** Short brand description shown in footer */
    description:
        'Luxury feminine fashion crafted for the modern woman. Every piece tells a story of elegance, confidence, and timeless beauty.',

    /** Tagline shown in search placeholder, footer bottom bar, etc. */
    tagline: 'Designed with love for the modern woman',

    /** Search input placeholder hint (replaces hardcoded product list) */
    searchHint: 'dresses, tops, accessories',

    /** Logo image path */
    logoUrl: '/images/logo.png',

    /** Favicon path */
    faviconUrl: '/favicon.ico',

    /** Brand color tokens — match your Tailwind config */
    colors: {
        primary: '#B07D6B',
        accent: '#FF5349',
        dark: '#2C2C2C',
        muted: '#9A8880',
        light: '#F5E6DC',
    },
} as const;

export type BrandConfig = typeof BRAND;

// ─── Legacy alias kept for any file still importing brandingConfig ───────────
export const brandingConfig = {
    logoUrl: BRAND.logoUrl,
    faviconUrl: BRAND.faviconUrl,
    footerCopyright: `© {year} ${BRAND.fullName}. All rights reserved.`,
    companyName: BRAND.fullName,
    tagline: BRAND.tagline,
    colors: {
        primary: BRAND.colors.primary,
        secondary: BRAND.colors.muted,
        accent: BRAND.colors.accent,
        background: '#ffffff',
        text: BRAND.colors.dark,
    },
} as const;

export const getCopyrightText = () =>
    brandingConfig.footerCopyright.replace('{year}', new Date().getFullYear().toString());

export type BrandingConfig = typeof brandingConfig;