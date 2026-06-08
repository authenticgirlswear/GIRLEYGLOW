declare global { interface Window { fbq: any; } }

export const initFacebookPixel = () => {
    // Already initialized in index.html — nothing needed here
};

export const trackPageView = () => {
    window.fbq('track', 'PageView');
};

export const trackViewContent = (productName: string, price: number) => {
    window.fbq('track', 'ViewContent', {
        content_name: productName,
        value: price,
        currency: 'BDT',
    });
};

export const trackAddToCart = (productName: string, price: number) => {
    window.fbq('track', 'AddToCart', {
        content_name: productName,
        value: price,
        currency: 'BDT',
    });
};

export const trackInitiateCheckout = (total: number) => {
    window.fbq('track', 'InitiateCheckout', {
        value: total,
        currency: 'BDT',
    });
};

export const trackPurchase = (total: number) => {
    window.fbq('track', 'Purchase', {
        value: total,
        currency: 'BDT',
    });
};