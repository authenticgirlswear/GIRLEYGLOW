// ===================================================
// POST /api/create-payment-intent
//
// Creates a Stripe PaymentIntent for an order that has already been
// saved with payment_status = 'pending'. The client (Checkout.tsx)
// confirms this PaymentIntent itself using the on-page Stripe Elements
// card form via stripe.confirmCardPayment() — no redirect to a Stripe-
// hosted page, no second card entry.
//
// This replaces create-stripe-session.js for the embedded checkout flow.
// (You can delete create-stripe-session.js once you're no longer using
// the hosted-Checkout redirect anywhere.)
//
// Required environment variable (Vercel Project Settings > Environment
// Variables — NOT your .env that ships to the browser):
//   STRIPE_SECRET_KEY        e.g. sk_test_...
// ===================================================

import Stripe from 'stripe';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { STRIPE_SECRET_KEY } = process.env;

    if (!STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: 'Stripe is not configured on the server.' });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY);

    try {
        const { orderNumber, amount, currency = 'usd' } = req.body || {};

        // ── Basic input validation ────────────────────────────────────────
        if (!orderNumber || typeof orderNumber !== 'string') {
            return res.status(400).json({ error: 'orderNumber is required.' });
        }
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ error: 'A valid positive amount is required.' });
        }

        // Stripe wants amounts in the smallest currency unit (e.g. cents for USD).
        // As with create-stripe-session.js, re-validate this against your own
        // order record server-side before going live — never trust a client-sent
        // price as the final word on what gets charged.
        const unitAmount = Math.round(amount * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: unitAmount,
            currency,
            // orderNumber travels in metadata so the webhook can find the
            // matching row when the payment succeeds.
            metadata: { orderNumber },
            // Card-only, matches the on-page Elements form (CardNumberElement /
            // CardExpiryElement / CardCvcElement). 3D Secure is handled
            // automatically by stripe.confirmCardPayment() on the client.
            payment_method_types: ['card'],
        });

        return res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        console.error('[create-payment-intent]', err);
        return res.status(500).json({ error: 'Failed to create payment intent.' });
    }
}