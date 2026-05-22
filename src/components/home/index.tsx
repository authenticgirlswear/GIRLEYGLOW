/* ===================================================
   AUTHENTIC GIRLSWEAR - Home Page Components
   FIXED: 
   - Hero reads from useContentStore (image + texts)
   - BannerSlider reads from useContentStore (images + texts)
   - Reduced Hero height to 1/3 of original
   =================================================== */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, ShoppingBag, Star, Sparkles } from 'lucide-react';
import { FadeIn, SectionHeader, PriceDisplay, Badge, StarRating, Button } from '@/components/ui';
import { useMemo } from 'react';
import { useProductStore, useCartStore } from '@/store';
import { useContentStore } from '@/pages/admin/Content';
import type { Product } from '@/types';

// ==========================================
// HERO SECTION  ← reads from useContentStore
// ==========================================
function useAutoScroll(
  itemCount: number,
  cardWidth: number,
  speed: number,
  reverse: boolean = false
) {
  const trackRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const positionRef = useRef(0);
  const isPausedRef = useRef(false);

  const animate = useCallback(() => {
    if (!trackRef.current || isPausedRef.current) {
      animFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    const totalWidth = cardWidth * itemCount;

    if (reverse) {
      positionRef.current -= speed;
      // ✅ FIXED: was (<= -totalWidth). Now resets correctly at 0.
      if (positionRef.current <= 0) {
        positionRef.current += totalWidth;
      }
    } else {
      positionRef.current += speed;
      if (positionRef.current >= totalWidth) {
        positionRef.current -= totalWidth;
      }
    }

    trackRef.current.style.transform = `translateX(-${positionRef.current}px)`;
    animFrameRef.current = requestAnimationFrame(animate);
  }, [itemCount, cardWidth, speed, reverse]);

  useEffect(() => {
    if (itemCount === 0) return;
    // ✅ FIXED: reverse starts at totalWidth so it has content to scroll into
    positionRef.current = reverse ? cardWidth * itemCount : 0;
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [animate, itemCount, reverse, cardWidth]);

  const handlePrev = () => {
    isPausedRef.current = true;
    const totalWidth = cardWidth * itemCount;
    positionRef.current -= cardWidth;
    // Prevent going below 0 (wrap around)
    if (positionRef.current < 0) positionRef.current += totalWidth;
    if (trackRef.current) {
      trackRef.current.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      trackRef.current.style.transform = `translateX(-${positionRef.current}px)`;
    }
    setTimeout(() => {
      if (trackRef.current) trackRef.current.style.transition = 'none';
      isPausedRef.current = false;
    }, 700);
  };

  const handleNext = () => {
    isPausedRef.current = true;
    positionRef.current += cardWidth;
    if (trackRef.current) {
      trackRef.current.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      trackRef.current.style.transform = `translateX(-${positionRef.current}px)`;
    }
    setTimeout(() => {
      if (trackRef.current) trackRef.current.style.transition = 'none';
      isPausedRef.current = false;
    }, 700);
  };

  return { trackRef, isPausedRef, handlePrev, handleNext };
}

export const Hero: React.FC = () => {
  const navigate = useNavigate();
  const { content } = useContentStore();

  const hasImage = !!content.heroImageUrl;

  return (
    <section
      className="relative min-h-[40vh] md:min-h-[50vh] flex items-center overflow-hidden"
      style={
        hasImage
          ? {
              backgroundImage: `url(${content.heroImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      {/* Background gradient (only if no image) */}
      {!hasImage && <div className="absolute inset-0 hero-gradient" />}

      {/* Dark overlay on image for text readability */}
      {hasImage && <div className="absolute inset-0 bg-black/20" />}

      {/* Decorative floating circles (only if no image) */}
      {!hasImage && (
        <div className="absolute inset-0">
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-10 right-[10%] w-40 h-40 rounded-full bg-white/10 backdrop-blur-sm"
          />
          <motion.div
            animate={{ y: [0, 15, 0], rotate: [0, -3, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute bottom-10 left-[5%] w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm"
          />
        </div>
      )}

      {/* Hero Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 w-full">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/30 backdrop-blur-sm text-sm font-medium text-charcoal mb-4">
              <Sparkles size={14} className="text-rose-gold" />
              {}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className={`heading-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-4 ${
              hasImage ? 'text-white drop-shadow-lg' : 'text-charcoal'
            }`}
          >
            {content.heroTitle}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className={`text-sm md:text-base max-w-lg mb-6 leading-relaxed ${
              hasImage ? 'text-white/90 drop-shadow' : 'text-warm-gray'
            }`}
          >
            {content.heroSubtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="flex flex-wrap gap-3"
          >
            <Button size="md" onClick={() => navigate('/shop')}>
              {content.heroButtonText}
              <ArrowRight size={16} />
            </Button>
            <Button variant="outline" size="md" onClick={() => navigate('/shop?sale=true')}>
              Shop Sale
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ==========================================
// BANNER SLIDER  ← reads from useContentStore
// ==========================================
export const BannerSlider: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const { content } = useContentStore();
  const banners = content.banners.filter(b => b.active);
  const navigate = useNavigate();

  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // Reset current if banners change
  useEffect(() => {
    if (current >= banners.length) setCurrent(0);
  }, [banners.length, current]);

  if (banners.length === 0) return null;

  const banner = banners[current];

  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative rounded-3xl overflow-hidden h-64 md:h-80 lg:h-96">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="absolute inset-0 flex items-center"
              style={
                banner.imageUrl
                  ? {
                      backgroundImage: `url(${banner.imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : { background: banner.gradient }
              }
            >
              {/* Dark overlay for text readability when image is used */}
              {banner.imageUrl && <div className="absolute inset-0 bg-black/30" />}

              <div className="relative px-8 md:px-16 max-w-xl">
                <h3
                  className={`heading-serif text-2xl md:text-4xl lg:text-5xl font-bold mb-3 ${
                    banner.imageUrl ? 'text-white drop-shadow-lg' : 'text-charcoal'
                  }`}
                >
                  {banner.title}
                </h3>
                <p
                  className={`text-sm md:text-base mb-6 ${
                    banner.imageUrl ? 'text-white/90 drop-shadow' : 'text-warm-gray'
                  }`}
                >
                  {banner.subtitle}
                </p>
                <Button onClick={() => navigate(banner.buttonLink)}>
                  {banner.buttonText}
                  <ArrowRight size={16} />
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    i === current ? 'bg-rose-gold w-8' : 'bg-white/60 w-2.5'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={() =>
                setCurrent(prev => (prev - 1 + banners.length) % banners.length)
              }
              className="absolute left-8 md:left-12 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/80 transition-colors z-10"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={() => setCurrent(prev => (prev + 1) % banners.length)}
              className="absolute right-8 md:right-12 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/80 transition-colors z-10"
            >
              <ArrowRight size={18} />
            </button>
          </>
        )}
      </div>
    </section>
  );
};

// ==========================================
// FEATURED COLLECTION  ← Infinite Auto-Scrolling Slider
// Replace the existing FeaturedCollection section in
// src/components/home/index.tsx with this entire block
// ==========================================

// ADD THESE IMPORTS at the top of your file (if not already there):
// import { useRef, useCallback } from 'react';
// Your existing imports (React, useState, useEffect, useNavigate, etc.) stay the same

export const FeaturedCollection: React.FC = () => {
  const { products, fetchProducts } = useProductStore();
  const { content } = useContentStore();
  const navigate = useNavigate();

  // Slider refs
  const trackRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const positionRef = useRef(0);
  const isPausedRef = useRef(false);

  const CARD_WIDTH = 280 + 20; // card width + gap
  const SPEED = 1.2; // px per frame — increase for faster scroll

  useEffect(() => {
    fetchProducts();
  }, []);

  const featured = products.filter((p) => p.isFeatured);

  // Triple the slides for seamless infinite loop
  const allSlides = [...featured, ...featured, ...featured];

  const animate = useCallback(() => {
    if (!trackRef.current || isPausedRef.current) {
      animFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    positionRef.current += SPEED;
    const totalWidth = CARD_WIDTH * featured.length;

    if (positionRef.current >= totalWidth) {
      positionRef.current -= totalWidth;
    }

    trackRef.current.style.transform = `translateX(-${positionRef.current}px)`;
    animFrameRef.current = requestAnimationFrame(animate);
  }, [featured.length]);

  useEffect(() => {
    if (featured.length === 0) return;
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [animate, featured.length]);

  const handlePrev = () => {
    isPausedRef.current = true;
    positionRef.current = Math.max(0, positionRef.current - CARD_WIDTH);
    if (trackRef.current) {
      trackRef.current.style.transition =
        'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      trackRef.current.style.transform = `translateX(-${positionRef.current}px)`;
    }
    setTimeout(() => {
      if (trackRef.current) trackRef.current.style.transition = 'none';
      isPausedRef.current = false;
    }, 700);
  };

  const handleNext = () => {
    isPausedRef.current = true;
    positionRef.current += CARD_WIDTH;
    if (trackRef.current) {
      trackRef.current.style.transition =
        'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      trackRef.current.style.transform = `translateX(-${positionRef.current}px)`;
    }
    setTimeout(() => {
      if (trackRef.current) trackRef.current.style.transition = 'none';
      isPausedRef.current = false;
    }, 700);
  };

  return (
<section className="py-5 md:py-5 overflow-hidden" style={{ backgroundColor: '#F7EFEA' }}>      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeader
            title={content.featuredTitle}
            subtitle={content.featuredSubtitle}
          />
        </FadeIn>
      </div>

      {featured.length === 0 ? (
        <div className="text-center py-16 text-warm-gray">
          <p>No featured products yet. Mark products as "Featured" in the admin panel.</p>
        </div>
      ) : (
        <div className="relative mt-10">
          {/* Slider Viewport */}
          <div
            className="overflow-hidden"
            onMouseEnter={() => { isPausedRef.current = true; }}
            onMouseLeave={() => { isPausedRef.current = false; }}
            onTouchStart={() => { isPausedRef.current = true; }}
            onTouchEnd={() => { isPausedRef.current = false; }}
          >
            {/* Sliding Track */}
            <div
              ref={trackRef}
              className="flex gap-5 will-change-transform"
              style={{ width: 'max-content' }}
            >
              {allSlides.map((product, idx) => (
                <div
                  key={`${product.id}-${idx}`}
                  className="relative flex-shrink-0 w-[280px] rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer group bg-blush-light/30"
                  onClick={() => navigate(`/product/${product.slug}`)}
                >
                  {/* Product Image */}
                  {product.images?.[0]?.startsWith('http') ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      loading={idx < 6 ? 'eager' : 'lazy'}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-700" style={{ backgroundColor: '#E8D5CC' }} />
                  )}

                  {/* Dark overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                    {product.isOnSale && <Badge variant="sale">Sale</Badge>}
                    {product.isNewArrival && <Badge variant="new">New</Badge>}
                    {product.isTrending && <Badge variant="trending">Trending</Badge>}
                  </div>

                  {/* Product Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 via-black/30 to-transparent translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white/70 text-xs mb-0.5">{product.category}</p>
                    <h3 className="text-sm font-medium line-clamp-1 mb-1" style={{ color: '#5C3A2E' }}>
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <PriceDisplay
                        price={product.price}
                        comparePrice={product.comparePrice}
                        size="sm"
                      />
                      <span className="text-white/80 text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        View <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prev Arrow */}
          <button
            onClick={handlePrev}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200"
          >
            <ArrowLeft size={18} className="text-charcoal" />
          </button>

          {/* Next Arrow */}
          <button
            onClick={handleNext}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200"
          >
            <ArrowRight size={18} className="text-charcoal" />
          </button>

          {/* Fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white/60 to-transparent z-[5]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white/60 to-transparent z-[5]" />
        </div>
      )}

      {/* View All Button */}
      <FadeIn delay={0.4}>
        <div className="text-center mt-10">
          <Button
  variant="outline"
  onClick={() => navigate('/shop')}
  style={{ borderColor: '#B87A5D', color: '#B87A5D' }}
>
            View All Products <ArrowRight size={16} />
          </Button>
        </div>
      </FadeIn>
    </section>
  );
};

// ==========================================
// CATEGORY SHOWCASE
// ==========================================
// ==========================================
// CATEGORY SHOWCASE  ← reads from useProductStore (real data)
// ==========================================

// Soft gradient palette — cycles through for each unique category
const CATEGORY_GRADIENTS = [
  'linear-gradient(135deg, #EBCDD2 0%, #E0BEC6 100%)',  // dusty pink
  'linear-gradient(135deg, #D7E2F0 0%, #C8D6EC 100%)',  // powder blue
  'linear-gradient(135deg, #E8DCCF 0%, #DDD0C0 100%)',  // champagne nude
  'linear-gradient(135deg, #EBCDD2 0%, #E0BEC6 100%)',  // dusty pink
  'linear-gradient(135deg, #D7E2F0 0%, #C8D6EC 100%)',  // powder blue
  'linear-gradient(135deg, #E8DCCF 0%, #DDD0C0 100%)',  // champagne nude
  'linear-gradient(135deg, #EBCDD2 0%, #E0BEC6 100%)',  // dusty pink
  'linear-gradient(135deg, #D7E2F0 0%, #C8D6EC 100%)',  // powder blue
];

export const CategoryShowcase: React.FC = () => {
  const navigate = useNavigate();
  const { products, fetchProducts } = useProductStore();

  useEffect(() => { fetchProducts(); }, []);

  // Build category list dynamically from your real product data
  const derivedCategories = useMemo(() => {
    const seen = new Map<string, { name: string; slug: string; productCount: number; gradient: string }>();
    let gradientIndex = 0;

    products.forEach((product) => {
      if (!product.category) return;
      const slug = product.category.toLowerCase().replace(/\s+/g, '-');

      if (!seen.has(slug)) {
        seen.set(slug, {
          name: product.category,
          slug,
          productCount: 1,
          gradient: CATEGORY_GRADIENTS[gradientIndex++ % CATEGORY_GRADIENTS.length],
        });
      } else {
        seen.get(slug)!.productCount += 1;
      }
    });

    return Array.from(seen.values());
  }, [products]);

  const CARD_WIDTH = 260 + 10;
  const allSlides = [...derivedCategories, ...derivedCategories, ...derivedCategories];

  const { trackRef, isPausedRef, handlePrev, handleNext } = useAutoScroll(
    derivedCategories.length,
    CARD_WIDTH,
    1.2,
    true  // left-to-right direction
  );

  return (
<section className="py-8 md:py-12 overflow-hidden" style={{ backgroundColor: '#EFE7E2' }}>      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeader
            title="Shop by Category"
            subtitle="Find your perfect piece in our curated collections"
          />
        </FadeIn>
      </div>

      {derivedCategories.length === 0 ? (
        <div className="text-center py-16 text-warm-gray">
          <p>No categories yet. Add products with a category set in the admin panel.</p>
        </div>
      ) : (
        <div className="relative mt-10">
          <div
            className="overflow-hidden"
            onMouseEnter={() => { isPausedRef.current = true; }}
            onMouseLeave={() => { isPausedRef.current = false; }}
            onTouchStart={() => { isPausedRef.current = true; }}
            onTouchEnd={() => { isPausedRef.current = false; }}
          >
            <div
              ref={trackRef}
              className="flex gap-4 will-change-transform"
              style={{ width: 'max-content' }}
            >
              {allSlides.map((category, idx) => (
                <motion.div
                  key={`${category.slug}-${idx}`}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  onClick={() => navigate(`/shop?category=${encodeURIComponent(category.name)}`)}
                  className="relative flex-shrink-0 w-[260px] cursor-pointer rounded-2xl overflow-hidden aspect-[3/4] group"
                  style={{ background: category.gradient }}
                >
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                    <h3 className="heading-serif text-lg md:text-xl font-semibold text-charcoal mb-1">
                      {category.name}
                    </h3>
                    <p className="text-xs md:text-sm text-warm-gray/80">
                      {category.productCount} {category.productCount === 1 ? 'product' : 'products'}
                    </p>
                  </div>
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight size={14} className="text-charcoal" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <button
            onClick={handlePrev}
            aria-label="Previous"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200"
          >
            <ArrowLeft size={18} className="text-charcoal" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200"
          >
            <ArrowRight size={18} className="text-charcoal" />
          </button>

          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white/60 to-transparent z-[5]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white/60 to-transparent z-[5]" />
        </div>
      )}
    </section>
  );
};

// ==========================================
// TRENDING PRODUCTS
// ==========================================
export const TrendingProducts: React.FC = () => {
  const { products, fetchProducts } = useProductStore();
  const { content } = useContentStore();
  const navigate = useNavigate();
 
  const CARD_WIDTH = 280 + 20;
  const trending = products.filter((p) => p.isTrending);
  const allSlides = [...trending, ...trending, ...trending];
 
  const { trackRef, isPausedRef, handlePrev, handleNext } = useAutoScroll(
    trending.length,
    CARD_WIDTH,
    1.2,    // ← speed
    false   // ← false = right to left
  );
 
  useEffect(() => { fetchProducts(); }, []);
 
  return (
    <section className="py-8 md:py-12 overflow-hidden" style={{ backgroundColor: '#F3E5E1' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeader title={content.trendingTitle} subtitle={content.trendingSubtitle} />
        </FadeIn>
      </div>
 
      {trending.length === 0 ? (
        <div className="text-center py-16 text-warm-gray">
          <p>No trending products yet. Mark products as "Trending" in the admin panel.</p>
        </div>
      ) : (
        <div className="relative mt-10">
          <div
            className="overflow-hidden"
            onMouseEnter={() => { isPausedRef.current = true; }}
            onMouseLeave={() => { isPausedRef.current = false; }}
            onTouchStart={() => { isPausedRef.current = true; }}
            onTouchEnd={() => { isPausedRef.current = false; }}
          >
            <div ref={trackRef} className="flex gap-5 will-change-transform" style={{ width: 'max-content' }}>
              {allSlides.map((product, idx) => (
                <div
                  key={`${product.id}-${idx}`}
                  className="relative flex-shrink-0 w-[280px] rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer group"
style={{ backgroundColor: '#FFFFFF' }}
                  onClick={() => navigate(`/product/${product.slug}`)}
                >
                  {product.images?.[0]?.startsWith('http') ? (
                    <img src={product.images[0]} alt={product.name} loading={idx < 6 ? 'eager' : 'lazy'} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-blush via-lavender to-champagne" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                    {product.isOnSale && <Badge variant="sale">Sale</Badge>}
                    {product.isNewArrival && <Badge variant="new">New</Badge>}
                    {product.isTrending && <Badge variant="trending">Trending</Badge>}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 via-black/30 to-transparent translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white/70 text-xs mb-0.5">{product.category}</p>
                    <h3 className="text-white text-sm font-medium line-clamp-1 mb-1">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <PriceDisplay price={product.price} comparePrice={product.comparePrice} size="sm" />
                      <span className="text-white/80 text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">View <ArrowRight size={12} /></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={handlePrev} aria-label="Previous" className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200">
            <ArrowLeft size={18} className="text-charcoal" />
          </button>
          <button onClick={handleNext} aria-label="Next" className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200">
            <ArrowRight size={18} className="text-charcoal" />
          </button>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white/60 to-transparent z-[5]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white/60 to-transparent z-[5]" />
        </div>
      )}
    </section>
  );
};

// ==========================================
// PRODUCT CARD
// ==========================================
interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const [showQuickView, setShowQuickView] = useState(false);

  return (
    <motion.div
  whileHover={{
    y: -4,
    boxShadow: '0 20px 40px rgba(0,0,0,0.14)',
    transition: { duration: 0.3 },
  }}
  className="group cursor-pointer"
  onClick={() => navigate(`/product/${product.slug}`)}
  style={{
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    padding: '8px',
     backgroundColor: 'rgba(255, 228, 237, 0.35)',
  }}
>
      <div className="relative rounded-2xl overflow-hidden aspect-[3/4] mb-3 bg-blush-light/30">
        {product.images?.[0]?.startsWith('http') ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blush via-lavender to-champagne group-hover:scale-105 transition-transform duration-700" />
        )}

        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isOnSale && <Badge variant="sale">Sale</Badge>}
          {product.isNewArrival && <Badge variant="new">New</Badge>}
          {product.isTrending && <Badge variant="trending">Trending</Badge>}
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <button
            onClick={e => {
  e.stopPropagation();
  setShowQuickView(true);
}}
            className="flex-1 py-2.5 glass rounded-xl text-xs font-medium text-charcoal hover:bg-white/90 transition-colors flex items-center justify-center gap-1.5"
          >
            <ShoppingBag size={14} /> Quick View
          </button>
        </div>

        <button
          onClick={e => e.stopPropagation()}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
        >
          <Star size={14} className="text-rose-gold" />
        </button>
      </div>

      <div>
        <p className="text-xs text-warm-gray mb-0.5">{product.category}</p>
        <h3 className="text-sm font-medium text-charcoal mb-1 line-clamp-1 group-hover:text-rose-gold transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mb-1">
          <StarRating rating={product.rating} size={12} />
        </div>
        <PriceDisplay
          price={product.price}
          comparePrice={product.comparePrice}
          size="sm"
        />
      </div>

  {product.colors && product.colors.length > 0 && (
  <div className="flex items-center gap-1.5 mt-2">
    {product.colors.map((color: any, index: number) => {
      const colorMap: Record<string, string> = {
        red: '#E53E3E',
        black: '#1A1A1A',
        white: '#FFFFFF',
        skin: '#F5CBA7',
        beige: '#F5F0E8',
        pink: '#FFB6C1',
        navy: '#1A237E',
        blue: '#3182CE',
        green: '#38A169',
        yellow: '#ECC94B',
        orange: '#ED8936',
        purple: '#805AD5',
        grey: '#A0AEC0',
        gray: '#A0AEC0',
        brown: '#8B4513',
        maroon: '#800000',
        cream: '#FFFDD0',
        gold: '#FFD700',
        silver: '#C0C0C0',
        coral: '#FF6B6B',
        peach: '#FFCBA4',
      };

      const colorName = typeof color === 'string' ? color : color.name || '';
      const hex = colorMap[colorName.toLowerCase()] || colorName;

      return (
        <span
          key={index}
          className="w-3.5 h-3.5 rounded-full border border-charcoal/10"
          style={{ backgroundColor: hex }}
          title={colorName}
        />
      );
    })}
  </div>
)}
    </motion.div>
  );
};

// ==========================================
// QUICK VIEW MODAL
// ==========================================

const QV_COLOR_MAP: Record<string, string> = {
  red:'#E53E3E',black:'#1A1A1A',white:'#FFFFFF',skin:'#F5CBA7',
  beige:'#F5F0E8',pink:'#FFB6C1',navy:'#1A237E',blue:'#3182CE',
  green:'#38A169',yellow:'#ECC94B',orange:'#ED8936',purple:'#805AD5',
  grey:'#A0AEC0',gray:'#A0AEC0',brown:'#8B4513',maroon:'#800000',
  cream:'#FFFDD0',gold:'#FFD700',silver:'#C0C0C0',coral:'#FF6B6B',
  peach:'#FFCBA4','rose gold':'#B76E79',teal:'#008080',burgundy:'#722F37',
  lavender:'#E6E6FA',mint:'#98FF98',mustard:'#FFDB58',wine:'#722F37',
};
const resolveQVColor = (c: string) => {
  const k = c.trim().toLowerCase();
  if (QV_COLOR_MAP[k]) return QV_COLOR_MAP[k];
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(k)) return c;
  return '#cccccc';
};

// ── Bengali Size Guide Popup ──
const SizeGuidePopup: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [band, setBand] = useState('');
  const [bust, setBust] = useState('');
  const [result, setResult] = useState('');
  const [celebrate, setCelebrate] = useState(false);

  const calculate = () => {
    const b = parseFloat(band), bu = parseFloat(bust);
    if (!b || !bu || bu <= b) { alert('সঠিক মাপ দিন। বাস্ট অবশ্যই ব্যান্ডের চেয়ে বড় হতে হবে।'); return; }
    let bandSize = Math.round(b);
    if (bandSize % 2 !== 0) bandSize += 1;
    const cups = ['AA','A','B','C','D','DD','DDD','G'];
    const cup = cups[Math.min(Math.round(bu - b), cups.length - 1)];
    setResult(`${bandSize}${cup}`);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
        className="relative bg-white rounded-3xl p-6 max-w-sm w-full z-10 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-blush-light">
          <X size={18} className="text-warm-gray" />
        </button>
        <h3 className="heading-serif text-xl font-semibold text-charcoal mb-1">সাইজ গাইড</h3>
        <p className="text-xs text-warm-gray mb-4">আপনার সঠিক ব্রা সাইজ জানুন</p>

        <div className="bg-blush-light/40 rounded-2xl p-4 mb-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-charcoal mb-1">📏 ব্যান্ড সাইজ কীভাবে মাপবেন?</p>
            <p className="text-xs text-warm-gray leading-relaxed">বুকের ঠিক নিচে (আন্ডারবাস্ট) টেপ মেজার দিয়ে শ্বাস ছেড়ে আঁটোভাবে মাপুন। এটাই আপনার ব্যান্ড সাইজ।</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-charcoal mb-1">📏 বাস্ট সাইজ কীভাবে মাপবেন?</p>
            <p className="text-xs text-warm-gray leading-relaxed">বুকের সবচেয়ে পূর্ণ অংশের উপর দিয়ে (নিপলের সমান্তরালে) আলগাভাবে মাপুন। এটাই আপনার বাস্ট সাইজ।</p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs text-warm-gray mb-1 block">ব্যান্ড সাইজ (ইঞ্চি)</label>
            <input type="number" value={band} onChange={e => setBand(e.target.value)} placeholder="যেমন: 32"
              className="w-full px-4 py-2.5 rounded-xl border border-blush/30 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30" />
          </div>
          <div>
            <label className="text-xs text-warm-gray mb-1 block">বাস্ট সাইজ (ইঞ্চি)</label>
            <input type="number" value={bust} onChange={e => setBust(e.target.value)} placeholder="যেমন: 36"
              className="w-full px-4 py-2.5 rounded-xl border border-blush/30 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30" />
          </div>
        </div>

        <button onClick={calculate}
          className="w-full py-3 bg-rose-gold text-white rounded-xl text-sm font-medium hover:bg-deep-rose transition-colors">
          আমার সাইজ বের করুন
        </button>

        {result && (
          <motion.div initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale: celebrate ? [1,1.1,1] : 1 }}
            className="mt-4 text-center bg-blush-light/60 rounded-2xl p-4">
            <p className="text-xs text-warm-gray mb-1">আপনার সঠিক ব্রা সাইজ</p>
            <p className="text-4xl font-bold text-rose-gold">{result}</p>
            <p className="text-sm text-charcoal mt-2">🎉 অভিনন্দন! আপনার পারফেক্ট সাইজ পেয়ে গেছেন!</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

// ── Main Quick View Modal ──
export const QuickViewModal: React.FC<{ product: Product | null; onClose: () => void }> = ({ product, onClose }) => {
  const { addItem } = useCartStore();
  const { products } = useProductStore();
  const navigate = useNavigate();

  const [currentImage, setCurrentImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [similarPage, setSimilarPage] = useState(0);
  const touchStartX = useRef(0);

  useEffect(() => {
    if (product) {
      setCurrentImage(0);
      setSelectedColor(product.colors?.[0] || '');
      setSelectedSize(product.sizes?.[0] || '');
      setQuantity(1);
      setSimilarPage(0);
    }
  }, [product]);

  if (!product) return null;

  const images = (product.images || []).filter((img: string) => img.startsWith('http'));
  const isLimitedStock = product.stock > 0 && product.stock <= 10;

  const allSimilar = products.filter(p => p.id !== product.id && p.categorySlug === product.categorySlug);
  const similarProducts = allSimilar.slice(similarPage * 3, similarPage * 3 + 3);
  const totalSimilarPages = Math.ceil(allSimilar.length / 3);

  const handleAddToCart = () => {
    if (!selectedSize && product.sizes?.length > 0) { alert('Please select a size'); return; }
    addItem(product, selectedSize, selectedColor, quantity);
    onClose();
  };

  const handleBuyNow = () => {
    if (!selectedSize && product.sizes?.length > 0) { alert('Please select a size'); return; }
    addItem(product, selectedSize, selectedColor, quantity);
    navigate('/checkout');
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6">
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={onClose} />

        <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }}
          exit={{ opacity:0, scale:0.95 }}
          className="relative bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto z-10">

          <button onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 hover:bg-white shadow-sm">
            <X size={18} className="text-warm-gray" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">

            {/* ── Images ── */}
            <div className="relative">
              <div className="relative aspect-[3/4] overflow-hidden rounded-t-3xl md:rounded-tr-none md:rounded-l-3xl bg-blush-light/20"
                onTouchStart={e => { touchStartX.current = e.targetTouches[0].clientX; }}
                onTouchEnd={e => {
                  const diff = touchStartX.current - e.changedTouches[0].clientX;
                  if (Math.abs(diff) > 50) {
                    if (diff > 0) setCurrentImage(i => Math.min(i + 1, images.length - 1));
                    else setCurrentImage(i => Math.max(i - 1, 0));
                  }
                }}>
                <AnimatePresence mode="wait">
                  {images[currentImage] && (
                    <motion.img key={currentImage} src={images[currentImage]} alt={product.name}
                      initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}
                      transition={{ duration:0.3 }} className="w-full h-full object-cover" />
                  )}
                </AnimatePresence>

                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  {product.isOnSale && <Badge variant="sale">Sale</Badge>}
                  {product.isNewArrival && <Badge variant="new">New</Badge>}
                  {isLimitedStock && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      Limited Stock
                    </span>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_,i) => (
                      <button key={i} onClick={() => setCurrentImage(i)}
                        className={`rounded-full transition-all duration-300 ${i === currentImage ? 'bg-white w-5 h-2' : 'bg-white/50 w-2 h-2'}`} />
                    ))}
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setCurrentImage(i)}
                      className={`flex-shrink-0 w-14 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === currentImage ? 'border-rose-gold' : 'border-transparent opacity-60'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Details ── */}
            <div className="p-5 flex flex-col gap-4">
              <div>
                <p className="text-xs text-warm-gray mb-0.5">{product.category}</p>
                <h2 className="heading-serif text-xl font-semibold text-charcoal mb-2">{product.name}</h2>
                <PriceDisplay price={product.price} comparePrice={product.comparePrice} size="lg" />
              </div>

              {/* Colors */}
              {product.colors?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-charcoal mb-2">
                    Color: <span className="text-warm-gray font-normal">{selectedColor}</span>
                  </p>
                  <div className="flex gap-2.5 flex-wrap">
                    {product.colors.map((color: string) => {
                      const hex = resolveQVColor(color);
                      const isSel = selectedColor === color;
                      return (
                        <button key={color} onClick={() => setSelectedColor(color)} title={color}
                          className="rounded-full transition-all duration-200"
                          style={{
                            width: isSel ? '34px' : '26px', height: isSel ? '34px' : '26px',
                            backgroundColor: hex,
                            border: isSel ? '3px solid #B07D6B' : '2px solid #d1b0a0',
                            boxShadow: isSel ? '0 0 0 2px white, 0 0 0 4px #B07D6B' : 'none',
                            transform: isSel ? 'scale(1.15)' : 'scale(1)',
                          }} />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {product.sizes?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-charcoal">
                      Size: <span className="text-warm-gray font-normal">{selectedSize}</span>
                    </p>
                    <button onClick={() => setShowSizeGuide(true)}
                      className="text-xs text-rose-gold hover:underline">Size Guide</button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {product.sizes.map((size: string) => (
                      <button key={size} onClick={() => setSelectedSize(size)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          selectedSize === size
                            ? 'bg-rose-gold text-white border-rose-gold'
                            : 'border-blush/40 text-warm-gray hover:border-rose-gold hover:text-rose-gold'
                        }`}>{size}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <p className="text-sm font-medium text-charcoal mb-2">Quantity</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-full border border-blush/40 flex items-center justify-center hover:border-rose-gold text-warm-gray hover:text-rose-gold transition-colors">−</button>
                  <span className="text-sm font-medium w-6 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)}
                    className="w-8 h-8 rounded-full border border-blush/40 flex items-center justify-center hover:border-rose-gold text-warm-gray hover:text-rose-gold transition-colors">+</button>
                  {isLimitedStock && (
                    <span className="text-xs text-orange-600 font-medium">⚠ মাত্র {product.stock}টি বাকি!</span>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button onClick={handleBuyNow}
                  className="flex-1 py-3 bg-rose-gold text-white rounded-xl text-sm font-medium hover:bg-deep-rose transition-colors flex items-center justify-center gap-2">
                  <ShoppingBag size={16} /> Buy Now
                </button>
                <button onClick={handleAddToCart}
                  className="flex-1 py-3 border-2 border-rose-gold text-rose-gold rounded-xl text-sm font-medium hover:bg-rose-gold hover:text-white transition-all">
                  Add to Bag
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blush/20">
                {[
                  { icon: '🚚', label: 'দ্রুত ডেলিভারি' },
                  { icon: '✅', label: '১০০% অরিজিনাল' },
                  { icon: '🔒', label: 'নিরাপদ পেমেন্ট' },
                ].map(b => (
                  <div key={b.label} className="flex flex-col items-center gap-1 text-center">
                    <span className="text-lg">{b.icon}</span>
                    <span className="text-[10px] text-warm-gray">{b.label}</span>
                  </div>
                ))}
              </div>

              {/* You May Also Like */}
              {allSimilar.length > 0 && (
                <div className="border-t border-blush/20 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-charcoal">You May Also Like</p>
                    <div className="flex gap-1">
                      <button onClick={() => setSimilarPage(p => Math.max(0, p - 1))}
                        disabled={similarPage === 0}
                        className="w-7 h-7 rounded-full border border-blush/40 flex items-center justify-center disabled:opacity-30 hover:border-rose-gold transition-colors">
                        <ArrowLeft size={12} />
                      </button>
                      <button onClick={() => setSimilarPage(p => Math.min(totalSimilarPages - 1, p + 1))}
                        disabled={similarPage >= totalSimilarPages - 1}
                        className="w-7 h-7 rounded-full border border-blush/40 flex items-center justify-center disabled:opacity-30 hover:border-rose-gold transition-colors">
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {similarProducts.map(p => (
                      <div key={p.id} onClick={() => { navigate(`/product/${p.slug}`); onClose(); }}
                        className="cursor-pointer group">
                        <div className="aspect-[3/4] rounded-xl overflow-hidden mb-1 bg-blush-light/30">
                          {p.images?.[0]?.startsWith('http') ? (
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full bg-blush-light" />
                          )}
                        </div>
                        <p className="text-xs text-charcoal line-clamp-1">{p.name}</p>
                        <p className="text-xs text-rose-gold font-medium">৳{p.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {showSizeGuide && <SizeGuidePopup onClose={() => setShowSizeGuide(false)} />}
    </>
  );
};
// ==========================================
// NEW ARRIVALS
// ==========================================
export const NewArrivals: React.FC = () => {
  const { products, fetchProducts } = useProductStore();
  const navigate = useNavigate();
 
  const CARD_WIDTH = 380 + 24;
  const newItems = products.filter((p) => p.isNewArrival);
  const allSlides = [...newItems, ...newItems, ...newItems];
 
  const { trackRef, isPausedRef, handlePrev, handleNext } = useAutoScroll(
    newItems.length,
    CARD_WIDTH,
    1.2,   // ← speed
    true   // ← true = left to right
  );
 
  useEffect(() => { fetchProducts(); }, []);
 
  return (
   <section className="py-8 md:py-12 overflow-hidden" style={{ backgroundColor: '#FAF7F3' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeader title="New Arrivals" subtitle="Fresh styles just landed — be the first to discover them" />
        </FadeIn>
      </div>
 
      {newItems.length === 0 ? (
        <div className="text-center py-16 text-warm-gray">
          <p>No new arrivals yet. Mark products as "New Arrival" in the admin panel.</p>
        </div>
      ) : (
        <div className="relative mt-10">
          <div
            className="overflow-hidden"
            onMouseEnter={() => { isPausedRef.current = true; }}
            onMouseLeave={() => { isPausedRef.current = false; }}
            onTouchStart={() => { isPausedRef.current = true; }}
            onTouchEnd={() => { isPausedRef.current = false; }}
          >
            <div ref={trackRef} className="flex gap-6 will-change-transform" style={{ width: 'max-content' }}>
              {allSlides.map((product, idx) => (
                <motion.div
                  key={`${product.id}-${idx}`}
                  whileHover={{ y: -4 }}
                  onClick={() => navigate(`/product/${product.slug}`)}
                  className="flex-shrink-0 w-[380px] group cursor-pointer rounded-2xl overflow-hidden transition-all duration-300"
style={{ backgroundColor: '#FFFFFF' }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-blush-light/30">
                    {product.images?.[0]?.startsWith('http') ? (
                      <img src={product.images[0]} alt={product.name} loading={idx < 6 ? 'eager' : 'lazy'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blush via-lavender to-champagne" />
                    )}
                  </div>
                  <div className="p-5">
                    <Badge variant="new" className="mb-2">New Arrival</Badge>
                    <h3 className="heading-serif text-xl font-semibold text-charcoal mb-1 group-hover:text-rose-gold transition-colors">{product.name}</h3>
                    <p className="text-sm text-warm-gray mb-3">{product.shortDescription}</p>
                    <PriceDisplay price={product.price} comparePrice={product.comparePrice} />
                  </div>
                  {showQuickView && (
        <QuickViewModal product={product} onClose={() => setShowQuickView(false)} />
      )}
                </motion.div>
              ))}
            </div>
          </div>
          <button onClick={handlePrev} aria-label="Previous" className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200">
            <ArrowLeft size={18} className="text-charcoal" />
          </button>
          <button onClick={handleNext} aria-label="Next" className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200">
            <ArrowRight size={18} className="text-charcoal" />
          </button>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-blush-light/60 to-transparent z-[5]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-champagne/60 to-transparent z-[5]" />
        </div>
      )}
    </section>
  );
};