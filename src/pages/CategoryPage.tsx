declare global {
  interface Window {
    dataLayer: any[];
  }
}

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronRight } from 'lucide-react';

import { ProductCard } from '@/components/home';
import { FadeIn, Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useCategoryStore } from '@/store';
import { SITE } from '@/config/siteConfig';
import { BRAND } from '@/config/brandingConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NormalisedProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  comparePrice?: number;
  images: string[];
  category: string;
  categorySlug: string;
  sizes: string[];
  colors: any[];
  stock: number;
  sku: string;
  tags: string[];
  isFeatured: boolean;
  isTrending: boolean;
  isNewArrival: boolean;
  isOnSale: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Category metadata comes from the Zustand store (loaded at app boot)
  const { categories } = useCategoryStore();

  const category = useMemo(() => {
    if (!slug) return undefined;
    return categories.find((c) => c.slug === slug);
  }, [slug, categories]);

  // ── Fetch products from Supabase ────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;

    const fetchProducts = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_slug', slug)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[CategoryPage] Supabase error:', error);
        setProducts([]);
      } else {
        setProducts(data || []);
      }

      setLoading(false);
    };

    fetchProducts();
  }, [slug]);

  // ── Normalise snake_case → camelCase for ProductCard ───────────────────────
  const normalisedProducts = useMemo<NormalisedProduct[]>(() => {
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      shortDescription: p.short_description,
      price: Number(p.price) || 0,
      comparePrice: p.compare_price ? Number(p.compare_price) : undefined,
      images: p.images || [],
      category: p.category_name || p.category || '',
      categorySlug: p.category_slug || '',
      sizes: p.sizes || [],
      colors: p.colors || [],
      stock: p.stock || 0,
      sku: p.sku || '',
      tags: p.tags || [],
      isFeatured: p.is_featured || false,
      isTrending: p.is_trending || false,
      isNewArrival: p.is_new_arrival || false,
      isOnSale: p.is_on_sale || false,
      rating: p.rating || 0,
      reviewCount: p.review_count || 0,
      createdAt: p.created_at || '',
      updatedAt: p.updated_at || '',
    }));
  }, [products]);

  // ── GTM — view_item_list ────────────────────────────────────────────────────
  useEffect(() => {
    if (normalisedProducts.length === 0) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: 'view_item_list',
      ecommerce: {
        item_list_id: `category_${slug}`,
        item_list_name: category?.name || slug || 'Category',
        items: normalisedProducts.slice(0, 20).map((product, index) => ({
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          price: product.price,
          index,
        })),
      },
    });
  }, [normalisedProducts, category?.name, slug]);

  // ── SEO data — derived from category + products ────────────────────────────
  const seoData = useMemo(() => {
    if (!category) return null;

    const canonical = `${SITE.domain}/category/${category.slug}`;

    const pageTitle = `${category.name} | ${BRAND.fullName}`;

    // Rich meta description: use category description + product count
    const countStr = !loading && normalisedProducts.length > 0
      ? ` Browse ${normalisedProducts.length} products.`
      : '';
    const metaDescription = category.description
      ? `${category.description}${countStr} Shop ${category.name} at ${BRAND.fullName} — fast delivery across Bangladesh.`
      : `Shop ${category.name} at ${BRAND.fullName}. Premium women's ${category.name.toLowerCase()} with fast delivery across Bangladesh.${countStr}`;

    // Slice to 160 chars
    const metaDescriptionTrimmed = metaDescription.length > 160
      ? metaDescription.slice(0, 157) + '...'
      : metaDescription;

    // OG image: use category image if available, else fall back to site image
    const ogImage = category.image?.startsWith('http')
      ? category.image
      : `${SITE.domain}/images/og-image.jpg`;

    // ── CollectionPage JSON-LD ─────────────────────────────────────────────────
    const collectionPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${canonical}#collectionpage`,
      name: category.name,
      description: category.description || metaDescriptionTrimmed,
      url: canonical,
      inLanguage: 'en',
      isPartOf: {
        '@type': 'WebSite',
        '@id': `${SITE.domain}/#website`,
        name: BRAND.fullName,
        url: SITE.domain,
      },
      // Main image for the collection
      ...(category.image?.startsWith('http')
        ? {
          image: {
            '@type': 'ImageObject',
            url: category.image,
            name: `${category.name} — ${BRAND.fullName}`,
          },
        }
        : {}),
      // Number of items helps Google understand collection size
      ...(!loading && normalisedProducts.length > 0
        ? { numberOfItems: normalisedProducts.length }
        : {}),
    };

    // ── ItemList JSON-LD ───────────────────────────────────────────────────────
    // Only emit when products have loaded — avoids empty lists confusing crawlers
    const itemListSchema =
      !loading && normalisedProducts.length > 0
        ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          '@id': `${canonical}#itemlist`,
          name: `${category.name} Products`,
          description: `All ${category.name} products at ${BRAND.fullName}`,
          url: canonical,
          numberOfItems: normalisedProducts.length,
          itemListElement: normalisedProducts.slice(0, 20).map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${SITE.domain}/product/${product.slug}`,
            name: product.name,
            // Include product image for richer results
            ...(product.images?.[0]?.startsWith('http')
              ? { image: product.images[0] }
              : {}),
          })),
        }
        : null;

    // ── BreadcrumbList JSON-LD ─────────────────────────────────────────────────
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${SITE.domain}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Shop',
          item: `${SITE.domain}/shop`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: category.name,
          item: canonical,
        },
      ],
    };

    return {
      canonical,
      pageTitle,
      metaDescription: metaDescriptionTrimmed,
      ogImage,
      collectionPageSchema,
      itemListSchema,
      breadcrumbSchema,
    };
  }, [category, slug, normalisedProducts, loading]);

  // ─── Not-found state ───────────────────────────────────────────────────────
  // Shown when category slug doesn't exist in the store
  if (!category) {
    return (
      <>
        <Helmet>
          <title>{`Category Not Found | ${BRAND.fullName}`}</title>
          <meta name="robots" content="noindex, follow" />
        </Helmet>

        <div className="min-h-screen pt-24 flex items-center justify-center">
          <div className="text-center">
            <h1 className="heading-serif text-3xl font-bold text-charcoal mb-4">
              Category Not Found
            </h1>
            <Link to="/shop">
              <Button>Back to Shop</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── SEO HEAD ──────────────────────────────────────────────────────── */}
      {seoData && (
        <Helmet prioritizeSeoTags>
          {/* Primary */}
          <title>{seoData.pageTitle}</title>
          <meta name="description" content={seoData.metaDescription} />
          <meta
            name="keywords"
            content={[
              category.name,
              `${category.name} Bangladesh`,
              `buy ${category.name}`,
              `${category.name} online`,
              BRAND.fullName,
              'women fashion Bangladesh',
            ].join(', ')}
          />
          <meta name="robots" content="index, follow, max-image-preview:large" />

          {/* Canonical */}
          <link rel="canonical" href={seoData.canonical} />

          {/* Open Graph — website type (categories are not products) */}
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content={BRAND.fullName} />
          <meta property="og:title" content={seoData.pageTitle} />
          <meta property="og:description" content={seoData.metaDescription} />
          <meta property="og:url" content={seoData.canonical} />
          <meta property="og:image" content={seoData.ogImage} />
          <meta property="og:image:secure_url" content={seoData.ogImage} />
          <meta property="og:image:type" content="image/jpeg" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta
            property="og:image:alt"
            content={`${category.name} collection — ${BRAND.fullName}`}
          />
          <meta property="og:locale" content="en_US" />
          <meta property="og:locale:alternate" content="bn_BD" />

          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={seoData.pageTitle} />
          <meta name="twitter:description" content={seoData.metaDescription} />
          <meta name="twitter:image" content={seoData.ogImage} />
          <meta
            name="twitter:image:alt"
            content={`${category.name} collection — ${BRAND.fullName}`}
          />

          {/* JSON-LD — CollectionPage */}
          <script type="application/ld+json">
            {JSON.stringify(seoData.collectionPageSchema)}
          </script>

          {/* JSON-LD — ItemList (only emitted after products load) */}
          {seoData.itemListSchema && (
            <script type="application/ld+json">
              {JSON.stringify(seoData.itemListSchema)}
            </script>
          )}

          {/* JSON-LD — BreadcrumbList */}
          <script type="application/ld+json">
            {JSON.stringify(seoData.breadcrumbSchema)}
          </script>
        </Helmet>
      )}

      {/* ── PAGE CONTENT ──────────────────────────────────────────────────── */}
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-sm text-[#6B5B55] mb-6"
          >
            <Link
              to="/"
              className="hover:text-rose-gold transition-colors focus-visible:outline-rose-gold"
            >
              Home
            </Link>
            <ChevronRight size={14} aria-hidden="true" />
            <Link
              to="/shop"
              className="hover:text-rose-gold transition-colors focus-visible:outline-rose-gold"
            >
              Shop
            </Link>
            <ChevronRight size={14} aria-hidden="true" />
            {/* aria-current="page" marks the active breadcrumb for screen readers */}
            <span className="text-charcoal" aria-current="page">
              {category.name}
            </span>
          </nav>

          {/* ── Hero Banner ────────────────────────────────────────────────── */}
          <FadeIn>
            <div
              className="rounded-3xl p-8 md:p-12 mb-10 min-h-[220px] flex items-center relative overflow-hidden"
              style={{ background: category.gradient }}
            >
              {/*
                Category hero image — loaded eagerly because it is
                above-the-fold and a strong LCP candidate.
                We use a background image pattern here to preserve the
                existing gradient fallback design — the img is visually
                hidden but present for SEO/accessibility alt text.
              */}
              {category.image?.startsWith('http') && (
                <img
                  src={category.image}
                  alt=""
                  aria-hidden="true"
                  loading="eager"
                  decoding="sync"
                  fetchPriority="high"
                  className="absolute inset-0 w-full h-full object-cover rounded-3xl"
                /*
                  No explicit width/height here — the container has a
                  min-height and the image fills via object-cover.
                  The parent div already reserves space so CLS is zero.
                */
                />
              )}

              {/* Dark scrim — only rendered when an image is present */}
              {category.image?.startsWith('http') && (
                <div
                  className="absolute inset-0 bg-black/30 rounded-3xl"
                  aria-hidden="true"
                />
              )}

              {/* Text content — sits above the image */}
              <div className="relative z-10">
                {/*
                  H1 — The category name is the primary heading of this page.
                  Styling is conditional: white text over images, charcoal on gradients.
                */}
                <h1
                  className={`heading-serif text-3xl md:text-5xl font-bold mb-3 ${category.image?.startsWith('http')
                    ? 'text-white drop-shadow-lg'
                    : 'text-charcoal'
                    }`}
                >
                  {category.name}
                </h1>

                {category.description && (
                  <p
                    className={`max-w-xl leading-relaxed ${category.image?.startsWith('http')
                      ? 'text-white/90 drop-shadow'
                      : 'text-[#6B5B55]'
                      }`}
                  >
                    {category.description}
                  </p>
                )}

                {/* Product count — aria-live so it updates when products load */}
                <p
                  className={`text-sm mt-4 ${category.image?.startsWith('http')
                    ? 'text-white/80'
                    : 'text-[#6B5B55]'
                    }`}
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {loading
                    ? 'Loading...'
                    : `${normalisedProducts.length} ${normalisedProducts.length === 1 ? 'product' : 'products'
                    }`}
                </p>
              </div>
            </div>
          </FadeIn>

          {/* ── Product Grid ───────────────────────────────────────────────── */}
          {loading ? (
            /*
              Loading skeleton grid — same column layout as the product grid
              so there is no layout shift when products appear.
            */
            <div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              aria-label="Loading products"
              aria-busy="true"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} aria-hidden="true">
                  <div className="rounded-2xl aspect-[3/4] bg-blush-light/40 animate-pulse" />
                  <div className="pt-3 px-1 space-y-2">
                    <div className="h-3 w-1/3 rounded bg-blush-light/60 animate-pulse" />
                    <div className="h-4 w-3/4 rounded bg-blush-light/60 animate-pulse" />
                    <div className="h-4 w-1/2 rounded bg-blush-light/60 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : normalisedProducts.length === 0 ? (
            <div className="text-center py-16">
              <h2 className="heading-serif text-2xl font-semibold text-charcoal mb-3">
                No Products Found
              </h2>
              <p className="text-[#6B5B55] mb-6">
                Products for this category will appear here.
              </p>
              <Link to="/shop">
                <Button variant="outline">Browse All Products</Button>
              </Link>
            </div>
          ) : (
            /*
              Product grid — role="list" pairs with role="listitem" on each
              FadeIn wrapper so screen readers announce "X items in list".
            */
            <ul
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 list-none p-0 m-0"
              aria-label={`${category.name} products`}
            >
              {normalisedProducts.map((product, index) => (
                <li key={product.id}>
                  <FadeIn
                    /*
                      Stagger only the first 8 cards — beyond that the
                      delay would be large enough to hurt perceived performance.
                    */
                    delay={index < 8 ? index * 0.06 : 0}
                  >
                    {/*
                      First 4 cards are above-the-fold on most screens.
                      priority=true → eager + sync + fetchPriority="high"
                      which makes them LCP-eligible without lazy-load delay.
                    */}
                    <ProductCard product={product} priority={index < 4} />
                  </FadeIn>
                </li>
              ))}
            </ul>
          )}

        </div>
      </div>
    </>
  );
};

export default CategoryPage;
