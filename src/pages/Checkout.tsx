/* ===================================================
   Girley Glow - Checkout Page
   - Single page form (no steps)
   - Bangla labels
   - Payment method selection inline
   - Review popup modal
   - Google Sheets integration
   - bKash/Nagad: 01623-124760 (tap to copy)
   =================================================== */
declare global { interface Window { dataLayer: any[]; } }
import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle, ArrowLeft,
  Tag, AlertCircle, Package, Copy, Check, X,
  CreditCard, Truck,
} from 'lucide-react';
import { useCartStore, useOrderStore } from '@/store';
import { sendOrderToGoogleSheets } from '@/lib/supabase';
import type { PaymentMethod, Product, } from '@/types';
import { trackInitiateCheckout, trackPurchase } from '@/lib/facebookPixel';
import { validateCoupon } from '@/lib/supabase';


interface BuyNowState {
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

const PAYMENT_NUMBER = '01623-124760';

const DELIVERY_ZONES = [
  { id: 'inside_dhaka', label: 'ঢাকার ভেতরে', charge: 80, icon: '🏙️' },
  { id: 'outside_dhaka', label: 'ঢাকার বাইরে', charge: 150, icon: '🗺️' },
] as const;

type DeliveryZone = typeof DELIVERY_ZONES[number]['id'];

/* ─── Copy button for payment number ─── */
const CopyNumber: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(PAYMENT_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
      style={{
        background: copied ? 'rgba(74,140,92,0.15)' : 'rgba(176,125,107,0.12)',
        color: copied ? '#4A8C5C' : '#B07D6B',
        border: `1px solid ${copied ? 'rgba(74,140,92,0.3)' : 'rgba(176,125,107,0.25)'}`,
      }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'কপি হয়েছে!' : PAYMENT_NUMBER}
    </button>
  );
};

/* ─── Field wrapper ─── */
const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}> = ({ label, children, error, required }) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#8C7269' }}>
      {label}{required && <span style={{ color: '#B07D6B' }}> *</span>}
    </label>
    {children}
    {error && (
      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        className="text-xs mt-1 flex items-center gap-1" style={{ color: '#C0504D' }}>
        <AlertCircle size={11} />{error}
      </motion.p>
    )}
  </div>
);

/* ─── Styled Input ─── */
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }> = ({
  hasError, ...props
}) => (
  <input
    {...props}
    className="w-full px-4 py-2 rounded-xl text-sm outline-none transition-all"
    style={{
      background: hasError ? 'rgba(192,80,77,0.04)' : 'rgba(255,255,255,0.8)',
      border: `1.5px solid ${hasError ? 'rgba(192,80,77,0.4)' : 'rgba(176,125,107,0.2)'}`,
      color: '#2C2C2C',
    }}
    onFocus={e => {
      e.target.style.border = '1.5px solid rgba(176,125,107,0.6)';
      e.target.style.boxShadow = '0 0 0 3px rgba(176,125,107,0.1)';
    }}
    onBlur={e => {
      e.target.style.border = `1.5px solid ${hasError ? 'rgba(192,80,77,0.4)' : 'rgba(176,125,107,0.2)'}`;
      e.target.style.boxShadow = 'none';
    }}
  />
);

/* ─── Styled Textarea ─── */
const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea
    {...props}
    rows={3}
    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
    style={{
      background: 'rgba(255,255,255,0.8)',
      border: '1.5px solid rgba(176,125,107,0.2)',
      color: '#2C2C2C',
    }}
    onFocus={e => {
      e.target.style.border = '1.5px solid rgba(176,125,107,0.6)';
      e.target.style.boxShadow = '0 0 0 3px rgba(176,125,107,0.1)';
    }}
    onBlur={e => {
      e.target.style.border = '1.5px solid rgba(176,125,107,0.2)';
      e.target.style.boxShadow = 'none';
    }}
  />
);

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, getSubtotal, getDiscount, clearCart } = useCartStore();
  const { placeOrder } = useOrderStore();

  const buyNow = location.state as BuyNowState | null;

  const checkoutItems = useMemo(() => {
    if (buyNow?.product) {
      return [{ product: buyNow.product, selectedSize: buyNow.size, selectedColor: buyNow.color, quantity: buyNow.quantity }];
    }
    return items;
  }, [buyNow, items]);

  const subtotal = useMemo(() => {
    if (buyNow?.product) return buyNow.product.price * buyNow.quantity;
    return getSubtotal();
  }, [buyNow, getSubtotal]);

  const discount = buyNow ? 0 : getDiscount();

  // Form
  const [form, setForm] = useState({ fullName: '', phone: '', address: '', notes: '' });
  const [errors, setErrors] = useState<Partial<typeof form & { deliveryZone: string; transactionId: string }>>({});
  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // Delivery
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZone | ''>('');
  const shippingCharge = deliveryZone ? DELIVERY_ZONES.find(z => z.id === deliveryZone)!.charge : 0;

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [transactionId, setTransactionId] = useState('');

  // Coupon
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');

  const applyCoupon = async () => {
    setCouponError('');
    if (!couponInput.trim()) { setCouponError('কুপন কোড দিন।'); return; }
    const coupon = await validateCoupon(couponInput.trim());
    if (!coupon) { setCouponError('ভুল কুপন কোড।'); return; }
    if (new Date(coupon.expires_at) < new Date()) { setCouponError('এই কুপনের মেয়াদ শেষ।'); return; }
    setCouponDiscount(
      coupon.type === 'percentage' ? Math.round(subtotal * coupon.discount / 100) : coupon.discount
    );
    setCouponApplied(true);
  };

  const total = subtotal - discount - couponDiscount + shippingCharge;

  // Review popup
  const [showReview, setShowReview] = useState(false);

  // Order placed
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [placing, setPlacing] = useState(false);

  // Validation
  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!form.fullName.trim()) newErrors.fullName = 'নাম দিন।';
    if (!form.phone.trim()) newErrors.phone = 'মোবাইল নম্বর দিন।';
    if (!form.address.trim()) newErrors.address = 'ঠিকানা দিন।';
    if (!deliveryZone) newErrors.deliveryZone = 'ডেলিভারি এলাকা বেছে নিন।';
    if ((paymentMethod === 'bkash' || paymentMethod === 'nagad') && !transactionId.trim()) {
      newErrors.transactionId = 'ট্রানজেকশন আইডি দিন।';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReviewOrder = () => {
    if (validate()) {
      trackInitiateCheckout(total);

      /* GTM DATA LAYER — begin_checkout */
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ ecommerce: null });
      window.dataLayer.push({
        event: 'begin_checkout',
        ecommerce: {
          currency: 'BDT',
          value: total,
          items: checkoutItems.map(item => ({
            item_id: item.product.id,
            item_name: item.product.name,
            item_category: item.product.category,
            price: item.product.price,
            quantity: item.quantity,
          })),
        },
      });

      setShowReview(true);
    }
  };

  // Place order
  const handlePlaceOrder = async () => {
    setPlacing(true);
    const num = `AG-${Date.now().toString().slice(-6)}`;
    const [firstName, ...rest] = form.fullName.trim().split(' ');
    const lastName = rest.join(' ');

    const orderData = {
      id: Date.now().toString(),
      orderNumber: num,
      status: 'pending' as const,
      paymentStatus: 'pending' as const,
      paymentMethod,
      transactionId: transactionId || undefined,
      couponCode: couponApplied ? couponInput.trim().toUpperCase() : undefined,
      subtotal,
      shippingCharge,
      discount: discount + couponDiscount,
      total,
      notes: form.notes || '-',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customer: {
        firstName,
        lastName,
        email: '',
        phone: form.phone,
        address: form.address,
        city: DELIVERY_ZONES.find(z => z.id === deliveryZone)?.label || '',
        district: '',
      },
      items: checkoutItems.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        productImage: item.product.images?.[0] || '',
        size: item.selectedSize,
        color: item.selectedColor,
        quantity: item.quantity,
        price: item.product.price,
      })),
    };

    try {
      await placeOrder(orderData);
    } catch (err) {
      console.error('Order failed', err);
      setPlacing(false);
      return;
    }
    trackPurchase(total);

    /* GTM DATA LAYER — purchase */
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: 'purchase',
      ecommerce: {
        transaction_id: num,
        currency: 'BDT',
        value: total,
        shipping: shippingCharge,
        coupon: couponApplied ? couponInput.trim().toUpperCase() : undefined,
        items: checkoutItems.map(item => ({
          item_id: item.product.id,
          item_name: item.product.name,
          item_category: item.product.category,
          price: item.product.price,
          quantity: item.quantity,
        })),
      },
    });

    // Send to Google Sheets
    try {
      await sendOrderToGoogleSheets(orderData as Record<string, unknown>);
    } catch {
      // don't block order
    }

    setOrderNumber(num);
    setOrderPlaced(true);
    setShowReview(false);
    if (!buyNow) clearCart();
    setPlacing(false);
  };

  // Redirect if empty
  if (checkoutItems.length === 0 && !orderPlaced) {
    navigate('/cart');
    return null;
  }

  /* ── ORDER CONFIRMED ── */
  if (orderPlaced) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center" style={{ background: '#FAF6F3' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)' }}>
            <CheckCircle size={44} className="text-green-500" />
          </motion.div>
          <h1 className="heading-serif text-3xl font-bold text-charcoal mb-2">অর্ডার সম্পন্ন! 🎉</h1>
          <p className="text-warm-gray mb-2">আপনার অর্ডারের জন্য ধন্যবাদ</p>
          <p className="text-sm text-warm-gray mb-6">
            অর্ডার নম্বর: <strong className="text-charcoal">{orderNumber}</strong>
          </p>
          <div className="rounded-2xl p-5 mb-6 text-sm text-warm-gray text-left"
            style={{ background: 'rgba(176,125,107,0.08)', border: '1px solid rgba(176,125,107,0.2)' }}>
            {paymentMethod === 'cod'
              ? '✅ ডেলিভারির সময় টাকা পরিশোধ করুন।'
              : `✅ আপনার পেমেন্ট যাচাই করা হবে ২৪ ঘণ্টার মধ্যে।`}
          </div>
          <button
            onClick={() => navigate('/shop')}
            className="px-8 py-3 rounded-2xl font-semibold text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #B07D6B, #C4956A)' }}>
            শপিং চালিয়ে যান
          </button>
        </motion.div>
      </div>
    );
  }

  const paymentMethods = [
    { id: 'cod' as PaymentMethod, label: 'ক্যাশ অন ডেলিভারি', desc: 'পণ্য পেলে টাকা দিন', icon: <Truck size={18} /> },
    { id: 'bkash' as PaymentMethod, label: 'বিকাশ', desc: 'বিকাশে পেমেন্ট করুন', icon: <CreditCard size={18} /> },
    { id: 'nagad' as PaymentMethod, label: 'নগদ', desc: 'নগদে পেমেন্ট করুন', icon: <CreditCard size={18} /> },
  ];

  return (
    <div className="min-h-screen pt-20 pb-16" style={{ background: '#FAF6F3' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)}
            className="p-2 rounded-xl" style={{ background: 'rgba(176,125,107,0.1)', color: '#B07D6B' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="heading-serif text-2xl font-bold text-charcoal">চেকআউট</h1>
            <p className="text-xs text-[#6B5B55]">আপনার অর্ডার সম্পন্ন করুন</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl p-5 md:p-5 space-y-3"
          style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', border: '1px solid rgba(176,125,107,0.15)' }}>

          {/* ── Order Summary (top) ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#B07D6B' }}>
              <Package size={12} className="inline mr-1" />
              আপনার অর্ডার ({checkoutItems.length} পণ্য)
            </p>
            <div className="space-y-2">
              {checkoutItems.map(item => (
                <div key={`${item.product.id}-${item.selectedSize}`}
                  className="flex items-center gap-2 p-2.5 rounded-xl"
                  style={{ background: 'rgba(176,125,107,0.05)' }}>
                  {item.product.images?.[0]?.startsWith('http') ? (
                    <img src={item.product.images[0]} alt={item.product.name}
                      className="w-11 h-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-12 rounded-lg flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #F0E0D6, #E8D0C4)' }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal truncate">{item.product.name}</p>
                    <p className="text-xs text-[#6B5B55]">{item.selectedSize} • {item.selectedColor} × {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold flex-shrink-0" style={{ color: '#B07D6B' }}>
                    ৳{(item.product.price * item.quantity).toFixed(0)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px" style={{ background: 'rgba(176,125,107,0.15)' }} />

          {/* ── Shipping Info ── */}
          <div className="space-y-2">
            <p className="text-[15px] font-bold text-[#2B2B2B]">📦 ডেলিভারি তথ্য</p>

            <Field label="পুরো নাম" required error={errors.fullName}>
              <Input
                value={form.fullName}
                onChange={e => updateForm('fullName', e.target.value)}
                placeholder="আপনার  নাম"
                hasError={!!errors.fullName}
              />
            </Field>

            <Field label="মোবাইল নম্বর" required error={errors.phone}>
              <Input
                type="tel"
                value={form.phone}
                onChange={e => updateForm('phone', e.target.value)}
                placeholder="মোবাইল নম্বর"
                hasError={!!errors.phone}
              />
            </Field>

            <Field label="সম্পূর্ণ ঠিকানা" required error={errors.address}>
              <Textarea
                value={form.address}
                onChange={e => updateForm('address', e.target.value)}
                placeholder="সম্পূর্ণ ঠিকানা, গ্রাম, থানা, বিভাগ"
              />
            </Field>

            {/* Delivery Zone */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8C7269' }}>
                ডেলিভারি এলাকা <span style={{ color: '#e87c55' }}>*</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                {DELIVERY_ZONES.map(zone => (
                  <motion.button key={zone.id} type="button"
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { setDeliveryZone(zone.id); setErrors(p => ({ ...p, deliveryZone: '' })); }}
                    className="text-left p-3 rounded-2xl transition-all"
                    style={{
                      border: deliveryZone === zone.id ? '2px solid #B07D6B' : '1.5px solid rgba(176,125,107,0.2)',
                      background: deliveryZone === zone.id ? 'rgba(176,125,107,0.08)' : 'rgba(255,255,255,0.6)',
                    }}>
                    <span className="text-xl">{zone.icon}</span>
                    <p className="font-semibold text-sm mt-1" style={{ color: '#2C2C2C' }}>{zone.label}</p>
                    <p className="text-sm font-bold mt-1" style={{ color: '#B07D6B' }}>৳{zone.charge}</p>
                  </motion.button>
                ))}
              </div>
              {errors.deliveryZone && (
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#C0504D' }}>
                  <AlertCircle size={11} />{errors.deliveryZone}
                </p>
              )}
            </div>

            {/* Notes */}
            <Field label="বিশেষ নির্দেশনা (ঐচ্ছিক)">
              <Textarea
                value={form.notes}
                onChange={e => updateForm('notes', e.target.value)}
                placeholder="কোনো বিশেষ কিছু জানাতে চাইলে লিখুন..."
              />
            </Field>
          </div>

          <div className="h-px" style={{ background: 'rgba(176,125,107,0.15)' }} />

          {/* ── Payment Method ── */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-charcoal">💳 পেমেন্ট পদ্ধতি</p>
            <div className="space-y-2">
              {paymentMethods.map(method => (
                <motion.button key={method.id} whileTap={{ scale: 0.99 }}
                  onClick={() => setPaymentMethod(method.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all"
                  style={{
                    border: paymentMethod === method.id
                      ? '2px solid #B07D6B'
                      : '1.5px solid rgba(176,125,107,0.35)',
                    background: paymentMethod === method.id
                      ? 'rgba(176,125,107,0.14)'
                      : 'rgba(255,255,255,0.85)',
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: paymentMethod === method.id
                        ? 'linear-gradient(135deg, #B07D6B, #C4956A)'
                        : 'rgba(176,125,107,0.18)',
                      color: paymentMethod === method.id ? 'Black' : '#B07D6B',
                    }}>
                    {method.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[14px] text-[#2A2A2A]">{method.label}</p>
                    <p className="text-xs text-[#6B5B55]">{method.desc}</p>
                  </div>
                  {paymentMethod === method.id && (
                    <CheckCircle size={18} style={{ color: '#1be904' }} />
                  )}
                </motion.button>
              ))}
            </div>

            {/* bKash / Nagad instructions */}
            <AnimatePresence>
              {(paymentMethod === 'bkash' || paymentMethod === 'nagad') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="rounded-2xl p-4 space-y-3"
                    style={{ background: 'rgba(176,125,107,0.06)', border: '1px solid rgba(176,125,107,0.2)' }}>
                    <p className="text-sm font-semibold text-charcoal">পেমেন্ট পাঠানোর নির্দেশনা:</p>
                    <ol className="text-sm space-y-1.5" style={{ color: '#6C5A54' }}>
                      <li>১. নিচের নম্বরে <strong>৳{total.toFixed(0)}</strong> পাঠান:</li>
                    </ol>
                    <CopyNumber />
                    <ol className="text-sm space-y-1.5" style={{ color: '#6C5A54' }}>
                      <li>২. আপনার বিকাশ/নগদ নাম্বারের শেষ ৪ ডিজিট লেখুন</li>
                      <li>৩. আমরা ২৪ ঘণ্টার মধ্যে যাচাই করব</li>
                    </ol>
                    <Field label="শেষের ৪ সংখা" required error={errors.transactionId}>
                      <Input
                        value={transactionId}
                        onChange={e => { setTransactionId(e.target.value); setErrors(p => ({ ...p, transactionId: '' })); }}
                        placeholder="যেমন : 3060"
                        hasError={!!errors.transactionId}
                      />
                    </Field>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-px" style={{ background: 'rgba(176,125,107,0.15)' }} />

          {/* ── Coupon ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#8C7269' }}>
              <Tag size={11} className="inline mr-1" />কুপন কোড (ঐচ্ছিক)
            </p>
            <div className="flex gap-2">
              <input value={couponInput}
                onChange={e => { setCouponInput(e.target.value); setCouponError(''); if (couponApplied) { setCouponApplied(false); setCouponDiscount(0); } }}
                placeholder="কুপন কোড লিখুন"
                className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.8)', border: `1.5px solid ${couponError ? 'rgba(192,80,77,0.4)' : couponApplied ? 'rgba(74,140,92,0.4)' : 'rgba(176,125,107,0.2)'}`, color: '#2C2C2C' }}
                onKeyDown={e => e.key === 'Enter' && applyCoupon()}
              />
              <button onClick={applyCoupon}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: couponApplied ? 'rgba(74,140,92,0.15)' : 'rgba(176,125,107,0.15)', color: couponApplied ? '#4A8C5C' : '#B07D6B', border: 'none', cursor: 'pointer' }}>
                {couponApplied ? '✓ হয়েছে' : 'প্রয়োগ করুন'}
              </button>
            </div>
            {couponError && <p className="text-xs mt-1" style={{ color: '#C0504D' }}>{couponError}</p>}
            {couponApplied && <p className="text-xs mt-1" style={{ color: '#4A8C5C' }}>✓ ৳{couponDiscount} ছাড় পেয়েছেন!</p>}
          </div>

          <div className="h-px" style={{ background: 'rgba(176,125,107,0.15)' }} />

          {/* ── Price Summary ── */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-warm-gray">সাবটোটাল</span>
              <span className="font-medium">৳{subtotal.toFixed(0)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between" style={{ color: '#4A8C5C' }}>
                <span>ছাড়</span><span>−৳{discount.toFixed(0)}</span>
              </div>
            )}
            {couponApplied && couponDiscount > 0 && (
              <div className="flex justify-between" style={{ color: '#4A8C5C' }}>
                <span>কুপন ছাড়</span><span>−৳{couponDiscount.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-warm-gray">ডেলিভারি চার্জ</span>
              <span className="font-medium" style={{ color: '#B07D6B' }}>
                {deliveryZone ? `৳${shippingCharge}` : 'এলাকা বেছে নিন'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2"
              style={{ borderTop: '1px solid rgba(176,125,107,0.15)' }}>
              <span className="font-bold text-charcoal text-base">মোট</span>
              <span className="heading-serif text-2xl font-bold" style={{ color: '#B07D6B' }}>৳{total.toFixed(0)}</span>
            </div>
          </div>

          {/* ── Review Order Button ── */}
          <motion.button
            onClick={handleReviewOrder}
            whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(176,125,107,0.35)' }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl font-bold text-sm tracking-wider uppercase text-white"
            style={{ background: 'linear-gradient(135deg, #B07D6B 0%, #C4956A 50%, #B07D6B 100%)', border: 'none', cursor: 'pointer' }}>
            অর্ডার রিভিউ করুন →
          </motion.button>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 text-xs" style={{ color: '#9A8880' }}>
            <Shield size={12} style={{ color: '#B07D6B' }} />
            নিরাপদ চেকআউট • SSL এনক্রিপ্টেড
          </div>
        </div>
      </div>

      {/* ════ REVIEW POPUP MODAL ════ */}
      <AnimatePresence>
        {showReview && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowReview(false); }}>
            <motion.div
              initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              className="w-full max-w-md rounded-3xl overflow-hidden"
              style={{ background: '#FDF8F5', maxHeight: '90vh', overflowY: 'auto' }}>

              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 sticky top-0"
                style={{ background: '#FDF8F5', borderBottom: '1px solid rgba(176,125,107,0.15)' }}>
                <h2 className="heading-serif text-lg font-bold text-charcoal">অর্ডার নিশ্চিত করুন</h2>
                <button onClick={() => setShowReview(false)}
                  className="p-1.5 rounded-lg" style={{ background: 'rgba(176,125,107,0.1)', color: '#B07D6B' }}>
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 space-y-4">

                {/* Customer Info */}
                <div className="rounded-2xl p-4"
                  style={{ background: 'rgba(176,125,107,0.06)', border: '1px solid rgba(176,125,107,0.15)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#B07D6B' }}>📍 ডেলিভারি তথ্য</p>
                  <p className="text-sm font-semibold text-charcoal">{form.fullName}</p>
                  <p className="text-sm text-warm-gray">{form.phone}</p>
                  <p className="text-sm text-warm-gray">{form.address}</p>
                  <p className="text-xs mt-1 font-medium" style={{ color: '#B07D6B' }}>
                    {DELIVERY_ZONES.find(z => z.id === deliveryZone)?.label} — ৳{shippingCharge}
                  </p>
                </div>

                {/* Payment Info */}
                <div className="rounded-2xl p-4"
                  style={{ background: 'rgba(176,125,107,0.06)', border: '1px solid rgba(176,125,107,0.15)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#B07D6B' }}>💳 পেমেন্ট</p>
                  <p className="text-sm text-charcoal">
                    {paymentMethod === 'cod' ? 'ক্যাশ অন ডেলিভারি' : paymentMethod === 'bkash' ? 'বিকাশ' : 'নগদ'}
                  </p>
                  {transactionId && <p className="text-xs text-warm-gray mt-1">TXN: {transactionId}</p>}
                </div>

                {/* Items */}
                <div className="rounded-2xl p-4"
                  style={{ background: 'rgba(176,125,107,0.06)', border: '1px solid rgba(176,125,107,0.15)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#B07D6B' }}>🛍️ অর্ডার আইটেম</p>
                  <div className="space-y-2">
                    {checkoutItems.map(item => (
                      <div key={item.product.id} className="flex items-center gap-3">
                        <div className="w-10 h-12 rounded-lg overflow-hidden flex-shrink-0"
                          style={{ background: 'rgba(176,125,107,0.1)' }}>
                          {item.product.images?.[0]?.startsWith('http') && (
                            <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-charcoal truncate">{item.product.name}</p>
                          <p className="text-xs text-[#6B5B55]">{item.selectedSize} • x{item.quantity}</p>
                        </div>
                        <p className="text-sm font-bold flex-shrink-0" style={{ color: '#B07D6B' }}>
                          ৳{(item.product.price * item.quantity).toFixed(0)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center px-1">
                  <span className="font-bold text-charcoal">মোট পরিমাণ</span>
                  <span className="heading-serif text-xl font-bold" style={{ color: '#B07D6B' }}>৳{total.toFixed(0)}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowReview(false)}
                    className="flex-1 py-3.5 rounded-2xl font-semibold text-sm"
                    style={{ background: 'rgba(176,125,107,0.1)', color: '#B07D6B', border: 'none', cursor: 'pointer' }}>
                    ← ফিরে যান
                  </button>
                  <motion.button
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white"
                    style={{ background: placing ? 'rgba(176,125,107,0.5)' : 'linear-gradient(135deg, #B07D6B, #C4956A)', border: 'none', cursor: placing ? 'not-allowed' : 'pointer' }}>
                    {placing ? 'প্রসেস হচ্ছে...' : `অর্ডার করুন — ৳${total.toFixed(0)}`}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};