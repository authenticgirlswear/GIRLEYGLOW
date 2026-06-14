/* ===================================================
            Home Page
   =================================================== */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hero, BannerSlider, FeaturedCollection, CategoryShowcase, TrendingProducts, NewArrivals } from '@/components/home';
import { FadeIn, SectionHeader, PriceDisplay, Badge } from '@/components/ui';
import { useProductStore } from '@/store';
import { useRecentlyViewedStore } from '@/store/uiStore';
import { getOptimizedImageUrl } from '@/lib/cloudinary';
import { siteConfig } from '@/config/siteConfig';

// ==========================================
// RECENTLY VIEWED — Skeleton Card
// ==========================================
const RecentlyViewedSkeletonCard: React.FC = () => {
  return (
    <div className="flex-shrink-0 w-[200px] sm:w-[220px]">
      <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-blush-light/40 animate-pulse" />
      <div className="pt-3 px-1 space-y-2">
        <div className="h-3 w-1/3 rounded bg-blush-light/60 animate-pulse" />
        <div className="h-4 w-3/4 rounded bg-blush-light/60 animate-pulse" />
        <div className="h-4 w-1/2 rounded bg-blush-light/60 animate-pulse" />
      </div>
    </div>
  );
};

// ==========================================
// RECENTLY VIEWED PRODUCTS SECTION
// ==========================================
const RecentlyViewedProducts: React.FC = () => {
  const { products, fetchProducts, loading, hasFetched } = useProductStore();
  const { getRecentProducts, productIds } = useRecentlyViewedStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  // Nothing has ever been viewed — don't render the section at all
  if (productIds.length === 0) return null;

  // Still loading product data for the first time — show skeletons
  const isInitialLoading = loading && !hasFetched;

  const recentProducts = getRecentProducts(products, undefined, 8);

  // Data has loaded but none of the recently viewed products could be
  // matched (e.g. they were removed/deactivated) — quietly hide the section
  if (!isInitialLoading && recentProducts.length === 0) return null;

  return (
    <section className="py-8 md:py-12 overflow-hidden" style={{ backgroundColor: '#FAF7F3' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeader
            title="Recently Viewed"
            subtitle="Pick up where you left off"
            center={false}
          />
        </FadeIn>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {isInitialLoading
            ? Array.from({ length: 4 }).map((_, idx) => (
              <RecentlyViewedSkeletonCard key={`rv-skeleton-${idx}`} />
            ))
            : recentProducts.map((product) => {
              const rawImage = product.images?.[0];
              const optimizedSrc = rawImage?.startsWith('http')
                ? getOptimizedImageUrl(rawImage, { width: 440 })
                : '';

              return (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-[200px] sm:w-[220px] cursor-pointer group"
                  onClick={() => navigate(`/product/${product.slug}`)}
                >
                  {/* Photo Card */}
                  <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-blush-light/30">
                    {optimizedSrc ? (
                      <img
                        src={optimizedSrc}
                        alt={`${product.name} — ${product.category || 'Authentic Girlswear'} product photo`}
                        loading="lazy"
                        decoding="async"
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
              );
            })}
        </div>
      </div>
    </section>
  );
};

export const HomePage: React.FC = () => {
  useEffect(() => {
    // Apply centralized site metadata to the document head
    document.title = siteConfig.defaultTitle || siteConfig.websiteName;

    const ensureMeta = (name: string, content: string) => {
      if (!content) return;
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    ensureMeta('description', siteConfig.defaultDescription);
    if (siteConfig.keywords?.length) {
      ensureMeta('keywords', siteConfig.keywords.join(', '));
    }
  }, []);

  return (
    <div>
      <Hero />
      <BannerSlider />
      <NewArrivals />
      <TrendingProducts />
      <FeaturedCollection />
      <CategoryShowcase />
      <RecentlyViewedProducts />
    </div>
  );
};