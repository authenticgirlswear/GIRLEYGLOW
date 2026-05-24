/* ===================================================
   AUTHENTIC GIRLSWEAR - Product Detail Page
   FIXED: Fetches product from Supabase by slug,
   so admin-uploaded products display correctly.
   =================================================== */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Heart, ArrowLeft, ArrowRight,
  Minus, Plus, ChevronRight, X,
} from 'lucide-react';
import { Button, Badge, PriceDisplay, FadeIn } from '@/components/ui';
import { ProductCard } from '@/components/home';
import { supabase } from '@/lib/supabase';
import { useCartStore, useRecentlyViewedStore } from '@/store';
import type { Product } from '@/types';
import { trackViewContent } from '@/lib/facebookPixel';

/* ─── normalise snake_case Supabase row → Product shape ─── */
const normalise = (p: any): Product => ({
  id: p.id,
  name: p.name || '',
  slug: p.slug || '',
  description: p.description || '',
  shortDescription: p.short_description || '',
  price: Number(p.price) || 0,
  comparePrice: p.compare_price ? Number(p.compare_price) : undefined,
  images: p.images || [],
  category: p.category_name || p.category || '',
  categorySlug: p.category_slug || '',
  sizes: p.sizes || [],
  colors: p.colors || [],
  stock: Number(p.stock) || 0,
  sku: p.sku || '',
  tags: p.tags || [],
  isFeatured: p.is_featured || false,
  isTrending: p.is_trending || false,
  isNewArrival: p.is_new_arrival || false,
  isOnSale: p.is_on_sale || false,
  rating: Number(p.rating) || 0,
  reviewCount: Number(p.review_count) || 0,
  createdAt: p.created_at || '',
  videoUrl: p.video_url || '',
  updatedAt: p.updated_at || '',
});

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const addItem = useCartStore(s => s.addItem);
  const addRecentlyViewed = useRecentlyViewedStore(s => s.addProduct);

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'shipping'>('description');
  const [addedToCart, setAddedToCart] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [similarPage, setSimilarPage] = useState(0);

  /* ── Fetch product by slug from Supabase ── */
  useEffect(() => {
    if (!slug) return;

    const fetchProduct = async () => {
      setLoading(true);
      setNotFound(false);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !data) {
        console.error('[ProductDetail] Supabase error:', error);
        setNotFound(true);
        setLoading(false);
        return;
      }

      const normalised = normalise(data);

      setProduct(normalised);

      /* FACEBOOK PIXEL VIEW CONTENT */
      trackViewContent(normalised.name, normalised.price);

      setSelectedSize(normalised.sizes[0] || '');

      const firstColor = normalised.colors[0];

      setSelectedColor(
        typeof firstColor === 'string'
          ? firstColor
          : firstColor?.name || firstColor?.label || ''
      );
      addRecentlyViewed(normalised.id);

      /* ── Fetch related products (same category, excluding this one) ── */
      if (normalised.categorySlug) {
        const { data: relatedData } = await supabase
          .from('products')
          .select('*')
          .eq('category_slug', normalised.categorySlug)
          .neq('id', normalised.id)
          .limit(4);

        setRelated((relatedData || []).map(normalise));
      }

      setLoading(false);
    };

    fetchProduct();
  }, [slug, addRecentlyViewed]);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-warm-gray">Loading product...</p>
      </div>
    );
  }

  /* ── Not found state ── */
  if (notFound || !product) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="heading-serif text-3xl font-bold text-charcoal mb-4">
            Product Not Found
          </h2>
          <Button onClick={() => navigate('/shop')}>Back to Shop</Button>
        </div>
      </div>
    );
  }
  const SizeGuidePopup = () => {
    const [band, setBand] = useState('');
    const [bust, setBust] = useState('');
    const [result, setResult] = useState('');
    const [celebrate, setCelebrate] = useState(false);
    const calculate = () => {
      const bandValue = parseFloat(band);
      const bustValue = parseFloat(bust);

      if (!bandValue || !bustValue) {
        alert('সঠিক মাপ দিন');
        return;
      }

      // nearest even band size
      const roundedBand = Math.round(bandValue / 2) * 2;

      // cup difference
      const difference = bustValue - bandValue;

      const cupSizes = [
        'AA',
        'A',
        'B',
        'C',
        'D',
        'DD',
        'E',
        'F',
        'G'
      ];

      const cupIndex = Math.max(
        0,
        Math.min(Math.round(difference), cupSizes.length - 1)
      );

      const cup = cupSizes[cupIndex];

      setResult(`${roundedBand}${cup}`);

      setCelebrate(true);

      setTimeout(() => setCelebrate(false), 2500);
    };
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowSizeGuide(false)} />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white rounded-3xl p-6 max-w-sm w-full z-10 max-h-[90vh] overflow-y-auto">
          <button onClick={() => setShowSizeGuide(false)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-blush-light">
            <X size={18} />
          </button>
          <h3 className="heading-serif text-xl font-semibold text-charcoal mb-1">সাইজ গাইড</h3>
          <p className="text-xs text-warm-gray mb-4">আপনার সঠিক ব্রা সাইজ জানুন</p>
          <div className="bg-blush-light/40 rounded-2xl p-4 mb-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-charcoal mb-1">📏 ব্যান্ড সাইজ কীভাবে মাপবেন?</p>
              <p className="text-xs text-warm-gray leading-relaxed">বুকের ঠিক নিচে টেপ মেজার দিয়ে শ্বাস ছেড়ে আঁটোভাবে মাপুন।</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-charcoal mb-1">📏 বাস্ট সাইজ কীভাবে মাপবেন?</p>
              <p className="text-xs text-warm-gray leading-relaxed">বুকের সবচেয়ে পূর্ণ অংশের উপর দিয়ে আলগাভাবে মাপুন।</p>
            </div>
          </div>
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs text-warm-gray mb-1 block">Band Size (Inch)</label>
              <input type="number" value={band} onChange={e => setBand(e.target.value)} placeholder="যেমন: 32"
                className="w-full px-4 py-2.5 rounded-xl border border-blush/30 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30" />
            </div>
            <div>
              <label className="text-xs text-warm-gray mb-1 block">Bust Size (Inch)</label>
              <input type="number" value={bust} onChange={e => setBust(e.target.value)} placeholder="যেমন: 36"
                className="w-full px-4 py-2.5 rounded-xl border border-blush/30 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30" />
            </div>
          </div>
          <button onClick={calculate} className="w-full py-3 bg-rose-gold text-white rounded-xl text-sm font-medium hover:bg-deep-rose transition-colors">
            Find My Size
          </button>
          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: celebrate ? 1.05 : 1 }}
              className="mt-4 text-center bg-blush-light/60 rounded-2xl p-4">
              <p className="text-xs text-warm-gray mb-1">Your perfect bra size</p>
              <p className="text-4xl font-bold text-rose-gold">{result}</p>
              <p className="text-sm text-charcoal mt-2">🎉 Congratulations!</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  };
  const handleAddToCart = () => {
    if (!selectedSize) return;
    addItem(product, selectedSize, selectedColor, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-warm-gray mb-8">
          <Link to="/" className="hover:text-rose-gold">Home</Link>
          <ChevronRight size={14} />
          <Link to="/shop" className="hover:text-rose-gold">Shop</Link>
          <ChevronRight size={14} />
          <Link to={`/category/${product.categorySlug}`} className="hover:text-rose-gold">
            {product.category}
          </Link>
          <ChevronRight size={14} />
          <span className="text-charcoal">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-16">

          {/* ── Image Gallery ── */}
          <FadeIn>
            <div>
              {/* Main image */}
              <motion.div
                className="relative rounded-3xl overflow-hidden aspect-[3/4] bg-blush-light/30"
                onTouchStart={e => { (window as any)._touchX = e.targetTouches[0].clientX; }}
                onTouchEnd={e => {
                  const diff = (window as any)._touchX - e.changedTouches[0].clientX;
                  if (Math.abs(diff) > 50) {
                    if (diff > 0) setSelectedImage(i => Math.min(i + 1, product.images.length - 1));
                    else setSelectedImage(i => Math.max(i - 1, 0));
                  }
                }}
              >
                {selectedImage === -1 && product.videoUrl ? (
                  <video
                    src={product.videoUrl}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    loop
                    playsInline
                  />
                ) : product.images[selectedImage]?.startsWith('http') ? (
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-blush via-lavender to-champagne" />
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.isOnSale && <Badge variant="sale">Sale</Badge>}
                  {product.isNewArrival && <Badge variant="new">New</Badge>}
                  {product.isTrending && <Badge variant="trending">Trending</Badge>}
                </div>

                <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors">
                  <Heart size={18} className="text-rose-gold" />
                </button>
                {selectedImage > 0 && (
                  <button onClick={() => setSelectedImage(i => i - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white shadow-md transition-all">
                    <ArrowLeft size={16} className="text-charcoal" />
                  </button>
                )}
                {selectedImage < product.images.length - 1 && (
                  <button onClick={() => setSelectedImage(i => i + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white shadow-md transition-all">
                    <ArrowRight size={16} className="text-charcoal" />
                  </button>
                )}
              </motion.div>

              {/* Thumbnails */}
              {(product.images.length > 1 || product.videoUrl) && (
                <div className="flex gap-3 mt-4 flex-wrap">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-20 h-24 rounded-xl overflow-hidden bg-blush-light/30 transition-all duration-200 flex-shrink-0 ${i === selectedImage
                        ? 'ring-2 ring-rose-gold ring-offset-2'
                        : 'opacity-60 hover:opacity-100'
                        }`}
                    >
                      {img.startsWith('http') ? (
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blush via-lavender to-champagne" />
                      )}
                    </button>
                  ))}

                  {/* Video thumbnail */}
                  {product.videoUrl && (
                    <button
                      onClick={() => setSelectedImage(-1)}
                      className={`w-20 h-24 rounded-xl overflow-hidden bg-blush-light/30 transition-all duration-200 flex-shrink-0 relative ${selectedImage === -1
                        ? 'ring-2 ring-rose-gold ring-offset-2'
                        : 'opacity-60 hover:opacity-100'
                        }`}
                    >
                      <video
                        src={product.videoUrl}
                        className="w-full h-full object-cover pointer-events-none"
                        muted
                        playsInline
                      />
                      {/* Play icon overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                          <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                            <path d="M1 1l10 6-10 6V1z" fill="#B07D6B" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          </FadeIn>

          {/* ── Product Info ── */}
          <FadeIn delay={0.2}>
            <div>
              <p className="text-sm text-rose-gold font-medium mb-1">{product.category}</p>
              <h1 className="heading-serif text-3xl md:text-4xl font-bold text-charcoal mb-3">
                {product.name}
              </h1>
              <div className="mb-6">
                <PriceDisplay price={product.price} comparePrice={product.comparePrice} size="lg" />
              </div>

              <p className="text-warm-gray leading-relaxed mb-6">{product.description}</p>

              <div className="luxury-line mb-6" />

              {/* Color Selection */}
              {/* Color Selection */}
              {product.colors.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-charcoal mb-3">
                    Color: <span className="text-warm-gray font-normal">{selectedColor}</span>
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color: any) => {
                      // Handle all possible shapes from admin panel:
                      // { name, hex } or { name, value } or { name, color } or just a plain string
                      const colorName = typeof color === 'string' ? color : (color.name || color.label || String(color));
                      const colorValue = typeof color === 'string' ? color : (color.hex || color.value || color.color || color.code || '#cccccc');
                      const isSelected = selectedColor === colorName;

                      return (
                        <button
                          key={colorName}
                          onClick={() => setSelectedColor(colorName)}
                          title={colorName}
                          className="relative flex-shrink-0 transition-all duration-200"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            backgroundColor: colorValue,
                            border: isSelected
                              ? '3px solid #B07D6B'
                              : '2px solid rgba(0,0,0,0.12)',
                            transform: isSelected ? 'scale(1.18)' : 'scale(1)',
                            boxShadow: isSelected
                              ? '0 0 0 2px white, 0 0 0 4px #B07D6B'
                              : '0 1px 3px rgba(0,0,0,0.15)',
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Size Selection */}
              {product.sizes.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-charcoal">
                      Size: <span className="text-warm-gray font-normal">{selectedSize}</span>
                    </p>
                    <button onClick={() => setShowSizeGuide(true)} className="text-xs px-3 py-1.5 rounded-lg border border-rose-gold text-rose-gold hover:bg-rose-gold hover:text-white transition-all duration-200">📏 Size Guide</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-14 h-11 rounded-xl text-sm font-medium transition-all ${selectedSize === size
                          ? 'bg-rose-gold text-white shadow-md'
                          : 'bg-blush-light/50 text-warm-gray hover:bg-blush-light'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-8">
                <p className="text-sm font-medium text-charcoal mb-3">Quantity</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-xl bg-blush-light/50 flex items-center justify-center hover:bg-blush-light transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center font-medium text-charcoal">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                    className="w-10 h-10 rounded-xl bg-blush-light/50 flex items-center justify-center hover:bg-blush-light transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                  {product.stock > 0 && product.stock <= 10 && (
                    <span className="text-xs text-orange-600 font-medium ml-2">
                      ⚠ Limited Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Add to Cart */}
              <div className="flex gap-3 mb-8">
                <Button
                  size="lg"
                  fullWidth
                  onClick={() => {
                    if (!selectedSize && product.sizes.length > 0) return;
                    addItem(product, selectedSize, selectedColor, quantity);
                    navigate('/checkout');
                  }}
                  disabled={product.stock === 0}
                >
                  <ShoppingBag size={18} />
                  {product.stock === 0 ? 'Out of Stock' : 'Buy Now'}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className={addedToCart ? '!border-green-500 !text-green-500' : ''}
                >
                  {addedToCart ? '✓ Added' : 'Add to Bag'}
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: '🚚', label: 'Fast Delivery' },
                  { icon: '✅', label: '100% Authentic%' },
                  { icon: '🔒', label: 'Secure Payment' },
                ].map(item => (
                  <div key={item.label} className="flex flex-col items-center gap-1.5 text-center p-3 rounded-xl bg-blush-light/30">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-xs text-warm-gray">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>

        {/* ── Tabs ── */}
        <div className="mt-16">
          <div className="flex gap-6 border-b border-blush/20 mb-6">
            {(['description', 'shipping'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize transition-colors ${activeTab === tab
                  ? 'text-rose-gold border-b-2 border-rose-gold'
                  : 'text-warm-gray hover:text-charcoal'
                  }`}
              >
                {tab === 'description' ? 'Description' : tab === 'shipping' ? 'Shipping Info' : ''}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {activeTab === 'description' && (
                <div className="prose max-w-none text-warm-gray">
                  <p className="leading-relaxed">{product.description}</p>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <strong className="text-charcoal">Material:</strong>{' '}
                      Premium {product.tags[0] || 'fabric'}
                    </div>
                    <div>
                      <strong className="text-charcoal">Care:</strong> Dry clean recommended
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'shipping' && (
                <div className="space-y-4 text-warm-gray">
                  <div className="glass-card rounded-2xl p-5">
                    <h4 className="font-medium text-charcoal mb-2">Shipping Information</h4>
                    <p className="mt-2">Inside Dhaka City  delivery: Max 48 Hour </p>
                    <p className="mt-2">Out Size Dhaka City  delivery: Max 86 Hour </p>
                  </div>
                  <div className="glass-card rounded-2xl p-5">
                    <h4 className="font-medium text-charcoal mb-2">Returns & Exchanges</h4>
                    <p>We accept Exchanges within 3 days of delivery. Items must be Intacked and unworn.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="heading-serif text-2xl md:text-3xl font-bold text-charcoal">
                You May Also Like
              </h2>
              <div className="flex gap-2">
                <button onClick={() => setSimilarPage(p => Math.max(0, p - 1))}
                  disabled={similarPage === 0}
                  className="w-9 h-9 rounded-full border border-blush/40 flex items-center justify-center disabled:opacity-30 hover:border-rose-gold transition-colors">
                  <ArrowLeft size={16} />
                </button>
                <button onClick={() => setSimilarPage(p => Math.min(Math.ceil(related.length / 4) - 1, p + 1))}
                  disabled={similarPage >= Math.ceil(related.length / 4) - 1}
                  className="w-9 h-9 rounded-full border border-blush/40 flex items-center justify-center disabled:opacity-30 hover:border-rose-gold transition-colors">
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.slice(similarPage * 4, similarPage * 4 + 4).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};