/* ===================================================
   AUTHENTIC GIRLSWEAR - Cart Page
   =================================================== */

declare global { interface Window { dataLayer: any[]; } }
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { Button, EmptyState, PriceDisplay } from '@/components/ui';
import { useCartStore } from '@/store';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, coupon, couponError, removeItem, updateQuantity, applyCoupon, removeCoupon, getSubtotal, getDiscount, getTotal } = useCartStore();
  const [couponCode, setCouponCode] = React.useState('');

  /* GTM DATA LAYER — view_cart */
  React.useEffect(() => {
    if (items.length === 0) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: 'view_cart',
      ecommerce: {
        currency: 'BDT',
        value: getTotal(),
        items: items.map(item => ({
          item_id: item.product.id,
          item_name: item.product.name,
          item_category: item.product.category,
          price: item.product.price,
          quantity: item.quantity,
        })),
      },
    });
  }, []);

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyState
            icon={<ShoppingBag size={48} />}
            title="Your bag is empty"
            description="Discover our beautiful collection and add your favorite pieces"
            action={<Button onClick={() => navigate('/shop')}>Continue Shopping</Button>}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="heading-serif text-3xl md:text-4xl font-bold text-charcoal mb-2">Shopping Bag</h1>
        <p className="text-[#6B5B55] mb-8">{items.length} {items.length === 1 ? 'item' : 'items'}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map(item => (
                <motion.div
                  key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="glass-card rounded-2xl p-4 md:p-6"
                >
                  <div className="flex gap-4 md:gap-6">
                    {/* Image */}
                    <Link to={`/product/${item.product.slug}`} className={`w-24 h-32 md:w-32 md:h-40 rounded-xl flex-shrink-0 ${item.product.images[0]}`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link to={`/product/${item.product.slug}`} className="font-medium text-charcoal hover:text-rose-gold transition-colors">
                            {item.product.name}
                          </Link>
                          <p className="text-sm text-[#6B5B55] mt-0.5">
                            Size: {item.selectedSize} • Color: {item.selectedColor}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id, item.selectedSize, item.selectedColor)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-[#6B5B55] hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex items-end justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-blush-light/50 flex items-center justify-center hover:bg-blush-light transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-blush-light/50 flex items-center justify-center hover:bg-blush-light transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <PriceDisplay price={item.product.price * item.quantity} comparePrice={item.product.comparePrice ? item.product.comparePrice * item.quantity : undefined} size="md" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl p-6 sticky top-24">
              <h2 className="heading-serif text-xl font-semibold text-charcoal mb-4">Order Summary</h2>

              {/* Coupon */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5B55]" />
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30"
                    />
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => applyCoupon(couponCode)}>Apply</Button>
                </div>
                {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                {coupon && (
                  <div className="flex items-center justify-between mt-2 p-2 bg-green-50 rounded-lg">
                    <span className="text-xs text-green-700">✓ {coupon.code} applied</span>
                    <button onClick={removeCoupon} className="text-xs text-red-500 hover:underline">Remove</button>
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B5B55]">Subtotal</span>
                  <span className="font-medium">${getSubtotal().toFixed(2)}</span>
                </div>
                {getDiscount() > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Discount</span>
                    <span className="text-green-600 font-medium">-${getDiscount().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B5B55]">Shipping</span>
                  <span className="font-medium">{getSubtotal() >= 150 ? 'Free' : '$10.00'}</span>
                </div>
              </div>

              <div className="luxury-line mb-4" />

              <div className="flex justify-between mb-6">
                <span className="font-semibold text-charcoal">Total</span>
                <span className="heading-serif text-2xl font-bold text-charcoal">
                  ${(getTotal() + (getSubtotal() >= 150 ? 0 : 10)).toFixed(2)}
                </span>
              </div>

              <Button fullWidth size="lg" onClick={() => navigate('/checkout')}>
                Proceed to Checkout <ArrowRight size={16} />
              </Button>

              <button
                onClick={() => navigate('/shop')}
                className="w-full mt-3 text-center text-sm text-rose-gold hover:underline"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
