/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║              brandingConfig.ts                               ║
 * ║  THE SINGLE SOURCE OF TRUTH for brand name + theme colors.  ║
 * ║                                                              ║
 * ║  HOW TO RENAME YOUR STORE                                    ║
 * ║   1. Edit nameTop, nameBottom, fullName, shortName           ║
 * ║   2. Update defaultTitle & defaultDescription to match       ║
 * ║   3. Run `npm run build` — every page updates automatically  ║
 * ║                                                              ║
 * ║  HOW TO CHANGE YOUR THEME                                    ║
 * ║   Option A → set activeTheme to a preset name below         ║
 * ║   Option B → edit the 'Custom' preset colors directly        ║
 * ║   Then run `npm run build` — colors apply site-wide          ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

// ─── Color shape ──────────────────────────────────────────────────────────────

export interface BrandColors {
    /** Main accent — buttons, active nav, highlights */
    primary: string;
    /** Lighter tint of primary */
    primaryLight: string;
    /** Darker shade / deep accent */
    primaryDark: string;
    /** Soft background tint (cards, hover states) */
    blush: string;
    blushLight: string;
    blushDark: string;
    /** Page / body background */
    softBg: string;
    /** Primary text / headings */
    charcoal: string;
    /** Muted text / labels / sub-headings */
    warmGray: string;
}

export type ThemeName =
    | 'Rose Gold'
    | 'Midnight Purple'
    | 'Ocean Teal'
    | 'Emerald'
    | 'Crimson'
    | 'Custom';

// ─── Theme presets ────────────────────────────────────────────────────────────

export const THEMES: Record<ThemeName, BrandColors> = {
    /** Current default — warm pinks, rose gold accents */
    'Rose Gold': {
        primary: '#B76E79',
        primaryLight: '#D4949E',
        primaryDark: '#8B4557',
        blush: '#F4C2C2',
        blushLight: '#FADBD8',
        blushDark: '#E8A0A0',
        softBg: '#FDF8F4',
        charcoal: '#2D2D2D',
        warmGray: '#6B5B5B',
    },

    /** Deep violet — elegant & editorial */
    'Midnight Purple': {
        primary: '#7C5CBF',
        primaryLight: '#A489D8',
        primaryDark: '#5A3D8A',
        blush: '#E8D5F5',
        blushLight: '#F0E4FA',
        blushDark: '#D4B8EC',
        softBg: '#F9F4FE',
        charcoal: '#2A2040',
        warmGray: '#6B5B7B',
    },

    /** Cool teal — fresh & modern */
    'Ocean Teal': {
        primary: '#4A9B8E',
        primaryLight: '#72B8AD',
        primaryDark: '#2E7268',
        blush: '#C8E8E4',
        blushLight: '#DCF0EE',
        blushDark: '#A8D5CF',
        softBg: '#F2FAF9',
        charcoal: '#1E3535',
        warmGray: '#4A6B69',
    },

    /** Lush green — organic & natural */
    'Emerald': {
        primary: '#4B8B5A',
        primaryLight: '#70A97E',
        primaryDark: '#2F6639',
        blush: '#C8E5CE',
        blushLight: '#DDF0E2',
        blushDark: '#A8D2B2',
        softBg: '#F2FAF4',
        charcoal: '#1E3524',
        warmGray: '#4A6B52',
    },

    /** Bold red — passionate & luxe */
    'Crimson': {
        primary: '#C0392B',
        primaryLight: '#E05747',
        primaryDark: '#922B21',
        blush: '#FADBD8',
        blushLight: '#FDECEA',
        blushDark: '#F5C6C1',
        softBg: '#FFF8F7',
        charcoal: '#2D1F1E',
        warmGray: '#6B4542',
    },

    /**
     * Custom palette — edit freely.
     * Then set activeTheme: 'Custom' below to use it.
     */
    'Custom': {
        primary: '#B76E79',
        primaryLight: '#D4949E',
        primaryDark: '#8B4557',
        blush: '#F4C2C2',
        blushLight: '#FADBD8',
        blushDark: '#E8A0A0',
        softBg: '#FDF8F4',
        charcoal: '#2D2D2D',
        warmGray: '#6B5B5B',
    },
};

// ══════════════════════════════════════════════════════════════
//  ▼▼▼  EDIT THIS SECTION TO REBRAND / RETHEME YOUR STORE  ▼▼▼
// ══════════════════════════════════════════════════════════════

const ACTIVE_THEME: ThemeName = 'Rose Gold';   // ← change theme here

export const BRAND = {
    // ── Brand Identity ────────────────────────────────────────
    /** Line 1 of the stacked logo (navbar, admin sidebar, login) */
    nameTop: 'GIRLEY',
    /** Line 2 of the stacked logo */
    nameBottom: 'GLOW',
    /** Full single-line name used in copyright, SEO, watermarks */
    fullName: 'GIRLEY GLOW',
    /** Short abbreviation — used in localStorage keys */
    shortName: 'GG',

    // ── On-page Content ───────────────────────────────────────
    description:
        'Luxury feminine fashion crafted for the modern woman. Every piece tells a story of elegance, confidence, and timeless beauty.',
    tagline: 'Designed with love for the modern woman',
    searchHint: 'dresses, Western tops, Bra, Panties, Slimwear, Lingeries, nightdress, accessories',

    /** Default text tiled as watermark on product images */
    watermarkText: 'GIRLEY GLOW',

    // ── SEO ───────────────────────────────────────────────────
    defaultTitle:
        "GIRLEY GLOW — Premium Women's Fashion in Bangladesh",
    defaultDescription:
        "Shop GIRLEY GLOW — Bangladesh's premium destination for push-up bras, maternity wear, shapewear, nightwear, couple nightwear, and elegant western dresses. Fast delivery across Bangladesh.",

    // ── Assets ────────────────────────────────────────────────
    logoUrl: '/images/logo.png',
    faviconUrl: '/favicon.ico',

    // ── Theme ─────────────────────────────────────────────────
    activeTheme: ACTIVE_THEME,
    colors: THEMES[ACTIVE_THEME],
};

// ══════════════════════════════════════════════════════════════
//  ▲▲▲  STOP EDITING HERE  ▲▲▲
// ══════════════════════════════════════════════════════════════

/**
 * applyBrandTheme()
 *
 * Injects brand colors as CSS custom properties on <html>.
 * Called once in main.tsx before React mounts, so every Tailwind
 * class that references a color variable (e.g. `text-rose-gold`,
 * `bg-rose-gold-light`) automatically uses the correct brand color.
 *
 * You can also call this at runtime to switch themes on the fly —
 * useful for a live theme-switcher in the admin panel.
 */
export function applyBrandTheme(colors: BrandColors = BRAND.colors): void {
    const r = document.documentElement;

    // Primary accent (maps to Tailwind's `rose-gold` utilities)
    r.style.setProperty('--color-rose-gold', colors.primary);
    r.style.setProperty('--color-rose-gold-light', colors.primaryLight);
    r.style.setProperty('--color-deep-rose', colors.primaryDark);

    // Soft tint palette (blush, etc.)
    r.style.setProperty('--color-blush', colors.blush);
    r.style.setProperty('--color-blush-light', colors.blushLight);
    r.style.setProperty('--color-blush-dark', colors.blushDark);

    // Structural colors
    r.style.setProperty('--color-soft-bg', colors.softBg);
    r.style.setProperty('--color-charcoal', colors.charcoal);
    r.style.setProperty('--color-warm-gray', colors.warmGray);

    // Keep body background in sync so pre-hydration flicker is gone
    document.body.style.backgroundColor = colors.softBg;
    document.body.style.color = colors.charcoal;
}

// ─── Legacy aliases ──────────────────────────────────────────────────────────
// Kept so files that still import `brandingConfig` or `BRAND` the old way
// don't break before you get around to updating them.

export const brandingConfig = {
    logoUrl: BRAND.logoUrl,
    faviconUrl: BRAND.faviconUrl,
    footerCopyright: `© {year} ${BRAND.fullName}. All rights reserved.`,
    companyName: BRAND.fullName,
    tagline: BRAND.tagline,
    colors: {
        primary: BRAND.colors.primary,
        secondary: BRAND.colors.warmGray,
        accent: BRAND.colors.primaryDark,
        background: BRAND.colors.softBg,
        text: BRAND.colors.charcoal,
    },
} as const;

export const getCopyrightText = () =>
    brandingConfig.footerCopyright.replace('{year}', new Date().getFullYear().toString());

export type BrandConfig = typeof BRAND;
export type BrandingConfig = typeof brandingConfig;
