/**
 * Tracking & Analytics Configuration
 * IDs are read here so event helpers (facebookPixel.ts, gtm.ts)
 * can conditionally fire only when an ID is actually configured.
 */

export const trackingConfig = {
    /**
     * Facebook Pixel ID — hardcoded to match index.html init snippet.
     * If you ever change the Pixel ID, update BOTH this file AND index.html.
     */
    facebookPixelId: '517991158551582',

    /**
     * Google Tag Manager container ID — matches index.html GTM snippet.
     * Format: GTM-XXXXXXX
     */
    gtmId: 'GTM-TWN3NF5S',

    /**
     * Google Search Console HTML-tag verification content value.
     * Leave empty string if already verified or not using Search Console.
     */
    googleSearchConsoleVerification: '',

    /**
     * ISO 4217 currency code used across all tracking events.
     */
    currency: 'BDT',
} as const;

export const isTrackingEnabled = () =>
    !!(trackingConfig.facebookPixelId || trackingConfig.gtmId);

export type TrackingConfig = typeof trackingConfig;
