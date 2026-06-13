/* ===================================================
   Girley Glow - Product Detail Page
   FIXED:
   1. Thumbnails in a single horizontal scrollable row
      with left/right arrow navigation buttons.
   2. Color circles now correctly render ALL CSS color
      names (blue, red, purple, etc.) AND hex values.
   3. Description/Shipping tab section removed.
   4. COLOR_NAME_MAP expanded to match AdminProducts
      SIMPLE_COLORS — every admin-saved name resolves.
   5. Canvas fallback uses #010101 sentinel (not #ffffff)
      so near-white colors like Baby Pink never fail.
   =================================================== */
declare global { interface Window { dataLayer: any[]; } }
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Heart, ArrowLeft, ArrowRight,
  Minus, Plus, ChevronRight,
} from 'lucide-react';
import { Button, Badge, PriceDisplay, FadeIn } from '@/components/ui';
import { ProductCard } from '@/components/home';
import { supabase } from '@/lib/supabase';
import { useCartStore, useRecentlyViewedStore } from '@/store';
import type { Product } from '@/types';
import { trackViewContent } from '../lib/facebookPixel';

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
  customText: p.custom_text || '',
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

/* ─────────────────────────────────────────────────────────────
   resolveColor
   Uses the same color-name-list library that AdminProducts uses,
   so any name the admin saves (Rio Red, Dusty Rose, etc.) always
   resolves correctly on the product detail page.
   3-step: hex passthrough → color-name-list lookup → canvas CSS
   ───────────────────────────────────────────────────────────── */
import { colornames as _colorNameList } from 'color-name-list';
import nearestColor from 'nearest-color';

// Build lookup maps once at module load
const _nameToHex: Record<string, string> = {};
const _nearestMap: Record<string, string> = {};
_colorNameList.forEach((c: { name: string; hex: string }) => {
  _nameToHex[c.name.toLowerCase()] = c.hex;
  _nearestMap[c.name] = c.hex;
});
const _getNearestColor = nearestColor.from(_nearestMap);

// Inline SIMPLE_COLORS for exact fast matches (same as AdminProducts)
const _SIMPLE: Record<string, string> = {
  'white': '#FFFFFF', 'off white': '#FAF9F6', 'cream': '#FFFDD0',
  'ivory': '#FFFFF0', 'black': '#000000', 'charcoal': '#36454F',
  'dark grey': '#A9A9A9', 'grey': '#808080', 'light grey': '#D3D3D3',
  'gray': '#808080', 'dark gray': '#A9A9A9', 'light gray': '#D3D3D3',
  'red': '#FF0000', 'dark red': '#8B0000', 'maroon': '#800000',
  'crimson': '#DC143C', 'pink': '#FFC0CB', 'hot pink': '#FF69B4',
  'baby pink': '#F4C2C2', 'rose': '#FF007F', 'blush': '#FFB6C1',
  'magenta': '#FF00FF', 'purple': '#800080', 'violet': '#EE82EE',
  'lavender': '#E6E6FA', 'navy': '#000080', 'blue': '#0000FF',
  'sky blue': '#87CEEB', 'baby blue': '#89CFF0', 'royal blue': '#4169E1',
  'teal': '#008080', 'cyan': '#00FFFF', 'turquoise': '#40E0D0',
  'green': '#008000', 'dark green': '#006400', 'light green': '#90EE90',
  'mint': '#98FF98', 'olive': '#808000', 'yellow': '#FFFF00',
  'light yellow': '#FFFFE0', 'gold': '#FFD700', 'orange': '#FFA500',
  'peach': '#FFDAB9', 'coral': '#FF6B6B', 'salmon': '#FA8072',
  'brown': '#8B4513', 'dark brown': '#5C4033', 'light brown': '#C4A882',
  'tan': '#D2B48C', 'beige': '#F5F5DC', 'skin': '#FED9B0',
  'nude': '#E8C9A0', 'camel': '#C19A6B', 'rose gold': '#B76E79',
  'copper': '#B87333', 'silver': '#C0C0C0', 'wine': '#722F37',
  'burgundy': '#800020', 'mustard': '#FFDB58', 'khaki': '#F0E68C',
  'lemon': '#FFF44F', 'indigo': '#4B0082', 'mauve': '#E0B0FF',
  'multicolor': 'linear-gradient(135deg,#FF6B6B,#FFD700,#6BCB77,#4D96FF,#C77DFF)',
  'multi': 'linear-gradient(135deg,#FF6B6B,#FFD700,#6BCB77,#4D96FF,#C77DFF)',
  'rainbow': 'linear-gradient(135deg,red,orange,yellow,green,blue,violet)',
};

const resolveColor = (() => {
  const cache: Record<string, string> = {};

  const normaliseHex = (h: string): string => {
    const c = h.trim().toLowerCase().replace(/^#/, '');
    if (/^[0-9a-f]{6}$/.test(c)) return '#' + c;
    if (/^[0-9a-f]{3}$/.test(c)) return '#' + c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    return '';
  };

  return (raw: string): string => {
    if (!raw) return '#cccccc';
    const trimmed = raw.trim();
    const key = trimmed.toLowerCase();
    if (cache[key]) return cache[key];

    // Step 1: hex passthrough
    const hex = normaliseHex(trimmed);
    if (hex) { cache[key] = hex; return hex; }

    // Step 2: gradient passthrough
    if (trimmed.startsWith('linear-gradient')) { cache[key] = trimmed; return trimmed; }

    // Step 3: simple map (fast exact match)
    if (_SIMPLE[key]) { cache[key] = _SIMPLE[key]; return _SIMPLE[key]; }

    // Step 4: color-name-list exact match (covers Rio Red, Dusty Rose, etc.)
    if (_nameToHex[key]) { cache[key] = _nameToHex[key]; return _nameToHex[key]; }

    // Step 5: nearest match from color-name-list (typos, slight variations)
    try {
      const result = _getNearestColor(key) as any;
      if (result?.value) { cache[key] = result.value; return result.value; }
    } catch { /* not a valid color string, skip */ }

    // Step 6: canvas CSS parse (catches standard CSS color names)
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1; canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no ctx');
      ctx.fillStyle = '#010101';
      ctx.fillStyle = key;
      const parsed = ctx.fillStyle;
      if (parsed !== '#010101' && parsed !== '') {
        // canvas may return rgb() format
        const rgb = parsed.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        const result = rgb
          ? '#' + [rgb[1], rgb[2], rgb[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('')
          : parsed;
        cache[key] = result;
        return result;
      }
    } catch { /* ignore */ }

    cache[key] = '#cccccc';
    return '#cccccc';
  };
})();


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
  const [addedToCart, setAddedToCart] = useState(false);
  const [similarPage, setSimilarPage] = useState(0);

  /* ── ref for the thumbnail scroll container ── */
  const thumbsRef = useRef<HTMLDivElement>(null);

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

      /* GTM DATA LAYER — view_item */
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ ecommerce: null });
      window.dataLayer.push({
        event: 'view_item',
        ecommerce: {
          currency: 'BDT',
          value: normalised.price,
          items: [{
            item_id: normalised.id,
            item_name: normalised.name,
            item_category: normalised.category,
            price: normalised.price,
            quantity: 1,
          }],
        },
      });

      setSelectedSize(normalised.sizes[0] || '');

      const firstColor = normalised.colors[0];
      setSelectedColor(
        typeof firstColor === 'string'
          ? firstColor
          : firstColor?.name || firstColor?.label || ''
      );
      addRecentlyViewed(normalised.id);

      /* ── Fetch related products ── */
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

  /* ── Scroll the thumbnail strip to keep the active thumb visible ── */
  useEffect(() => {
    if (!thumbsRef.current) return;
    const strip = thumbsRef.current;
    const activeThumb = strip.children[
      selectedImage === -1 ? strip.children.length - 1 : selectedImage
    ] as HTMLElement;
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedImage]);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-[#6B5B55]">Loading product...</p>
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

  /* ── Total thumbnail count (images + optional video) ── */
  const totalThumbs = product.images.length + (product.videoUrl ? 1 : 0);
  /* selectedImage uses -1 for video; map to strip index */
  const activeStripIndex = selectedImage === -1 ? product.images.length : selectedImage;

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addItem(product, selectedSize, selectedColor, quantity);

    /* GTM DATA LAYER — add_to_cart */
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: 'add_to_cart',
      ecommerce: {
        currency: 'BDT',
        value: product.price * quantity,
        items: [{
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          price: product.price,
          quantity: quantity,
        }],
      },
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-[#6B5B55] mb-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-10">

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

                <button className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors">
                  <Heart size={18} className="text-rose-gold" />
                </button>
                {selectedImage > 0 && (
                  <button
                    onClick={() => setSelectedImage(i => i - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white shadow-md transition-all"
                  >
                    <ArrowLeft size={16} className="text-charcoal" />
                  </button>
                )}
                {selectedImage < product.images.length - 1 && (
                  <button
                    onClick={() => setSelectedImage(i => i + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white shadow-md transition-all"
                  >
                    <ArrowRight size={16} className="text-charcoal" />
                  </button>
                )}
              </motion.div>

              {/* ── Thumbnails — single horizontal row with arrow buttons ── */}
              {totalThumbs > 1 && (
                <div className="flex items-center gap-2 mt-4">

                  {/* Left arrow */}
                  <button
                    onClick={() => setSelectedImage(i => {
                      const prev = i === -1 ? product.images.length - 1 : Math.max(0, i - 1);
                      return prev;
                    })}
                    disabled={activeStripIndex === 0}
                    className="flex-shrink-0 w-8 h-8 rounded-full border border-blush/40 flex items-center justify-center disabled:opacity-30 hover:border-rose-gold transition-colors bg-white/70"
                  >
                    <ArrowLeft size={14} />
                  </button>

                  {/* Scrollable strip — no scrollbar visible */}
                  <div
                    ref={thumbsRef}
                    className="flex gap-2 overflow-x-auto flex-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {/* Image thumbnails */}
                    {product.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className={`flex-shrink-0 w-[72px] h-[86px] rounded-xl overflow-hidden bg-blush-light/30 transition-all duration-200 ${i === selectedImage
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
                        className={`flex-shrink-0 w-[72px] h-[86px] rounded-xl overflow-hidden bg-blush-light/30 transition-all duration-200 relative ${selectedImage === -1
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

                  {/* Right arrow */}
                  <button
                    onClick={() => setSelectedImage(i => {
                      if (product.videoUrl && i === product.images.length - 1) return -1;
                      return Math.min(product.images.length - 1, i + 1);
                    })}
                    disabled={activeStripIndex === totalThumbs - 1}
                    className="flex-shrink-0 w-8 h-8 rounded-full border border-blush/40 flex items-center justify-center disabled:opacity-30 hover:border-rose-gold transition-colors bg-white/70"
                  >
                    <ArrowRight size={14} />
                  </button>

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
              <div className="mb-4">
                <PriceDisplay price={product.price} comparePrice={product.comparePrice} size="lg" />
              </div>

              <p className="text-[#6B5B55] leading-relaxed mb-0">{product.description}</p>

              <div className="luxury-line mb-3" />

              {/* ── Color Selection ── */}
              {product.colors.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-charcoal mb-3">
                    Color: <span className="text-[#6B5B55] font-normal">{selectedColor}</span>
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color: any) => {
                      /*
                       * Support all shapes the admin might save:
                       * plain string, { name, hex }, { name, value },
                       * { name, color }, { name, code }, { label, hex }, etc.
                       */
                      const colorName =
                        typeof color === 'string'
                          ? color
                          : color.name || color.label || String(color);

                      const rawValue =
                        typeof color === 'string'
                          ? color
                          : color.hex || color.value || color.color || color.code || color.name || color.label || '';

                      const resolvedBg = resolveColor(rawValue.trim());

                      const isSelected = selectedColor === colorName;

                      // Detect gradient values so we apply background correctly
                      const isGradient = resolvedBg.startsWith('linear-gradient');

                      return (
                        <button
                          key={colorName}
                          onClick={() => setSelectedColor(colorName)}
                          title={colorName}
                          className="relative flex-shrink-0 transition-all duration-200"
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            ...(isGradient
                              ? { background: resolvedBg }
                              : { backgroundColor: resolvedBg }
                            ),
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

              {/* ── Size Selection ── */}
              {product.sizes.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-charcoal">
                      Size: <span className="text-[#6B5B55] font-normal">{selectedSize}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map(size => (
                      <button
                        key={String(size)}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[70px] h-9 px-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${selectedSize === size
                          ? 'bg-rose-gold text-white shadow-md'
                          : 'bg-blush-light/50 text-[#6B5B55] hover:bg-blush-light'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Custom Product Info Box ── */}
              {product.customText && (
                <div className="mb-4 rounded-2xl border border-blush/20 bg-blush-light/20 p-4">
                  <div className="text-sm leading-relaxed text-charcoal whitespace-pre-line">
                    {product.customText}
                  </div>
                </div>
              )}

              {/* ── Quantity ── */}
              <div className="mb-4">
                <p className="text-sm font-medium text-charcoal mb-3">Quantity</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 rounded-xl bg-blush-light/50 flex items-center justify-center hover:bg-blush-light transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center font-medium text-charcoal">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                    className="w-9 h-9 rounded-xl bg-blush-light/50 flex items-center justify-center hover:bg-blush-light transition-colors"
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

              {/* ── Add to Cart / Buy Now ── */}
              <div className="flex gap-2 mb-6">
                {/* BUY NOW */}
                <Button
                  size="lg"
                  onClick={() => {
                    if (!selectedSize && product.sizes.length > 0) return;
                    addItem(product, selectedSize, selectedColor, quantity);
                    navigate('/checkout');
                  }}
                  disabled={product.stock === 0}
                  className="flex-[3] h-12 text-base font-semibold rounded-xl border-0"
                  style={{
                    background: 'linear-gradient(135deg, #1eff77 0%, #1eff77 100%)',
                    color: 'Black',
                  }}
                >
                  <ShoppingBag size={17} />
                  {product.stock === 0 ? 'Out of Stock' : 'Buy Now'}
                </Button>

                {/* ADD TO BAG */}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className={`flex-1 h-12 text-sm rounded-xl ${addedToCart ? '!border-green-500 !text-green-500' : ''
                    }`}
                >
                  {addedToCart ? '✓ Added' : 'Add to Bag'}
                </Button>
              </div>

              {/* ── Trust Badges ── */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: '🚚', label: 'Fast Delivery' },
                  { icon: '✅', label: '100% Authentic' },
                  { icon: '🔒', label: 'Secure Payment' },
                ].map(item => (
                  <div
                    key={item.label}
                    className="flex flex-col items-center gap-1.5 text-center p-3 rounded-xl bg-blush-light/30"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-xs text-[#6B5B55]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>

        {/* ── Related Products ── */}
        {related.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="heading-serif text-2xl md:text-3xl font-bold text-charcoal">
                You May Also Like
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSimilarPage(p => Math.max(0, p - 1))}
                  disabled={similarPage === 0}
                  className="w-9 h-9 rounded-full border border-blush/40 flex items-center justify-center disabled:opacity-30 hover:border-rose-gold transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  onClick={() => setSimilarPage(p => Math.min(Math.ceil(related.length / 4) - 1, p + 1))}
                  disabled={similarPage >= Math.ceil(related.length / 4) - 1}
                  className="w-9 h-9 rounded-full border border-blush/40 flex items-center justify-center disabled:opacity-30 hover:border-rose-gold transition-colors"
                >
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