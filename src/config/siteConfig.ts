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
    defaultTitle: 'Authentic Girlswear - Luxury Feminine Fashion',
    defaultDescription: 'Discover luxury feminine fashion at Authentic Girlswear. Dresses, tops, accessories and more — crafted for the modern woman.',
    keywords: [
        'girlswear',
        'women fashion',
        'dresses',
        'tops',
        'Bra',
        'Panties',
        'innerwear',
        'western dresses bangladesh',
        'bangladesh fashion',
        'authentic girlswear',
        'buy lingerie online',
        'buy bras online',
        'best bras in Bangladesh',
        'affordable lingerie sets',
        'luxury lingerie',
        'women lingerie',
        'womens lingerie',
        'intimate wear',
        'innerwear',
        'underwear for women',
        'bra',
        'bras',
        'bralette',
        'padded bra',
        'push up bra',
        'seamless bra',
        'wireless bra',
        'sports bra',
        'lace bra',
        'bra set',
        'panties',
        'panty',
        'briefs',
        'bikini panties',
        'lace panties',
        'cotton panties',
        'plus size lingerie',
        'maternity bra',
        'lingerie set',
        'couple nightwear',
        'couple nighty',
        'couple nightie set',
        'nighty',
        'nightdress',
        'nightgown',
        'satin nighty',
        'silk nighty',
        'lace nighty',
        'bridal lingerie',
        'bridal nightwear',
        'romantic lingerie',
        'sexy lingerie'
    ] as string[],

    ogImage: '/images/og-image.jpg',
} as const;

export type SiteConfig = typeof SITE;

// ─── Legacy alias kept for any file still importing siteConfig ───────────────
export const siteConfig = {
    websiteName: 'Authentic Girlswear',
    websiteShortName: 'AG',
    defaultTitle: SITE.defaultTitle,
    defaultDescription: SITE.defaultDescription,
    keywords: SITE.keywords,
    ogImage: SITE.ogImage,
    domain: SITE.domain,
} as const;

export type SiteConfigLegacy = typeof siteConfig;