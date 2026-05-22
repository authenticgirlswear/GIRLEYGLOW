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
import { useProductStore } from '@/store';
import { useContentStore } from '@/store/contentstore';
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

  if (!content.heroEnabled) return null;   // ← add this one line

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
              { }
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className={`heading-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-4 ${hasImage ? 'text-white drop-shadow-lg' : 'text-charcoal'
              }`}
          >
            {content.heroTitle}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className={`text-sm md:text-base max-w-lg mb-6 leading-relaxed ${hasImage ? 'text-white/90 drop-shadow' : 'text-warm-gray'
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
                  className={`heading-serif text-2xl md:text-4xl lg:text-5xl font-bold mb-3 ${banner.imageUrl ? 'text-white drop-shadow-lg' : 'text-charcoal'
                    }`}
                >
                  {banner.title}
                </h3>
                <p
                  className={`text-sm md:text-base mb-6 ${banner.imageUrl ? 'text-white/90 drop-shadow' : 'text-warm-gray'
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
                  className={`h-2.5 rounded-full transition-all duration-300 ${i === current ? 'bg-rose-gold w-8' : 'bg-white/60 w-2.5'
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
  console.log('colors raw data:', JSON.stringify(product.colors));

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
              navigate(`/product/${product.slug}`);
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
              magenta: '#FF00FF',
              black: '#1A1A1A',
              hotpink: '#FF69B4',
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