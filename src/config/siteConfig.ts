/**
 * Site Configuration
 * Central source for site-wide settings.
 * Import SITE wherever payment methods, SEO, or site meta is needed.
 */

export const SITE = {
    /** Payment methods shown in footer */
    paymentMethods: ['bKash', 'Nagad', 'COD'] as string[],

    /** Social links (fallback if not set in CONTACT) */
    instagram: 'https://www.instagram.com/auntheticgirlswear',
    facebook: 'https://www.facebook.com/authenticgirlswear',

    /** SEO / meta */
    domain: 'https://authenticgirlswear.com',
    defaultTitle: 'Girley Glow - Luxury Feminine Fashion',
    defaultDescription: 'Discover luxury feminine fashion at Authentic Girlswear. Dresses, tops, accessories and more — crafted for the modern woman.',
    keywords: [
        'girlswear',
        'women fashion',
        'dresses',
        'tops',
        'bangladesh fashion',
        'girley glow',
    ],
    ogImage: '/images/og-image.jpg',
} as const;

export type SiteConfig = typeof SITE;

// ─── Legacy alias kept for any file still importing siteConfig ───────────────
export const siteConfig = {
    websiteName: 'Girley Glow',
    websiteShortName: 'GG',
    defaultTitle: SITE.defaultTitle,
    defaultDescription: SITE.defaultDescription,
    keywords: SITE.keywords,
    ogImage: SITE.ogImage,
    domain: SITE.domain,
} as const;

export type SiteConfigLegacy = typeof siteConfig;