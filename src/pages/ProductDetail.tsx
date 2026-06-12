/* ===================================================
   AUTHENTIC GIRLSWEAR - Product Detail Page
   FIXED:
   1. Thumbnails in a single horizontal scrollable row
      with left/right arrow navigation buttons.
   2. Color circles now correctly render ALL CSS color
      names (blue, red, purple, etc.) AND hex values.
   =================================================== */
declare global { interface Window { dataLayer: any[]; } }
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

/* ─── Resolve any color name/value → valid CSS color ─── */
/**
 * 3-step resolution:
 * 1. Direct hex → use as-is
 * 2. Custom name lookup table → covers admin-typed names like "Baby Pink", "Sky Blue" etc.
 * 3. Canvas browser-parse → catches all standard CSS named colors (blue, red, purple…)
 * Falls back to #cccccc only if none of the above work.
 */
const COLOR_NAME_MAP: Record<string, string> = {
  // ── Reds & Pinks ──
  'red': '#E53E3E', 'dark red': '#9B2335', 'crimson': '#DC143C',
  'maroon': '#800000', 'burgundy': '#722F37', 'wine': '#722F37',
  'pink': '#FFC0CB', 'hot pink': '#FF69B4', 'baby pink': '#F4C2C2',
  'light pink': '#FFB6C1', 'magenta': '#FF00FF', 'blush': '#FADADD',
  'rose': '#FF007F', 'rose gold': '#B76E79', 'dusty rose': '#DCAE96',
  'blush pink': '#FEC5BB', 'deep pink': '#FF1493', 'flamingo': '#FC8EAC',
  'coral': '#FF6B6B', 'salmon': '#FA8072', 'peach': '#FFCBA4',
  'shocking pink': '#FC0FC0', 'mauve': '#E0B0FF',
  // ── Oranges ──
  'orange': '#ED8936', 'dark orange': '#FF8C00', 'light orange': '#FFB347',
  'amber': '#FFBF00', 'burnt orange': '#CC5500', 'tangerine': '#F28500',
  'rust': '#B7410E', 'terracotta': '#E2725B',
  // ── Yellows ──
  'yellow': '#F6E05E', 'light yellow': '#FFFFE0', 'gold': '#FFD700',
  'golden': '#FFD700', 'dark yellow': '#C9A800', 'mustard': '#FFDB58',
  'mustard yellow': '#FFDB58', 'lemon': '#FFF44F', 'cream': '#FFFDD0',
  'ivory': '#FFFFF0', 'champagne': '#F7E7CE', 'vanilla': '#F3E5AB',
  'butter': '#FFFAA0',
  // ── Greens ──
  'green': '#38A169', 'dark green': '#006400', 'light green': '#90EE90',
  'lime green': '#32CD32', 'mint green': '#98FF98', 'mint': '#98FF98',
  'sage': '#BCB88A', 'olive': '#808000', 'olive green': '#6B8E23',
  'forest green': '#228B22', 'emerald': '#50C878', 'teal': '#008080',
  'turquoise': '#40E0D0', 'seafoam': '#93E9BE', 'lime': '#00FF00',
  'moss': '#8A9A5B', 'hunter green': '#355E3B', 'jade': '#00A86B',
  'bottle green': '#006A4E', 'army green': '#4B5320',
  // ── Blues ──
  'blue': '#3182CE', 'dark blue': '#00008B', 'light blue': '#ADD8E6',
  'sky blue': '#87CEEB', 'baby blue': '#89CFF0', 'navy': '#001F5B',
  'navy blue': '#001F5B', 'royal blue': '#4169E1', 'cobalt': '#0047AB',
  'powder blue': '#B0E0E6', 'steel blue': '#4682B4', 'denim': '#1560BD',
  'cerulean': '#007BA7', 'aqua': '#00FFFF', 'cyan': '#00BCD4',
  'electric blue': '#7DF9FF', 'indigo': '#4B0082', 'periwinkle': '#CCCCFF',
  'slate blue': '#6A5ACD', 'cadet blue': '#5F9EA0',
  // ── Purples & Violets ──
  'purple': '#805AD5', 'light purple': '#DA70D6', 'dark purple': '#4B0082',
  'violet': '#8F00FF', 'lavender': '#E6E6FA', 'lilac': '#C8A2C8',
  'plum': '#8E4585', 'fuchsia': '#FF00FF', 'orchid': '#DA70D6',
  'wisteria': '#C9A0DC', 'grape': '#6F2DA8', 'eggplant': '#614051',
  'amethyst': '#9966CC',
  // ── Browns & Neutrals ──
  'brown': '#A0522D', 'dark brown': '#654321', 'light brown': '#C4A882',
  'tan': '#D2B48C', 'beige': '#F5F5DC', 'khaki': '#C3B091',
  'camel': '#C19A6B', 'sand': '#C2B280', 'taupe': '#483C32',
  'mocha': '#967259', 'coffee': '#6F4E37', 'chocolate': '#7B3F00',
  'chestnut': '#954535', 'walnut': '#773F1A', 'nude': '#E3BC9A',
  'skin': '#FED9B0', 'bronze': '#CD7F32', 'copper': '#B87333',
  // ── Whites & Greys ──
  'white': '#FFFFFF', 'off white': '#FAF9F6', 'off-white': '#FAF9F6',
  'snow': '#FFFAFA', 'pearl': '#F0EAD6', 'linen': '#FAF0E6',
  'grey': '#808080', 'gray': '#808080', 'light grey': '#D3D3D3',
  'light gray': '#D3D3D3', 'dark grey': '#404040', 'dark gray': '#404040',
  'charcoal': '#36454F', 'silver': '#C0C0C0', 'ash': '#B2BEB5',
  'slate': '#708090', 'smoke': '#738276',
  // ── Blacks ──
  'black': '#000000', 'jet black': '#343434', 'off black': '#0F0F0F',
  'onyx': '#353839',
  // ── Multicolor / Special ──
  'multicolor': 'linear-gradient(135deg,#FF6B6B,#FFD700,#6BCB77,#4D96FF,#C77DFF)',
  'multi': 'linear-gradient(135deg,#FF6B6B,#FFD700,#6BCB77,#4D96FF,#C77DFF)',
  'rainbow': 'linear-gradient(135deg,red,orange,yellow,green,blue,violet)',
  'tie dye': 'linear-gradient(135deg,#FF6B6B,#FFD700,#6BCB77,#4D96FF)',
  'printed': 'linear-gradient(135deg,#f8cdda,#1d2b64)',
  'floral': 'linear-gradient(135deg,#ff9a9e,#fecfef)',
};

const resolveColor = (() => {
  const cache: Record<string, string> = {};
  return (raw: string): string => {
    if (!raw) return '#cccccc';
    const key = raw.trim().toLowerCase();
    if (cache[key]) return cache[key];

    // Step 1: direct hex value — trust it immediately
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw.trim())) {
      cache[key] = raw.trim();
      return raw.trim();
    }

    // Step 2: lookup table — handles admin-typed descriptive names
    if (COLOR_NAME_MAP[key]) {
      cache[key] = COLOR_NAME_MAP[key];
      return COLOR_NAME_MAP[key];
    }

    // Step 3: canvas browser-parse — handles all standard CSS color names
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1; canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no ctx');
      ctx.fillStyle = '#123456';
      ctx.fillStyle = key;
      const parsed = ctx.fillStyle;
      const result = parsed !== '#123456' ? parsed : (COLOR_NAME_MAP[key] || '#cccccc');
      cache[key] = result;
      return result;
    } catch {
      cache[key] = '#cccccc';
      return '#cccccc';
    }
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

  /* ── FIX 1: ref for the thumbnail scroll container ── */
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

  /* ── FIX 1: scroll the thumbnail strip to keep the active thumb visible ── */
  useEffect(() => {
    if (!thumbsRef.current) return;
    const strip = thumbsRef.current;
    const activeThumb = strip.children[selectedImage === -1 ? strip.children.length - 1 : selectedImage] as HTMLElement;
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

              {/* ── FIX 1: Thumbnails — single horizontal row with arrow buttons ── */}
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

              {/* ── FIX 2: Color Selection — resolves ALL CSS color names & hex values ── */}
              {product.colors.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-charcoal mb-3">
                    Color: <span className="text-[#6B5B55] font-normal">{selectedColor}</span>
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color: any) => {
                      // Support all shapes: plain string, { name, hex }, { name, value },
                      // { name, color }, { name, code }, { label, hex }, etc.
                      const colorName =
                        typeof color === 'string'
                          ? color
                          : color.name || color.label || String(color);

                      const rawValue =
                        typeof color === 'string'
                          ? color
                          : color.hex || color.value || color.color || color.code || color.name || color.label || '';

                      // resolveColor uses a canvas to validate & normalise any CSS color string
                      const resolvedBg = resolveColor(rawValue.trim());

                      const isSelected = selectedColor === colorName;

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
                            backgroundColor: resolvedBg,
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

              {/* Quantity */}
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

              {/* Add to Cart */}
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

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: '🚚', label: 'Fast Delivery' },
                  { icon: '✅', label: '100% Authentic' },
                  { icon: '🔒', label: 'Secure Payment' },
                ].map(item => (
                  <div key={item.label} className="flex flex-col items-center gap-1.5 text-center p-3 rounded-xl bg-blush-light/30">
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