import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import {
  Hero,
  BannerSlider,
  FeaturedCollection,
  CategoryShowcase,
  TrendingProducts,
  NewArrivals,
} from '@/components/home';
import { FadeIn, SectionHeader, PriceDisplay, Badge } from '@/components/ui';
import { useProductStore } from '@/store';
import { useRecentlyViewedStore } from '@/store/uiStore';
import { getOptimizedImageUrl } from '@/lib/cloudinary';
import { siteConfig, SITE } from '@/config/siteConfig';
import { BRAND } from '@/config/brandingConfig';
import { CONTACT } from '@/config/contactConfig';

// ─── SEO constants ────────────────────────────────────────────────────────────

const PAGE_TITLE = `${BRAND.fullName} | Premium Women's Fashion in Bangladesh`;

const PAGE_DESCRIPTION =
  'Shop Authentic Girlswear — Bangladesh\'s premium destination for push-up bras, maternity wear, shapewear, nightwear, couple nightwear, and elegant western dresses. Fast delivery across Bangladesh.';

const CANONICAL = `${SITE.domain}/`;

const OG_IMAGE =
  'https://res.cloudinary.com/dss2bt2fu/image/upload/f_auto,q_auto,w_1200,h_630,c_fill/girlswear/og-banner.jpg';

// ─── JSON-LD schemas ──────────────────────────────────────────────────────────

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE.domain}/#organization`,
  name: BRAND.fullName,
  alternateName: BRAND.nameTop + ' ' + BRAND.nameBottom,
  url: SITE.domain,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE.domain}${BRAND.logoUrl}`,
    width: 512,
    height: 512,
  },
  image: OG_IMAGE,
  description: BRAND.description,
  foundingDate: '2023',
  areaServed: {
    '@type': 'Country',
    name: 'Bangladesh',
  },
  priceRange: '৳৳',
  sameAs: [
    CONTACT.facebook,
    CONTACT.instagram,
  ].filter(Boolean),
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: CONTACT.phone,
    contactType: 'customer service',
    areaServed: 'BD',
    availableLanguage: ['Bengali', 'English'],
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Kaderabad Housing, Road No 6',
    addressLocality: 'Mohammadpur',
    addressRegion: 'Dhaka',
    addressCountry: 'BD',
  },
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE.domain}/#website`,
  name: BRAND.fullName,
  url: SITE.domain,
  inLanguage: ['en', 'bn'],
  publisher: {
    '@id': `${SITE.domain}/#organization`,
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE.domain}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': `${SITE.domain}/#webpage`,
  url: CANONICAL,
  name: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  isPartOf: { '@id': `${SITE.domain}/#website` },
  about: { '@id': `${SITE.domain}/#organization` },
  inLanguage: 'en',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: CANONICAL,
      },
    ],
  },
};

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': ['OnlineStore', 'ClothingStore'],
  '@id': `${SITE.domain}/#store`,
  name: BRAND.fullName,
  description: BRAND.description,
  url: SITE.domain,
  telephone: CONTACT.phone,
  priceRange: '৳৳',
  currenciesAccepted: 'BDT',
  paymentAccepted: 'Cash, bKash, Nagad',
  areaServed: {
    '@type': 'Country',
    name: 'Bangladesh',
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Kaderabad Housing, Road No 6',
    addressLocality: 'Mohammadpur',
    addressRegion: 'Dhaka',
    addressCountry: 'BD',
  },
  sameAs: [
    CONTACT.facebook,
    CONTACT.instagram,
  ].filter(Boolean),
  hasMap: 'https://goo.gl/maps/dhaka',
};

// ─── Recently Viewed — Skeleton card ─────────────────────────────────────────

const RecentlyViewedSkeletonCard: React.FC = () => (
  <div className="flex-shrink-0 w-[200px] sm:w-[220px]" aria-hidden="true">
    <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-blush-light/40 animate-pulse" />
    <div className="pt-3 px-1 space-y-2">
      <div className="h-3 w-1/3 rounded bg-blush-light/60 animate-pulse" />
      <div className="h-4 w-3/4 rounded bg-blush-light/60 animate-pulse" />
      <div className="h-4 w-1/2 rounded bg-blush-light/60 animate-pulse" />
    </div>
  </div>
);

// ─── Recently Viewed section ──────────────────────────────────────────────────

const RecentlyViewedProducts: React.FC = () => {
  const { products, fetchProducts, loading: { list: listLoading }, hasFetched } = useProductStore();
  const { getRecentProducts, productIds } = useRecentlyViewedStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Nothing viewed yet — render nothing (no layout shift)
  if (productIds.length === 0) return null;

  const isInitialLoading = listLoading && !hasFetched;
  const recentProducts = getRecentProducts(products, undefined, 8);

  if (!isInitialLoading && recentProducts.length === 0) return null;

  return (
    <section
      className="py-8 md:py-12 overflow-hidden"
      style={{ backgroundColor: '#FAF7F3' }}
      aria-label="Recently viewed products"
    >
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
        {/* role="list" pairs with role="listitem" for screen readers */}
        <div
          className="flex gap-4 sm:gap-5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide"
          role="list"
          aria-label="Recently viewed products"
        >
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
                  role="listitem"
                  className="flex-shrink-0 w-[200px] sm:w-[220px]"
                >
                  {/*
                      Use <Link> instead of div+onClick so keyboard users
                      and screen readers can navigate to the product.
                    */}
                  <Link
                    to={`/product/${product.slug}`}
                    className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-gold focus-visible:rounded-2xl"
                    aria-label={`${product.name} — ৳${product.price}`}
                  >
                    {/* Photo card */}
                    <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-blush-light/30">
                      {optimizedSrc ? (
                        <img
                          src={optimizedSrc}
                          alt={`${product.name} — ${product.category || BRAND.fullName}`}
                          loading="lazy"
                          decoding="async"
                          width={440}
                          height={587}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div
                          className="absolute inset-0 bg-gradient-to-br from-blush via-lavender to-champagne"
                          aria-hidden="true"
                        />
                      )}

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                        {product.isOnSale && <Badge variant="sale">Sale</Badge>}
                        {product.isNewArrival && <Badge variant="new">New</Badge>}
                        {product.isTrending && <Badge variant="trending">Trending</Badge>}
                      </div>
                    </div>

                    {/* Text below photo */}
                    <div className="pt-3 px-1">
                      <p className="text-xs text-[#6B5B55] mb-0.5">{product.category}</p>
                      {/* h3 is correct here — section already has an implicit heading via SectionHeader */}
                      <h3 className="text-sm font-medium text-charcoal mb-1 line-clamp-1 group-hover:text-rose-gold transition-colors">
                        {product.name}
                      </h3>
                      <PriceDisplay
                        price={product.price}
                        comparePrice={product.comparePrice}
                        size="sm"
                      />
                    </div>
                  </Link>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
};

// ─── Home page ────────────────────────────────────────────────────────────────

export const HomePage: React.FC = () => {
  return (
    <>
      {/* ── SEO HEAD ──────────────────────────────────────────────────────── */}
      <Helmet prioritizeSeoTags>
        {/* Primary */}
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <meta name="keywords" content={siteConfig.keywords.join(', ')} />
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />

        {/* Canonical */}
        <link rel="canonical" href={CANONICAL} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={BRAND.fullName} />
        <meta property="og:title" content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_DESCRIPTION} />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:secure_url" content={OG_IMAGE} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content={`${BRAND.fullName} — Premium Women's Fashion in Bangladesh`}
        />
        <meta property="og:locale" content="en_US" />
        <meta property="og:locale:alternate" content="bn_BD" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={PAGE_TITLE} />
        <meta name="twitter:description" content={PAGE_DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />
        <meta
          name="twitter:image:alt"
          content={`${BRAND.fullName} — Premium Women's Fashion in Bangladesh`}
        />

        {/* JSON-LD — Organization */}
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>

        {/* JSON-LD — WebSite (enables Sitelinks Search Box) */}
        <script type="application/ld+json">
          {JSON.stringify(websiteSchema)}
        </script>

        {/* JSON-LD — WebPage */}
        <script type="application/ld+json">
          {JSON.stringify(webPageSchema)}
        </script>

        {/* JSON-LD — LocalBusiness / OnlineStore */}
        <script type="application/ld+json">
          {JSON.stringify(localBusinessSchema)}
        </script>
      </Helmet>

      {/* ── PAGE CONTENT ──────────────────────────────────────────────────── */}
      {/*
        Invisible H1 for SEO — the Hero already renders a large visual
        heading via its own <h1>, but if the Hero is disabled via CMS the
        page would have no H1 at all. This hidden H1 ensures there is
        always exactly one H1 regardless of CMS state. Screen readers read
        it in document order (before the Hero) which is correct.

        If your Hero component already renders an <h1>, you can safely
        remove this and confirm the Hero's heading is always present.
      */}
      <h1 className="sr-only">{BRAND.fullName} — Premium Women's Fashion Bangladesh</h1>

      <Hero />
      <BannerSlider />
      <NewArrivals />
      <TrendingProducts />
      <FeaturedCollection />
      <CategoryShowcase />
      <RecentlyViewedProducts />
    </>
  );
};
