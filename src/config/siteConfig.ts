/**
 * siteConfig.ts
 * Site-wide settings: payment methods, social links, domain, SEO.
 *
 * Brand name, title, and description are pulled automatically from
 * brandingConfig.ts — change them there, not here.
 */

import { BRAND } from './brandingConfig';

export const SITE = {
    /** Payment methods shown in footer */
    paymentMethods: ['bKash', 'Nagad', 'COD'] as string[],

    /** Social links */
    instagram: 'https://www.instagram.com/auntheticgirlswear',
    facebook: 'https://www.facebook.com/authenticgirlswear',

    /** Canonical domain (no trailing slash) */
    domain: 'https://girleyglow-seven.vercel.app',

    /** SEO / meta — derived from brandingConfig so renaming propagates here too */
    defaultTitle: BRAND.defaultTitle,
    defaultDescription: BRAND.defaultDescription,

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
        BRAND.fullName,
        'buy lingerie online',
        'buy bras online',
        'best bras in Bangladesh',
        'affordable lingerie sets',
        'luxury lingerie',
        'women lingerie',
        'womens lingerie',
        'intimate wear',
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
        'nighty',
        'nightdress',
        'satin nighty',
        'bridal lingerie',
        'romantic lingerie',
    ] as string[],

    ogImage: '/images/og-image.jpg',
} as const;

export type SiteConfig = typeof SITE;

// ─── Legacy alias ─────────────────────────────────────────────────────────────
// Any file still importing `siteConfig` (lowercase) keeps working.

export const siteConfig = {
    websiteName: BRAND.fullName,
    websiteShortName: BRAND.shortName,
    defaultTitle: BRAND.defaultTitle,
    defaultDescription: BRAND.defaultDescription,
    keywords: SITE.keywords,
    ogImage: SITE.ogImage,
    domain: SITE.domain,
} as const;

export type SiteConfigLegacy = typeof siteConfig;
