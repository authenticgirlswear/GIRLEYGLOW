import ReactPixel from 'react-facebook-pixel';

const PIXEL_ID = 'PASTE_YOUR_PIXEL_ID_HERE';

export const initFacebookPixel = () => {
    ReactPixel.init(PIXEL_ID, undefined, {
        autoConfig: true,
        debug: false,
    });

    ReactPixel.pageView();
};

export const trackPageView = () => {
    ReactPixel.pageView();
};

export const trackViewContent = (
    productName: string,
    price: number
) => {
    ReactPixel.track('ViewContent', {
        content_name: productName,
        value: price,
        currency: 'BDT',
    });
};

export const trackAddToCart = (
    productName: string,
    price: number
) => {
    ReactPixel.track('AddToCart', {
        content_name: productName,
        value: price,
        currency: 'BDT',
    });
};

export const trackInitiateCheckout = (total: number) => {
    ReactPixel.track('InitiateCheckout', {
        value: total,
        currency: 'BDT',
    });
};

export const trackPurchase = (total: number) => {
    ReactPixel.track('Purchase', {
        value: total,
        currency: 'BDT',
    });
};