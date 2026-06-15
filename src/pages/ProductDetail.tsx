declare global {
  interface Window {
    dataLayer: any[];
  }
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Heart, ArrowLeft, ArrowRight,
  Minus, Plus, ChevronRight, Star, AlertCircle,
} from 'lucide-react';
import { Button, Badge, PriceDisplay, FadeIn } from '@/components/ui';
import { ProductCard } from '@/components/home';
import { supabase } from '@/lib/supabase';
import { useCartStore, useRecentlyViewedStore } from '@/store';
import type { Product } from '@/types';
import { trackViewContent } from '../lib/facebookPixel';
import { siteConfig, SITE } from '@/config/siteConfig';
import { BRAND } from '@/config/brandingConfig';

// ─── Color libraries — lazy loaded to avoid blocking main bundle ─────────────
// These are resolved asynchronously the first time a color needs to be looked up.
// On first call they import the heavy libs; subsequent calls use the module cache.

let _colorLibLoaded = false;
let _nameToHex: Record<string, string> = {};
let _getNearestColor: ((name: string) => { value: string } | null) | null = null;

async function loadColorLibs() {
  if (_colorLibLoaded) return;
  const [{ colornames }, nearestColorMod] = await Promise.all([
    import('color-name-list'),
    import('nearest-color'),
  ]);
  const nearestColor = nearestColorMod.default ?? nearestColorMod;
  const nearestMap: Record<string, string> = {};
  colornames.forEach((c: { name: string; hex: string }) => {
    _nameToHex[c.name.toLowerCase()] = c.hex;
    nearestMap[c.name] = c.hex;
  });
  _getNearestColor = nearestColor.from(nearestMap);
  _colorLibLoaded = true;
}

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
    const hex = normaliseHex(trimmed);
    if (hex) { cache[key] = hex; return hex; }
    if (trimmed.startsWith('linear-gradient')) { cache[key] = trimmed; return trimmed; }
    if (_SIMPLE[key]) { cache[key] = _SIMPLE[key]; return _SIMPLE[key]; }
    // Use color-name-list if already loaded (loaded async on mount)
    if (_nameToHex[key]) { cache[key] = _nameToHex[key]; return _nameToHex[key]; }
    if (_getNearestColor) {
      try {
        const result = _getNearestColor(key) as any;
        if (result?.value) { cache[key] = result.value; return result.value; }
      } catch { /* skip */ }
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1; canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no ctx');
      ctx.fillStyle = '#010101';
      ctx.fillStyle = key;
      const parsed = ctx.fillStyle;
      if (parsed !== '#010101' && parsed !== '') {
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Injects Cloudinary transformations into a delivery URL. */
const getOptimizedImageUrl = (url: string, width = 800, quality = 85): string => {
  if (!url || !url.includes('cloudinary.com')) return url;
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;
  return `${parts[0]}/upload/w_${width},q_${quality},f_auto,dpr_auto/${parts[1]}`;
};

/** Rich alt text including selected variant and image index for SEO. */
const getImageAlt = (
  productName: string,
  selectedColor: string,
  selectedSize: string,
  index: number,
): string => {
  const colorText = selectedColor ? ` in ${selectedColor}` : '';
  const sizeText = selectedSize ? ` size ${selectedSize}` : '';
  return `${productName}${colorText}${sizeText} — photo ${index + 1} | ${BRAND.fullName}`;
};

/** Derives stock status and urgency messaging. */
const getStockInfo = (stock: number) => {
  if (stock === 0) return { status: 'out-of-stock', message: 'Out of Stock', urgent: false, color: 'red' };
  if (stock <= 5) return { status: 'low-stock', message: `Only ${stock} left in stock!`, urgent: true, color: 'orange' };
  if (stock <= 10) return { status: 'limited-stock', message: `Limited stock: ${stock} available`, urgent: true, color: 'orange' };
  return { status: 'in-stock', message: 'In Stock', urgent: false, color: 'green' };
};

/** Normalises a Supabase snake_case row to our Product domain shape. */
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

// ─── Component ────────────────────────────────────────────────────────────────

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const addRecentlyViewed = useRecentlyViewedStore((s) => s.addProduct);

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
  const [showStickyCart, setShowStickyCart] = useState(false);

  const thumbsRef = useRef<HTMLDivElement>(null);

  // ── Preload color libs asynchronously after mount (non-blocking) ───────────
  useEffect(() => {
    loadColorLibs().catch(() => {/* color lib failed — fallback colors still work */ });
  }, []);

  // ── Sticky cart visibility on scroll ──────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setShowStickyCart(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Fetch product from Supabase ───────────────────────────────────────────
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

      trackViewContent(normalised.name, normalised.price);

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
          : firstColor?.name || firstColor?.label || '',
      );
      addRecentlyViewed(normalised.id);

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

  // ── Keep active thumbnail in view ─────────────────────────────────────────
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

  // ── Add to cart handler ───────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!selectedSize && product!.sizes.length > 0) return;
    addItem(product!, selectedSize, selectedColor, quantity);

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: 'add_to_cart',
      ecommerce: {
        currency: 'BDT',
        value: product!.price * quantity,
        items: [{
          item_id: product!.id,
          item_name: product!.name,
          item_category: product!.category,
          price: product!.price,
          quantity,
        }],
      },
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // ── SEO data — computed once product is loaded ────────────────────────────
  const seoData = useMemo(() => {
    if (!product) return null;

    const canonical = `${SITE.domain}/product/${product.slug}`;
    const pageTitle = `${product.name} | ${BRAND.fullName}`;

    // Description: prefer product description, else build from data
    const stockInfo = getStockInfo(product.stock);
    const priceStr = product.comparePrice
      ? `Special price: ৳${product.price} (was ৳${product.comparePrice})`
      : `Price: ৳${product.price}`;
    const reviewStr = product.reviewCount > 0
      ? ` Rated ${product.rating.toFixed(1)}/5 by ${product.reviewCount} customers.`
      : '';
    const metaDescription = product.shortDescription || product.description
      ? (product.shortDescription || product.description).slice(0, 155)
      : `Buy ${product.name} at ${BRAND.fullName}. ${priceStr}. ${stockInfo.message}.${reviewStr}`;

    const keywords = [
      product.name,
      product.category,
      BRAND.fullName,
      `buy ${product.name}`,
      `${product.name} Bangladesh`,
      ...(product.tags || []),
    ].filter(Boolean).join(', ');

    // Primary OG image — first product image optimised to 1200px
    const ogImage = product.images[0]?.startsWith('http')
      ? getOptimizedImageUrl(product.images[0], 1200, 85)
      : `${SITE.domain}/images/og-image.jpg`;

    // ── Product JSON-LD ──────────────────────────────────────────────────────
    const availability = product.stock === 0
      ? 'https://schema.org/OutOfStock'
      : product.stock <= 5
        ? 'https://schema.org/LimitedAvailability'
        : 'https://schema.org/InStock';

    // priceValidUntil: 30 days from now
    const priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    const productSchema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${canonical}#product`,
      name: product.name,
      description: product.description || product.shortDescription || product.name,
      // All images, each optimised for structured data crawlers
      image: product.images
        .filter((img) => img.startsWith('http'))
        .map((img) => getOptimizedImageUrl(img, 1200, 85)),
      sku: product.sku || product.id,
      mpn: product.sku || product.id,
      brand: {
        '@type': 'Brand',
        name: BRAND.fullName,
        url: SITE.domain,
      },
      category: product.category,
      // color and size as product properties
      ...(selectedColor ? { color: selectedColor } : {}),
      ...(product.sizes.length > 0 ? { size: product.sizes.join(', ') } : {}),
      offers: {
        '@type': 'Offer',
        '@id': `${canonical}#offer`,
        url: canonical,
        priceCurrency: 'BDT',
        price: product.price,
        priceValidUntil,
        availability,
        itemCondition: 'https://schema.org/NewCondition',
        seller: {
          '@type': 'Organization',
          name: BRAND.fullName,
          url: SITE.domain,
        },
        // highPrice for comparePrice / original price
        ...(product.comparePrice && product.comparePrice > product.price
          ? {
            priceSpecification: {
              '@type': 'PriceSpecification',
              price: product.price,
              priceCurrency: 'BDT',
              valueAddedTaxIncluded: true,
            },
          }
          : {}),
      },
      // AggregateRating only when review data exists
      ...(product.reviewCount > 0
        ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating.toFixed(1),
            reviewCount: product.reviewCount,
            bestRating: '5',
            worstRating: '1',
          },
        }
        : {}),
    };

    // ── BreadcrumbList JSON-LD ───────────────────────────────────────────────
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.domain}/` },
        { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE.domain}/shop` },
        ...(product.categorySlug
          ? [{
            '@type': 'ListItem',
            position: 3,
            name: product.category,
            item: `${SITE.domain}/category/${product.categorySlug}`,
          }]
          : []),
        {
          '@type': 'ListItem',
          position: product.categorySlug ? 4 : 3,
          name: product.name,
          item: canonical,
        },
      ],
    };

    return { canonical, pageTitle, metaDescription, keywords, ogImage, productSchema, breadcrumbSchema };
  }, [product, selectedColor]);

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-[#6B5B55]">Loading product...</p>
      </div>
    );
  }

  // ─── Not found state ───────────────────────────────────────────────────────
  if (notFound || !product) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="heading-serif text-3xl font-bold text-charcoal mb-4">
            Product Not Found
          </h1>
          <Button onClick={() => navigate('/shop')}>Back to Shop</Button>
        </div>
      </div>
    );
  }

  // ─── Derived values ────────────────────────────────────────────────────────
  const totalThumbs = product.images.length + (product.videoUrl ? 1 : 0);
  const activeStripIndex = selectedImage === -1 ? product.images.length : selectedImage;
  const stockInfo = getStockInfo(product.stock);
  const discountPercent = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── SEO HEAD ──────────────────────────────────────────────────────── */}
      {seoData && (
        <Helmet prioritizeSeoTags>
          {/* Primary */}
          <title>{seoData.pageTitle}</title>
          <meta name="description" content={seoData.metaDescription} />
          <meta name="keywords" content={seoData.keywords} />
          <meta name="robots" content="index, follow, max-image-preview:large" />

          {/* Canonical */}
          <link rel="canonical" href={seoData.canonical} />

          {/* Open Graph — product type */}
          <meta property="og:type" content="product" />
          <meta property="og:site_name" content={BRAND.fullName} />
          <meta property="og:title" content={seoData.pageTitle} />
          <meta property="og:description" content={seoData.metaDescription} />
          <meta property="og:url" content={seoData.canonical} />
          <meta property="og:image" content={seoData.ogImage} />
          <meta property="og:image:secure_url" content={seoData.ogImage} />
          <meta property="og:image:type" content="image/jpeg" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="1200" />
          <meta
            property="og:image:alt"
            content={`${product.name} — ${BRAND.fullName}`}
          />
          <meta property="og:locale" content="en_US" />
          {/* Facebook Commerce product tags */}
          <meta property="product:price:amount" content={String(product.price)} />
          <meta property="product:price:currency" content="BDT" />
          <meta
            property="product:availability"
            content={product.stock > 0 ? 'in stock' : 'out of stock'}
          />
          <meta property="product:condition" content="new" />
          {product.sku && <meta property="product:retailer_item_id" content={product.sku} />}
          {product.category && <meta property="product:category" content={product.category} />}

          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={seoData.pageTitle} />
          <meta name="twitter:description" content={seoData.metaDescription} />
          <meta name="twitter:image" content={seoData.ogImage} />
          <meta
            name="twitter:image:alt"
            content={`${product.name} — ${BRAND.fullName}`}
          />

          {/* JSON-LD — Product with Offer, AggregateRating, Availability */}
          <script type="application/ld+json">
            {JSON.stringify(seoData.productSchema)}
          </script>

          {/* JSON-LD — BreadcrumbList */}
          <script type="application/ld+json">
            {JSON.stringify(seoData.breadcrumbSchema)}
          </script>
        </Helmet>
      )}

      {/* ── PAGE CONTENT ──────────────────────────────────────────────────── */}
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Breadcrumb — semantic nav with aria-label ── */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-[#6B5B55] mb-8">
            <Link to="/" className="hover:text-rose-gold focus-visible:outline-rose-gold">
              Home
            </Link>
            <ChevronRight size={14} aria-hidden="true" />
            <Link to="/shop" className="hover:text-rose-gold focus-visible:outline-rose-gold">
              Shop
            </Link>
            {product.categorySlug && (
              <>
                <ChevronRight size={14} aria-hidden="true" />
                <Link
                  to={`/category/${product.categorySlug}`}
                  className="hover:text-rose-gold focus-visible:outline-rose-gold"
                >
                  {product.category}
                </Link>
              </>
            )}
            <ChevronRight size={14} aria-hidden="true" />
            {/* Current page — aria-current="page" */}
            <span className="text-charcoal" aria-current="page">
              {product.name}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-10">

            {/* ── IMAGE GALLERY ──────────────────────────────────────────── */}
            <FadeIn>
              <div>
                {/* Main image container */}
                <motion.div
                  className="relative rounded-3xl overflow-hidden aspect-[3/4] bg-blush-light/30"
                  role="img"
                  aria-label={`${product.name} — main product image`}
                  onTouchStart={(e) => {
                    (window as any)._touchX = e.targetTouches[0].clientX;
                  }}
                  onTouchEnd={(e) => {
                    const diff = (window as any)._touchX - e.changedTouches[0].clientX;
                    if (Math.abs(diff) > 50) {
                      if (diff > 0) setSelectedImage((i) => Math.min(i + 1, product.images.length - 1));
                      else setSelectedImage((i) => Math.max(i - 1, 0));
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
                      aria-label={`${product.name} — product video`}
                    />
                  ) : product.images[selectedImage]?.startsWith('http') ? (
                    <img
                      src={getOptimizedImageUrl(product.images[selectedImage], 800)}
                      alt={getImageAlt(product.name, selectedColor, selectedSize, selectedImage)}
                      /*
                        First image (index 0) is the LCP candidate — load eagerly.
                        All subsequent images are below-fold — load lazily.
                      */
                      loading={selectedImage === 0 ? 'eager' : 'lazy'}
                      decoding={selectedImage === 0 ? 'sync' : 'async'}
                      fetchPriority={selectedImage === 0 ? 'high' : 'low'}
                      /*
                        Explicit dimensions prevent CLS. The aspect-[3/4] container
                        already reserves the space, but width/height on <img> helps
                        browsers that don't support aspect-ratio CSS yet.
                      */
                      width={800}
                      height={1067}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-blush via-lavender to-champagne"
                      aria-hidden="true"
                    />
                  )}

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2" aria-label="Product badges">
                    {product.isOnSale && <Badge variant="sale">Sale</Badge>}
                    {product.isNewArrival && <Badge variant="new">New</Badge>}
                    {product.isTrending && <Badge variant="trending">Trending</Badge>}
                    {product.comparePrice && discountPercent > 0 && (
                      <Badge variant="sale">{discountPercent}% OFF</Badge>
                    )}
                  </div>

                  {/* Wishlist button */}
                  <button
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                    aria-label="Add to wishlist"
                  >
                    <Heart size={18} className="text-rose-gold" aria-hidden="true" />
                  </button>

                  {/* Image nav arrows */}
                  {selectedImage > 0 && (
                    <button
                      onClick={() => setSelectedImage((i) => i - 1)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white shadow-md transition-all"
                      aria-label="Previous image"
                    >
                      <ArrowLeft size={16} className="text-charcoal" aria-hidden="true" />
                    </button>
                  )}
                  {selectedImage < product.images.length - 1 && (
                    <button
                      onClick={() => setSelectedImage((i) => i + 1)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white shadow-md transition-all"
                      aria-label="Next image"
                    >
                      <ArrowRight size={16} className="text-charcoal" aria-hidden="true" />
                    </button>
                  )}
                </motion.div>

                {/* Thumbnail strip */}
                {totalThumbs > 1 && (
                  <div className="flex items-center gap-2 mt-4" role="group" aria-label="Product image thumbnails">
                    <button
                      onClick={() => setSelectedImage((i) => {
                        const prev = i === -1 ? product.images.length - 1 : Math.max(0, i - 1);
                        return prev;
                      })}
                      disabled={activeStripIndex === 0}
                      className="flex-shrink-0 w-8 h-8 rounded-full border border-blush/40 flex items-center justify-center disabled:opacity-30 hover:border-rose-gold transition-colors bg-white/70"
                      aria-label="Previous thumbnail"
                    >
                      <ArrowLeft size={14} aria-hidden="true" />
                    </button>

                    <div
                      ref={thumbsRef}
                      className="flex gap-2 overflow-x-auto flex-1"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {product.images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedImage(i)}
                          aria-label={`View image ${i + 1} of ${product.images.length}`}
                          aria-pressed={i === selectedImage}
                          className={`flex-shrink-0 w-[72px] h-[86px] rounded-xl overflow-hidden bg-blush-light/30 transition-all duration-200 ${i === selectedImage
                            ? 'ring-2 ring-rose-gold ring-offset-2'
                            : 'opacity-60 hover:opacity-100'
                            }`}
                        >
                          {img.startsWith('http') ? (
                            <img
                              src={getOptimizedImageUrl(img, 200)}
                              alt={`${product.name} — thumbnail ${i + 1}`}
                              loading="lazy"
                              decoding="async"
                              width={72}
                              height={86}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-full h-full bg-gradient-to-br from-blush via-lavender to-champagne"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      ))}

                      {/* Video thumbnail */}
                      {product.videoUrl && (
                        <button
                          onClick={() => setSelectedImage(-1)}
                          aria-label="View product video"
                          aria-pressed={selectedImage === -1}
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
                            aria-hidden="true"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                              {/* Play icon */}
                              <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true">
                                <path d="M1 1l10 6-10 6V1z" fill="#B07D6B" />
                              </svg>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedImage((i) => {
                        if (product.videoUrl && i === product.images.length - 1) return -1;
                        return Math.min(product.images.length - 1, i + 1);
                      })}
                      disabled={activeStripIndex === totalThumbs - 1}
                      className="flex-shrink-0 w-8 h-8 rounded-full border border-blush/40 flex items-center justify-center disabled:opacity-30 hover:border-rose-gold transition-colors bg-white/70"
                      aria-label="Next thumbnail"
                    >
                      <ArrowRight size={14} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </FadeIn>

            {/* ── PRODUCT INFO ───────────────────────────────────────────── */}
            <FadeIn delay={0.2}>
              <div>
                {/* Category label */}
                <p className="text-sm text-rose-gold font-medium mb-1">{product.category}</p>

                {/*
                  H1 — The product name is the primary heading on this page.
                  One H1 per page is correct here (no global sr-only H1 needed
                  because the product is always defined when we reach this JSX).
                */}
                <h1 className="heading-serif text-3xl md:text-4xl font-bold text-charcoal mb-3">
                  {product.name}
                </h1>

                {/* Rating — shown only when review data exists */}
                {product.reviewCount > 0 && (
                  <div
                    className="flex items-center gap-4 mb-3"
                    itemScope
                    itemType="https://schema.org/AggregateRating"
                  >
                    <div
                      className="flex items-center gap-1"
                      aria-label={`Rating: ${product.rating.toFixed(1)} out of 5`}
                    >
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          aria-hidden="true"
                          className={`w-4 h-4 ${i < Math.floor(product.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                            }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className="font-semibold text-gray-900"
                        itemProp="ratingValue"
                      >
                        {product.rating.toFixed(1)}
                      </span>
                      <span
                        className="text-gray-500"
                        itemProp="reviewCount"
                      >
                        ({product.reviewCount} reviews)
                      </span>
                    </div>
                  </div>
                )}

                {/* Price */}
                <div className="mb-4">
                  <PriceDisplay
                    price={product.price}
                    comparePrice={product.comparePrice}
                    size="lg"
                  />
                </div>

                {/* Stock urgency */}
                {stockInfo.urgent && stockInfo.status !== 'out-of-stock' && (
                  <div
                    role="alert"
                    className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${stockInfo.color === 'orange'
                      ? 'bg-orange-50 border border-orange-200'
                      : 'bg-red-50 border border-red-200'
                      }`}
                  >
                    <AlertCircle
                      aria-hidden="true"
                      className={`w-5 h-5 ${stockInfo.color === 'orange' ? 'text-orange-600' : 'text-red-600'
                        }`}
                    />
                    <span
                      className={`font-medium ${stockInfo.color === 'orange' ? 'text-orange-700' : 'text-red-700'
                        }`}
                    >
                      {stockInfo.message}
                    </span>
                  </div>
                )}

                {stockInfo.status === 'out-of-stock' && (
                  <div
                    role="alert"
                    className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4"
                  >
                    <AlertCircle aria-hidden="true" className="w-5 h-5 text-red-600" />
                    <span className="text-red-700 font-medium">{stockInfo.message}</span>
                  </div>
                )}

                <p className="text-[#6B5B55] leading-relaxed mb-0">{product.description}</p>

                <div className="luxury-line mb-3" />

                {/* ── Color selection ── */}
                {product.colors.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-charcoal mb-3" id="color-label">
                      Color:{' '}
                      <span className="text-[#6B5B55] font-normal">{selectedColor}</span>
                    </p>
                    <div
                      className="flex flex-wrap gap-3"
                      role="group"
                      aria-labelledby="color-label"
                    >
                      {product.colors.map((color: any) => {
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
                        const isGradient = resolvedBg.startsWith('linear-gradient');

                        return (
                          <button
                            key={colorName}
                            onClick={() => setSelectedColor(colorName)}
                            title={colorName}
                            aria-label={`Color: ${colorName}${isSelected ? ' (selected)' : ''}`}
                            aria-pressed={isSelected}
                            className="relative flex-shrink-0 transition-all duration-200"
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              ...(isGradient
                                ? { background: resolvedBg }
                                : { backgroundColor: resolvedBg }),
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

                {/* ── Size selection ── */}
                {product.sizes.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-charcoal" id="size-label">
                        Size:{' '}
                        <span className="text-[#6B5B55] font-normal">{selectedSize}</span>
                      </p>
                    </div>
                    <div
                      className="flex flex-wrap gap-2"
                      role="group"
                      aria-labelledby="size-label"
                    >
                      {product.sizes.map((size) => (
                        <button
                          key={String(size)}
                          onClick={() => setSelectedSize(size)}
                          aria-label={`Size ${size}${selectedSize === size ? ' (selected)' : ''}`}
                          aria-pressed={selectedSize === size}
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

                {/* Custom product info */}
                {product.customText && (
                  <div className="mb-4 rounded-2xl border border-blush/20 bg-blush-light/20 p-4">
                    <div className="text-sm leading-relaxed text-charcoal whitespace-pre-line">
                      {product.customText}
                    </div>
                  </div>
                )}

                {/* ── Quantity ── */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-charcoal mb-3" id="quantity-label">
                    Quantity
                  </p>
                  <div
                    className="flex items-center gap-3"
                    role="group"
                    aria-labelledby="quantity-label"
                  >
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={stockInfo.status === 'out-of-stock'}
                      aria-label="Decrease quantity"
                      className="w-9 h-9 rounded-xl bg-blush-light/50 flex items-center justify-center hover:bg-blush-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus size={16} aria-hidden="true" />
                    </button>
                    <span
                      className="w-12 text-center font-medium text-charcoal"
                      aria-live="polite"
                      aria-atomic="true"
                      aria-label={`Quantity: ${quantity}`}
                    >
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                      disabled={stockInfo.status === 'out-of-stock' || quantity >= product.stock}
                      aria-label="Increase quantity"
                      className="w-9 h-9 rounded-xl bg-blush-light/50 flex items-center justify-center hover:bg-blush-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} aria-hidden="true" />
                    </button>
                    <span className="text-sm text-[#6B5B55]" aria-live="polite">
                      {stockInfo.message}
                    </span>
                  </div>
                </div>

                {/* ── CTA buttons ── */}
                <div className="flex gap-2 mb-6">
                  <Button
                    size="lg"
                    onClick={() => {
                      if (!selectedSize && product.sizes.length > 0) return;
                      addItem(product, selectedSize, selectedColor, quantity);
                      navigate('/checkout');
                    }}
                    disabled={product.stock === 0}
                    aria-label={product.stock === 0 ? 'Out of stock' : `Buy ${product.name} now`}
                    className="flex-[3] h-12 text-base font-semibold rounded-xl border-0"
                    style={{
                      background: 'linear-gradient(135deg, #1eff77 0%, #1eff77 100%)',
                      color: 'Black',
                    }}
                  >
                    <ShoppingBag size={17} aria-hidden="true" />
                    {product.stock === 0 ? 'Out of Stock' : 'Buy Now'}
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    aria-label={addedToCart ? 'Added to bag' : `Add ${product.name} to bag`}
                    aria-live="polite"
                    className={`flex-1 h-12 text-sm rounded-xl ${addedToCart ? '!border-green-500 !text-green-500' : ''
                      }`}
                  >
                    {addedToCart ? '✓ Added' : 'Add to Bag'}
                  </Button>
                </div>

                {/* Trust badges */}
                <div className="grid grid-cols-3 gap-3" aria-label="Trust indicators">
                  {[
                    { icon: '🚚', label: 'Fast Delivery' },
                    { icon: '✅', label: '100% Authentic' },
                    { icon: '🔒', label: 'Secure Payment' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex flex-col items-center gap-1.5 text-center p-3 rounded-xl bg-blush-light/30"
                    >
                      <span className="text-xl" aria-hidden="true">{item.icon}</span>
                      <span className="text-xs text-[#6B5B55]">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>

          {/* ── Related Products ───────────────────────────────────────────── */}
          {related.length > 0 && (
            <section className="mt-16" aria-label="Related products">
              <div className="flex items-center justify-between mb-6">
                <h2 className="heading-serif text-2xl md:text-3xl font-bold text-charcoal">
                  You May Also Like
                </h2>
                <div className="flex gap-2" role="group" aria-label="Browse related products">
                  <button
                    onClick={() => setSimilarPage((p) => Math.max(0, p - 1))}
                    disabled={similarPage === 0}
                    className="w-9 h-9 rounded-full border border-blush/40 flex items-center justify-center disabled:opacity-30 hover:border-rose-gold transition-colors"
                    aria-label="Previous related products"
                  >
                    <ArrowLeft size={16} aria-hidden="true" />
                  </button>
                  <button
                    onClick={() =>
                      setSimilarPage((p) => Math.min(Math.ceil(related.length / 4) - 1, p + 1))
                    }
                    disabled={similarPage >= Math.ceil(related.length / 4) - 1}
                    className="w-9 h-9 rounded-full border border-blush/40 flex items-center justify-center disabled:opacity-30 hover:border-rose-gold transition-colors"
                    aria-label="Next related products"
                  >
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {related
                  .slice(similarPage * 4, similarPage * 4 + 4)
                  .map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
              </div>
            </section>
          )}

        </div>

        {/* ── Sticky mobile Add to Cart ─────────────────────────────────── */}
        <AnimatePresence>
          {showStickyCart && (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 md:hidden shadow-2xl z-50"
              role="region"
              aria-label="Quick add to cart"
            >
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-sm text-gray-600">Price</div>
                  <div className="text-xl font-bold text-pink-600">৳{product.price}</div>
                </div>
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  aria-label={
                    product.stock === 0 ? 'Out of stock' : `Add ${product.name} to cart`
                  }
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold"
                  style={{
                    background:
                      product.stock === 0
                        ? '#ccc'
                        : 'linear-gradient(135deg, #1eff77 0%, #1eff77 100%)',
                    color: 'Black',
                  }}
                >
                  <ShoppingBag size={18} aria-hidden="true" />
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
