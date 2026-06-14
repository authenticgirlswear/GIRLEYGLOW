/**
 * Tracking & Analytics Configuration
 * 
 * This file contains all tracking codes and analytics IDs.
 * These help you monitor website traffic and user behavior.
 * 
 * HOW TO FIND THESE IDs:
 * - Facebook Pixel: Facebook Events Manager > Data Sources > Pixel
 * - Google Tag Manager: GTM Dashboard > Container ID (starts with GTM-)
 * - Search Console: Google Search Console > Settings > Verification
 */

export const trackingConfig = {
    /**
     * Facebook Pixel ID
     * Used to track conversions and build audiences for Facebook Ads
     * Format: Usually a 15-16 digit number
     * Example: "1234567890123456"
     * Leave empty string "" if not using Facebook Pixel
     */
    facebookPixelId: "",

    /**
     * Google Tag Manager ID
     * Container ID from your GTM account
     * Format: GTM-XXXXXXX
     * Example: "GTM-ABC1234"
     * Leave empty string "" if not using GTM
     */
    gtmId: "",

    /**
     * Google Search Console Verification Code
     * Meta tag verification code (not the full meta tag, just the content value)
     * Example: "abcdefghijklmnopqrstuvwxyz123456"
     * Leave empty string "" if already verified or not using Search Console
     */
    googleSearchConsoleVerification: "",

    /**
     * Default Currency Code
     * ISO 4217 currency code used across all tracking/analytics events
     * (Facebook Pixel, GTM ecommerce events, etc.)
     * Example: "BDT", "USD", "EUR"
     */
    currency: "BDT",
} as const;

/**
 * Helper function to check if tracking is enabled
 * Returns true if at least one tracking code is configured
 */
export const isTrackingEnabled = () => {
    return !!(
        trackingConfig.facebookPixelId ||
        trackingConfig.gtmId ||
        trackingConfig.googleSearchConsoleVerification
    );
};

// TypeScript type for the config
export type TrackingConfig = typeof trackingConfig;