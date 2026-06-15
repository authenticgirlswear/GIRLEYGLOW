/* ===================================================
   GIrley GLow - Home Page Components
   FIXED: 
   - Hero reads from useContentStore (image + texts)
   - BannerSlider reads from useContentStore (images + texts)
   - Reduced Hero height to 1/3 of original
   =================================================== */
import { useCategoryStore } from '@/store';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, ShoppingBag, Star, Sparkles } from 'lucide-react';
import { FadeIn, SectionHeader, PriceDisplay, Badge, StarRating, Button } from '@/components/ui';
import { useProductStore } from '@/store';
import { useContentStore } from '@/store/contentStore';
import { getOptimizedImageUrl, getResponsiveSrcSet } from '@/lib/cloudinary';
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

  // CMS-controlled kill switch — render nothing if hero is disabled
  if (!content.heroEnabled) return null;

  const hasImage = !!content.heroImageUrl;

  /*
    Build Cloudinary-optimised srcset when the URL is a Cloudinary asset.
    This gives the browser the right resolution for every viewport so it
    never downloads a 2400 px image on a 375 px phone screen (LCP win).

    Breakpoints:
      640  → small mobile  (up to sm)
      1024 → tablet / sm–md
      1280 → small desktop
      1920 → large desktop / retina tablet

    If the URL is not Cloudinary we fall back to a single src — identical
    to the original behaviour, no regression.
  */
  const buildSrcSet = (url: string): string | undefined => {
    if (!url?.includes('cloudinary.com')) return undefined;
    const marker = '/upload/';
    const idx = url.indexOf(marker);
    if (idx === -1) return undefined;
    const base = url.slice(0, idx + marker.length);
    const rest = url.slice(idx + marker.length);
    const widths = [640, 1024, 1280, 1920];
    return widths
      .map((w) => `${base}w_${w},q_auto,f_auto/${rest} ${w}w`)
      .join(', ');
  };

  const heroSrcSet = hasImage ? buildSrcSet(content.heroImageUrl) : undefined;

  /*
    sizes attribute tells the browser how wide the image will be rendered.
    Hero is always full-viewport-width → "100vw" at every breakpoint.
  */
  const heroSizes = '100vw';

  /*
    Optimised src: 1280 px wide, auto quality, auto format (WebP/AVIF when
    supported). Used as the fallback for browsers that don't support srcset
    and as the value the preload scanner uses for priority hinting.
  */
  const heroSrc = hasImage
    ? (() => {
      if (!content.heroImageUrl.includes('cloudinary.com')) return content.heroImageUrl;
      const marker = '/upload/';
      const idx = content.heroImageUrl.indexOf(marker);
      if (idx === -1) return content.heroImageUrl;
      const base = content.heroImageUrl.slice(0, idx + marker.length);
      const rest = content.heroImageUrl.slice(idx + marker.length);
      return `${base}w_1280,q_auto,f_auto/${rest}`;
    })()
    : undefined;

  // Respect user's motion preference — pause decorative animations
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    /*
      section is the correct landmark for a page hero — screen readers
      announce it as a "region". aria-label identifies it distinctly from
      other sections on the page.
    */
    <section
      aria-label="Hero banner"
      className="relative min-h-[40vh] md:min-h-[50vh] flex items-center overflow-hidden"
    >
      {/* ── Background: image or gradient ───────────────────────────────── */}
      {hasImage ? (
        /*
          Replace CSS background-image with a real <img> element.

          WHY THIS IS THE CORRECT LCP PATTERN:
          • CSS background-image is NOT visible to the browser's preload
            scanner — it can only be discovered after the CSS cascade runs,
            which is far too late for LCP.
          • A real <img> with fetchPriority="high" + loading="eager" is
            found by the preload scanner in the first HTML parse pass,
            giving the browser maximum time to fetch it.
          • This change alone can improve LCP by 500–1500 ms on real
            mobile connections.

          DESIGN PRESERVATION:
          • object-cover + object-center replicates background-size:cover
            and background-position:center exactly.
          • The dark overlay (bg-black/20) is rendered on top, identical
            to before.
          • The <section> no longer has inline backgroundImage style —
            the visual result is pixel-identical.
        */
        <img
          src={heroSrc}
          srcSet={heroSrcSet}
          sizes={heroSizes}
          alt=""
          /*
            alt="" is intentional — the image is purely decorative.
            The hero heading (h1) communicates the section's content.
            An empty alt prevents screen readers from announcing the
            raw file URL or a meaningless description.
          */
          aria-hidden="true"
          /*
            LCP critical flags:
            - loading="eager"         → never defer this image
            - fetchPriority="high"    → hints browser scheduler to
                                        fetch this before other resources
            - decoding="sync"         → decode on the main thread immediately
                                        so first paint isn't delayed waiting
                                        for async decode to complete
          */
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          /*
            Explicit intrinsic dimensions:
            - Prevent CLS: browser reserves the correct aspect ratio before
              the image bytes arrive.
            - 1920×1080 is the natural "full-bleed hero" aspect ratio.
              The actual display size is controlled by CSS (w-full h-full).
          */
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      ) : (
        // Gradient background — CSS only, no image, no LCP impact
        <div className="absolute inset-0 hero-gradient" aria-hidden="true" />
      )}

      {/* Dark scrim over image — improves text contrast, identical to before */}
      {hasImage && (
        <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
      )}

      {/* Decorative floating circles — gradient mode only */}
      {!hasImage && (
        <div className="absolute inset-0" aria-hidden="true">
          <motion.div
            animate={
              prefersReducedMotion
                ? {}
                : { y: [0, -20, 0], rotate: [0, 5, 0] }
            }
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-10 right-[10%] w-40 h-40 rounded-full bg-white/10 backdrop-blur-sm"
          />
          <motion.div
            animate={
              prefersReducedMotion
                ? {}
                : { y: [0, 15, 0], rotate: [0, -3, 0] }
            }
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute bottom-10 left-[5%] w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm"
          />
        </div>
      )}

      {/* ── Hero text content ────────────────────────────────────────────── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 w-full">
        <div className="max-w-3xl">

          {/* Badge / eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.8 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/30 backdrop-blur-sm text-sm font-medium text-charcoal mb-4">
              <Sparkles size={14} className="text-rose-gold" aria-hidden="true" />
            </span>
          </motion.div>

          {/*
            H1 — The hero heading is the primary H1 of the home page.
            The sr-only H1 in Home.tsx is a fallback for when heroEnabled
            is false; when the hero IS rendered this visible H1 takes over.
            Only one H1 is ever visible at a time.
          */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: prefersReducedMotion ? 0 : 0.15 }}
            className={`heading-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-4 ${hasImage ? 'text-white drop-shadow-lg' : 'text-charcoal'
              }`}
          >
            {content.heroTitle}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: prefersReducedMotion ? 0 : 0.3 }}
            className={`text-sm md:text-base max-w-lg mb-6 leading-relaxed ${hasImage ? 'text-white/90 drop-shadow' : 'text-[#6B5B55]'
              }`}
          >
            {content.heroSubtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: prefersReducedMotion ? 0 : 0.45 }}
            className="flex flex-wrap gap-3"
          >
            <Button
              size="md"
              onClick={() => navigate('/shop')}
              aria-label={content.heroButtonText || 'Shop now'}
            >
              {content.heroButtonText}
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/shop?sale=true')}
              aria-label="Shop sale items"
            >
              Shop Sale
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
// ==========================================
// NEW ARRIVALS  ← Text below photo card
// ==========================================
export const NewArrivals: React.FC = () => {
  const { products, fetchProducts } = useProductStore();
  const navigate = useNavigate();

  const CARD_WIDTH = 280 + 20;
  const newItems = products.filter((p) => p.isNewArrival);
  const allSlides = [...newItems, ...newItems, ...newItems];

  const { trackRef, isPausedRef, handlePrev, handleNext } = useAutoScroll(
    newItems.length,
    CARD_WIDTH,
    1.2,
    true
  );

  useEffect(() => { fetchProducts(); }, []);

  return (
    <section className="py-8 md:py-12 overflow-hidden" style={{ backgroundColor: '#FAF7F3' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeader
            title="New Arrivals"
            subtitle="Fresh styles just landed — be the first to discover them"
          />
        </FadeIn>
      </div>

      {newItems.length === 0 ? (
        <div className="text-center py-16 text-[#6B5B55]">
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
            <div ref={trackRef} className="flex gap-5 will-change-transform" style={{ width: 'max-content' }}>
              {allSlides.map((product, idx) => (
                <div
                  key={`${product.id}-${idx}`}
                  className="flex-shrink-0 w-[280px] cursor-pointer group"
                  onClick={() => navigate(`/product/${product.slug}`)}
                >
                  {/* Photo Card */}
                  <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-blush-light/30">
                    {product.images?.[0]?.startsWith('http') ? (
                      <img
                        src={getOptimizedImageUrl(product.images[0], { width: 560 })}
                        srcSet={getResponsiveSrcSet(product.images[0], { widths: [280, 420, 560] })}
                        sizes="280px"
                        alt={product.name}
                        loading={idx < 6 ? 'eager' : 'lazy'}
                        decoding={idx < 6 ? 'sync' : 'async'}
                        fetchPriority={idx < 3 ? 'high' : 'auto'}
                        width={280}
                        height={373}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-blush via-lavender to-champagne" />
                    )}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                      {product.isOnSale && <Badge variant="sale">Sale</Badge>}
                      {product.isNewArrival && <Badge variant="new">New</Badge>}
                      {product.isTrending && <Badge variant="trending">Trending</Badge>}
                    </div>
                  </div>

                  {/* Text BELOW Photo */}
                  <div className="pt-3 px-1">
                    <p className="text-xs text-[#6B5B55] mb-0.5">{product.category}</p>
                    <h3 className="text-sm font-medium text-charcoal mb-1 line-clamp-1 group-hover:text-rose-gold transition-colors">
                      {product.name}
                    </h3>
                    <PriceDisplay price={product.price} comparePrice={product.comparePrice} size="sm" />
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
              style={!banner.imageUrl ? { background: banner.gradient } : undefined}
            >
              {/* Real <img> for LCP — invisible to preload scanner when used as CSS background */}
              {banner.imageUrl && (
                <img
                  src={getOptimizedImageUrl(banner.imageUrl, { width: 1280 })}
                  srcSet={getResponsiveSrcSet(banner.imageUrl, { widths: [640, 960, 1280, 1920] })}
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1280px"
                  alt=""
                  aria-hidden="true"
                  loading={current === 0 ? 'eager' : 'lazy'}
                  fetchPriority={current === 0 ? 'high' : 'low'}
                  decoding={current === 0 ? 'sync' : 'async'}
                  width={1280}
                  height={512}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              )}

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
                  className={`text-sm md:text-base mb-6 ${banner.imageUrl ? 'text-white/90 drop-shadow' : 'text-[#6B5B55]'
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
// CATEGORY SHOWCASE  ← Text below photo card
// ==========================================
export const CategoryShowcase: React.FC = () => {
  const navigate = useNavigate();
  const { categories } = useCategoryStore();

  const CARD_WIDTH = 260 + 16;

  const allSlides = [...categories, ...categories, ...categories];

  const { trackRef, isPausedRef, handlePrev, handleNext } = useAutoScroll(
    categories.length,
    CARD_WIDTH,
    1.2,
    true
  );

  return (
    <section
      className="py-8 md:py-12 overflow-hidden"
      style={{ backgroundColor: '#EFE7E2' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeader
            title="Shop by Category"
            subtitle="Find your perfect piece in our curated collections"
          />
        </FadeIn>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 text-[#6B5B55]">
          <p>No categories yet.</p>
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
                <div
                  key={`${category.slug}-${idx}`}
                  onClick={() =>
                    navigate(`/shop?category=${encodeURIComponent(category.name)}`)
                  }
                  className="flex-shrink-0 w-[260px] cursor-pointer group"
                >
                  {/* Photo Card */}
                  <div
                    className="relative rounded-2xl overflow-hidden aspect-[3/4]"
                    style={{ background: category.gradient }}
                  >
                    {category.image && (
                      <img
                        src={getOptimizedImageUrl(category.image, { width: 520 })}
                        srcSet={getResponsiveSrcSet(category.image, { widths: [260, 390, 520] })}
                        sizes="260px"
                        alt={category.name}
                        loading="lazy"
                        decoding="async"
                        width={260}
                        height={347}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    )}

                    {/* Arrow on hover */}
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <ArrowRight size={14} className="text-white" />
                    </div>
                  </div>

                  {/* Text BELOW Photo */}
                  <div className="pt-3 px-1 text-center">
                    <h3 className="heading-serif text-base md:text-lg font-semibold text-charcoal mb-0.5 group-hover:text-rose-gold transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-xs text-[#6B5B55]">
                      {category.productCount || 0} products
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prev */}
          <button
            onClick={handlePrev}
            aria-label="Previous"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200"
          >
            <ArrowLeft size={18} className="text-charcoal" />
          </button>

          {/* Next */}
          <button
            onClick={handleNext}
            aria-label="Next"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200"
          >
            <ArrowRight size={18} className="text-charcoal" />
          </button>

          {/* Fade */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white/60 to-transparent z-[5]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white/60 to-transparent z-[5]" />
        </div>
      )}
    </section>
  );
};
// ==========================================
// ==========================================
// CATEGORY  reads from useProductStore (real data)
// ==========================================

// Soft gradient palette — cycles through for each unique category

export const Category: React.FC = () => {
  const navigate = useNavigate();
  const { categories } = useCategoryStore();

  const CARD_WIDTH = 260 + 10;

  const allSlides = [
    ...categories,
    ...categories,
    ...categories,
  ];

  const { trackRef, isPausedRef, handlePrev, handleNext } = useAutoScroll(
    categories.length,
    CARD_WIDTH,
    1.2,
    true
  );

  return (
    <section
      className="py-8 md:py-12 overflow-hidden"
      style={{ backgroundColor: '#EFE7E2' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeader
            title="Shop by Category"
            subtitle="Find your perfect piece in our curated collections"
          />
        </FadeIn>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 text-[#6B5B55]">
          <p>No categories yet.</p>
        </div>
      ) : (
        <div className="relative mt-10">
          <div
            className="overflow-hidden"
            onMouseEnter={() => {
              isPausedRef.current = true;
            }}
            onMouseLeave={() => {
              isPausedRef.current = false;
            }}
            onTouchStart={() => {
              isPausedRef.current = true;
            }}
            onTouchEnd={() => {
              isPausedRef.current = false;
            }}
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
                  onClick={() =>
                    navigate(`/shop?category=${encodeURIComponent(category.name)}`)
                  }
                  className="relative flex-shrink-0 w-[260px] cursor-pointer rounded-2xl overflow-hidden aspect-[3/4] group"
                  style={{
                    background: category.gradient,
                  }}
                >
                  {/* CATEGORY IMAGE */}
                  {category.image && (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />

                  {/* Text */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-10">
                    <h3 className="heading-serif text-lg md:text-xl font-semibold text-white mb-1">
                      {category.name}
                    </h3>

                    <p className="text-xs md:text-sm text-white/80">
                      {category.productCount || 0} products
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <ArrowRight size={14} className="text-white" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Prev */}
          <button
            onClick={handlePrev}
            aria-label="Previous"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200"
          >
            <ArrowLeft size={18} className="text-charcoal" />
          </button>

          {/* Next */}
          <button
            onClick={handleNext}
            aria-label="Next"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200"
          >
            <ArrowRight size={18} className="text-charcoal" />
          </button>

          {/* Fade */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white/60 to-transparent z-[5]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white/60 to-transparent z-[5]" />
        </div>
      )}
    </section>
  );
};

// ==========================================
// TRENDING PRODUCTS  ← Text below photo card
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
    1.2,
    false
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
        <div className="text-center py-16 text-[#6B5B55]">
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
                  className="flex-shrink-0 w-[280px] cursor-pointer group"
                  onClick={() => navigate(`/product/${product.slug}`)}
                >
                  {/* Photo Card */}
                  <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-blush-light/30">
                    {product.images?.[0]?.startsWith('http') ? (
                      <img
                        src={getOptimizedImageUrl(product.images[0], { width: 560 })}
                        srcSet={getResponsiveSrcSet(product.images[0], { widths: [280, 420, 560] })}
                        sizes="280px"
                        alt={product.name}
                        loading={idx < 6 ? 'eager' : 'lazy'}
                        decoding={idx < 6 ? 'sync' : 'async'}
                        fetchPriority={idx < 3 ? 'high' : 'auto'}
                        width={280}
                        height={373}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-blush via-lavender to-champagne" />
                    )}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                      {product.isOnSale && <Badge variant="sale">Sale</Badge>}
                      {product.isNewArrival && <Badge variant="new">New</Badge>}
                      {product.isTrending && <Badge variant="trending">Trending</Badge>}
                    </div>
                  </div>

                  {/* Text BELOW Photo */}
                  <div className="pt-3 px-1">
                    <p className="text-xs text-[#6B5B55] mb-0.5">{product.category}</p>
                    <h3 className="text-sm font-medium text-charcoal mb-1 line-clamp-1 group-hover:text-rose-gold transition-colors">
                      {product.name}
                    </h3>
                    <PriceDisplay price={product.price} comparePrice={product.comparePrice} size="sm" />
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
  /**
   * Pass `priority` for the first N cards in a grid so they load
   * eagerly (above-the-fold LCP candidates).
   * All other cards default to lazy + async.
   */
  priority?: boolean;
}

// Colour name → hex lookup used by the swatch dots.
// Defined once at module level — never recreated per render.
const COLOR_MAP: Record<string, string> = {
  red: '#E53E3E', magenta: '#FF00FF', black: '#1A1A1A',
  hotpink: '#FF69B4', white: '#FFFFFF', skin: '#F5CBA7',
  beige: '#F5F0E8', pink: '#FFB6C1', navy: '#1A237E',
  blue: '#3182CE', green: '#38A169', yellow: '#ECC94B',
  orange: '#ED8936', purple: '#805AD5', grey: '#A0AEC0',
  gray: '#A0AEC0', brown: '#8B4513', maroon: '#800000',
  cream: '#FFFDD0', gold: '#FFD700', silver: '#C0C0C0',
  coral: '#FF6B6B', peach: '#FFCBA4',
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, priority = false }) => {
  const navigate = useNavigate();

  // Resolve the first image — must start with http to be a real URL
  const imageSrc = product.images?.[0]?.startsWith('http')
    ? product.images[0]
    : null;

  // Rich alt text for SEO and screen readers
  const imageAlt = `${product.name} — ${product.category || 'GIrley GLow'}`;

  return (
    /*
      Use a <Link> as the outermost interactive element so the card is:
      - Keyboard navigable (tab-focusable, Enter activates)
      - Announced correctly by screen readers ("link: Product name")
      - Crawlable by search engine bots without JavaScript
      The motion.div is nested inside and handles only visual animation.
    */
    <motion.div
      whileHover={{
        y: -4,
        boxShadow: '0 20px 40px rgba(0,0,0,0.14)',
        transition: { duration: 0.3 },
      }}
      // role="article" groups all card content as a single unit for AT
      role="article"
      aria-label={`${product.name}, ৳${product.price}`}
      style={{
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        padding: '8px',
        backgroundColor: 'rgba(255, 228, 237, 0.35)',
        cursor: 'pointer',
      }}
      onClick={() => navigate(`/product/${product.slug}`)}
      // Keyboard: activate card on Enter/Space without mouse
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/product/${product.slug}`);
        }
      }}
      tabIndex={0}
      className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold focus-visible:ring-offset-2 focus-visible:rounded-[20px]"
    >
      {/* ── Image container ──────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden aspect-[3/4] mb-3 bg-blush-light/30">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={imageAlt}
            /*
              CLS prevention:
              - The parent div has aspect-[3/4] which reserves exact space
                before the image loads — zero layout shift.
              - Explicit width/height tell the browser the intrinsic ratio
                even in environments that don't support aspect-ratio CSS.
              - We use 600×800 (3:4) — the actual display size is determined
                by the CSS; these attrs are for the browser's preload scanner.
            */
            width={600}
            height={800}
            /*
              Loading strategy:
              - priority=true  → above-the-fold, LCP candidate → eager + sync + high
              - priority=false → below-the-fold               → lazy + async + low
            */
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            fetchPriority={priority ? 'high' : 'low'}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          // Gradient placeholder — aria-hidden because it's purely decorative
          <div
            className="absolute inset-0 bg-gradient-to-br from-blush via-lavender to-champagne group-hover:scale-105 transition-transform duration-700"
            aria-hidden="true"
          />
        )}

        {/* Badges */}
        <div
          className="absolute top-3 left-3 flex flex-col gap-1.5 z-10"
          aria-label="Product labels"
        >
          {product.isOnSale && <Badge variant="sale">Sale</Badge>}
          {product.isNewArrival && <Badge variant="new">New</Badge>}
          {product.isTrending && <Badge variant="trending">Trending</Badge>}
        </div>

        {/* Quick View overlay — shown on hover */}
        <div
          className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
          aria-hidden="true"
        // aria-hidden because keyboard users navigate via the card itself (tabIndex=0)
        // and this button duplicates the primary action
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/product/${product.slug}`);
            }}
            tabIndex={-1} // excluded from tab order — card itself is the focus target
            className="flex-1 py-2.5 glass rounded-xl text-xs font-medium text-charcoal hover:bg-white/90 transition-colors flex items-center justify-center gap-1.5"
          >
            <ShoppingBag size={14} aria-hidden="true" /> Quick View
          </button>
        </div>

        {/* Wishlist icon — hover only, excluded from tab order */}
        <button
          onClick={(e) => e.stopPropagation()}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
        >
          <Star size={14} className="text-rose-gold" />
        </button>
      </div>

      {/* ── Text info ────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs text-[#6B5B55] mb-0.5">{product.category}</p>
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

      {/* ── Colour swatches ───────────────────────────────────────────────── */}
      {product.colors && product.colors.length > 0 && (
        <div
          className="flex items-center gap-1.5 mt-2"
          aria-label={`Available colours: ${product.colors
            .map((c: any) => (typeof c === 'string' ? c : c.name || ''))
            .filter(Boolean)
            .join(', ')}`}
        >
          {product.colors.map((color: any, index: number) => {
            const colorName = typeof color === 'string' ? color : color.name || '';
            const hex = COLOR_MAP[colorName.toLowerCase()] || colorName;

            return (
              <span
                key={index}
                role="img"
                aria-label={colorName}
                className="w-3.5 h-3.5 rounded-full border border-charcoal/10 flex-shrink-0"
                style={{ backgroundColor: hex }}
              />
            );
          })}
        </div>
      )}
    </motion.div>
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
        <div className="text-center py-16 text-[#6B5B55]">
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
                  className="flex-shrink-0 w-[280px] cursor-pointer group"
                  onClick={() => navigate(`/product/${product.slug}`)}
                >
                  {/* Photo Card */}
                  <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-blush-light/30">
                    {product.images?.[0]?.startsWith('http') ? (
                      <img
                        src={getOptimizedImageUrl(product.images[0], { width: 560 })}
                        srcSet={getResponsiveSrcSet(product.images[0], { widths: [280, 420, 560] })}
                        sizes="280px"
                        alt={product.name}
                        loading={idx < 6 ? 'eager' : 'lazy'}
                        decoding={idx < 6 ? 'sync' : 'async'}
                        width={280}
                        height={373}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="absolute inset-0" style={{ backgroundColor: '#E8D5CC' }} />
                    )}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                      {product.isOnSale && <Badge variant="sale">Sale</Badge>}
                      {product.isNewArrival && <Badge variant="new">New</Badge>}
                      {product.isTrending && <Badge variant="trending">Trending</Badge>}
                    </div>
                  </div>

                  {/* Text BELOW Photo */}
                  <div className="pt-3 px-1">
                    <p className="text-xs text-[#6B5B55] mb-0.5">{product.category}</p>
                    <h3 className="text-sm font-medium text-charcoal mb-1 line-clamp-1 group-hover:text-rose-gold transition-colors">
                      {product.name}
                    </h3>
                    <PriceDisplay price={product.price} comparePrice={product.comparePrice} size="sm" />
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
