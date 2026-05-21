/* ===================================================
   AUTHENTIC GIRLSWEAR - Product Detail Page
   FIXED: Fetches product from Supabase by slug,
   so admin-uploaded products display correctly.
   =================================================== */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Heart, Truck, RotateCcw, Shield,
  Minus, Plus, ChevronRight,
} from 'lucide-react';
import { Button, Badge, PriceDisplay, StarRating, FadeIn } from '@/components/ui';
import { ProductCard } from '@/components/home';
import { reviews as allReviews } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import { useCartStore, useRecentlyViewedStore } from '@/store';
import type { Product } from '@/types';

/* ─── normalise snake_case Supabase row → Product shape ─── */
const normalise = (p: any): Product => ({
  id:               p.id,
  name:             p.name             || '',
  slug:             p.slug             || '',
  description:      p.description      || '',
  shortDescription: p.short_description || '',
  price:            Number(p.price)    || 0,
  comparePrice:     p.compare_price    ? Number(p.compare_price) : undefined,
  images:           p.images           || [],
  category:         p.category_name   || p.category      || '',
  categorySlug:     p.category_slug   || '',
  sizes:            p.sizes            || [],
  colors:           p.colors           || [],
  stock:            Number(p.stock)    || 0,
  sku:              p.sku              || '',
  tags:             p.tags             || [],
  isFeatured:       p.is_featured      || false,
  isTrending:       p.is_trending      || false,
  isNewArrival:     p.is_new_arrival   || false,
  isOnSale:         p.is_on_sale       || false,
  rating:           Number(p.rating)   || 0,
  reviewCount:      Number(p.review_count) || 0,
  createdAt:        p.created_at       || '',
  videoUrl:         p.video_url        || '',
  updatedAt:        p.updated_at       || '',
});

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate  = useNavigate();
  const addItem   = useCartStore(s => s.addItem);
  const addRecentlyViewed = useRecentlyViewedStore(s => s.addProduct);

  const [product, setProduct]       = useState<Product | null>(null);
  const [related, setRelated]       = useState<Product[]>([]);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize]   = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity]           = useState(1);
  const [activeTab, setActiveTab]         = useState<'description' | 'reviews' | 'shipping'>('description');
  const [addedToCart, setAddedToCart]     = useState(false);

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
      setSelectedSize(normalised.sizes[0]  || '');
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

  /* ── Reviews — still from mockData (no reviews table yet) ── */
  const productReviews = useMemo(
    () => (product ? allReviews.filter(r => r.productId === product.id) : []),
    [product],
  );

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">

          {/* ── Image Gallery ── */}
          <FadeIn>
            <div>
              {/* Main image */}
              <motion.div
                className="relative rounded-3xl overflow-hidden aspect-[3/4] bg-blush-light/30"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
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
                  {product.isOnSale    && <Badge variant="sale">Sale</Badge>}
                  {product.isNewArrival && <Badge variant="new">New</Badge>}
                  {product.isTrending  && <Badge variant="trending">Trending</Badge>}
                </div>

                <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors">
                  <Heart size={18} className="text-rose-gold" />
                </button>
              </motion.div>

              {/* Thumbnails */}
              {(product.images.length > 1 || product.videoUrl) && (
                <div className="flex gap-3 mt-4 flex-wrap">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-20 h-24 rounded-xl overflow-hidden bg-blush-light/30 transition-all duration-200 flex-shrink-0 ${
                        i === selectedImage
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
                      className={`w-20 h-24 rounded-xl overflow-hidden bg-blush-light/30 transition-all duration-200 flex-shrink-0 relative ${
                        selectedImage === -1
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
                            <path d="M1 1l10 6-10 6V1z" fill="#B07D6B"/>
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

              <div className="flex items-center gap-3 mb-4">
                <StarRating rating={product.rating} />
                <span className="text-sm text-warm-gray">({product.reviewCount} reviews)</span>
              </div>

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
        const colorName  = typeof color === 'string' ? color : (color.name  || color.label || String(color));
        const colorValue = typeof color === 'string' ? color : (color.hex   || color.value || color.color || color.code || '#cccccc');
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
                    <button className="text-xs text-rose-gold hover:underline">Size Guide</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-14 h-11 rounded-xl text-sm font-medium transition-all ${
                          selectedSize === size
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
                  <span className="text-sm text-warm-gray ml-2">
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="flex gap-3 mb-8">
                <Button
                  size="lg"
                  fullWidth
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className={addedToCart ? '!bg-green-500' : ''}
                >
                  {addedToCart ? '✓ Added to Bag' : (
                    <>
                      <ShoppingBag size={18} />
                      {product.stock === 0 ? 'Out of Stock' : 'Add to Bag'}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() =>
                    navigate('/checkout', {
                      state: {
                        product,
                        size:     selectedSize,
                        color:    selectedColor,
                        quantity,
                      },
                    })
                  }
                >
                  Buy Now
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <Truck size={18} />,     label: 'Free Shipping' },
                  { icon: <RotateCcw size={18} />, label: 'Easy Returns'  },
                  { icon: <Shield size={18} />,    label: 'Secure Payment' },
                ].map(item => (
                  <div
                    key={item.label}
                    className="flex flex-col items-center gap-1.5 text-center p-3 rounded-xl bg-blush-light/30"
                  >
                    <span className="text-rose-gold">{item.icon}</span>
                    <span className="text-xs text-warm-gray">{item.label}</span>
                  </div>
                ))}
              </div>

              {product.sku && (
                <p className="text-xs text-warm-gray mt-4">SKU: {product.sku}</p>
              )}
            </div>
          </FadeIn>
        </div>

        {/* ── Tabs ── */}
        <div className="mt-16">
          <div className="flex gap-6 border-b border-blush/20 mb-6">
            {(['description', 'reviews', 'shipping'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-rose-gold border-b-2 border-rose-gold'
                    : 'text-warm-gray hover:text-charcoal'
                }`}
              >
                {tab} {tab === 'reviews' && `(${productReviews.length})`}
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

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {productReviews.length === 0 ? (
                    <p className="text-warm-gray text-center py-8">
                      No reviews yet. Be the first to review!
                    </p>
                  ) : (
                    productReviews.map(review => (
                      <div key={review.id} className="glass-card rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-rose-gold/20 flex items-center justify-center">
                              <span className="text-sm font-medium text-rose-gold">
                                {review.customerName.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium text-charcoal">{review.customerName}</span>
                          </div>
                          <span className="text-xs text-warm-gray">{review.createdAt}</span>
                        </div>
                        <StarRating rating={review.rating} size={14} />
                        <p className="mt-2 text-warm-gray text-sm">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'shipping' && (
                <div className="space-y-4 text-warm-gray">
                  <div className="glass-card rounded-2xl p-5">
                    <h4 className="font-medium text-charcoal mb-2">Shipping Information</h4>
                    <p>Free standard shipping on orders over $150. Express shipping available at checkout.</p>
                    <p className="mt-2">Standard delivery: 3-5 business days</p>
                    <p>Express delivery: 1-2 business days</p>
                  </div>
                  <div className="glass-card rounded-2xl p-5">
                    <h4 className="font-medium text-charcoal mb-2">Returns & Exchanges</h4>
                    <p>We accept returns within 14 days of delivery. Items must be unworn with tags attached.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="heading-serif text-2xl md:text-3xl font-bold text-charcoal mb-6">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};