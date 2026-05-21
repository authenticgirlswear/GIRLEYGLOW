/* ===================================================
   AUTHENTIC GIRLSWEAR - Shop Page
   Enhanced: Custom hero layouts for New Arrivals & Sale
   =================================================== */

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3X3, Grid2X2, SlidersHorizontal, Sparkles, Tag } from 'lucide-react';

import { ProductCard } from '@/components/home';
import { FadeIn, Button, Select } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useCategoryStore } from '@/store';


/* ─────────────────────────────────────────────
   NEW ARRIVALS HERO BANNER
   Warm blush gradient, serif headline, shimmer
───────────────────────────────────────────── */
const NewArrivalsHero: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: -16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    className="relative mb-10 rounded-3xl overflow-hidden"
    style={{ background: 'linear-gradient(135deg, #F5E6DC 0%, #EDD5C5 40%, #E8C9B8 100%)' }}
  >
    {/* Decorative circles */}
    <div
      className="absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-20"
      style={{ background: 'radial-gradient(circle, #B07D6B 0%, transparent 70%)' }}
    />
    <div
      className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-15"
      style={{ background: 'radial-gradient(circle, #C4956A 0%, transparent 70%)' }}
    />

    {/* Thin horizontal rule decoration */}
    <div className="absolute top-0 left-0 right-0 h-px opacity-30" style={{ background: '#B07D6B' }} />

    <div className="relative z-10 px-8 md:px-16 py-12 md:py-16 flex flex-col md:flex-row items-center gap-8">
      {/* Left: text */}
      <div className="flex-1 text-center md:text-left">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="h-px w-8" style={{ background: '#B07D6B' }} />
          <span
            className="text-[10px] font-semibold tracking-[0.35em] uppercase"
            style={{ color: '#B07D6B' }}
          >
            Just Arrived
          </span>
          <div className="h-px w-8" style={{ background: '#B07D6B' }} />
        </div>

        <h1
          className="font-serif text-4xl md:text-5xl lg:text-6xl font-light mb-4 leading-tight"
          style={{ color: '#2C2C2C' }}
        >
          New<br />
          <em style={{ color: '#B07D6B', fontStyle: 'italic' }}>Arrivals</em>
        </h1>

        <p className="text-sm md:text-base mb-0 max-w-xs md:max-w-sm" style={{ color: '#8C7269', lineHeight: '1.7' }}>
          Fresh pieces, curated with love. Be the first to wear what's new this season.
        </p>
      </div>

      {/* Right: decorative tag/icon cluster */}
      <div className="flex-shrink-0 hidden md:flex flex-col items-center gap-3">
        <motion.div
          animate={{ rotate: [0, 3, -3, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(176, 125, 107, 0.15)', border: '1px solid rgba(176, 125, 107, 0.3)' }}
        >
          <Sparkles size={36} style={{ color: '#B07D6B' }} />
        </motion.div>
        <span className="text-[9px] tracking-[0.3em] uppercase" style={{ color: '#B07D6B' }}>
          New Season
        </span>
      </div>
    </div>

    <div className="absolute bottom-0 left-0 right-0 h-px opacity-30" style={{ background: '#B07D6B' }} />
  </motion.div>
);


/* ─────────────────────────────────────────────
   SALE HERO BANNER
   Deep warm tone, bold serif, urgency feel
───────────────────────────────────────────── */
const SaleHero: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: -16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    className="relative mb-10 rounded-3xl overflow-hidden"
    style={{ background: 'linear-gradient(135deg, #2C1F1A 0%, #3D2820 50%, #4A3028 100%)' }}
  >
    {/* Warm glow top right */}
    <div
      className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-25"
      style={{ background: 'radial-gradient(circle, #B07D6B 0%, transparent 65%)' }}
    />
    {/* Subtle bottom left */}
    <div
      className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full opacity-15"
      style={{ background: 'radial-gradient(circle, #C4956A 0%, transparent 65%)' }}
    />

    {/* Top accent line */}
    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #B07D6B, transparent)' }} />

    <div className="relative z-10 px-8 md:px-16 py-12 md:py-16 flex flex-col md:flex-row items-center gap-8">
      {/* Left: text */}
      <div className="flex-1 text-center md:text-left">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="h-px w-8" style={{ background: '#B07D6B' }} />
          <span
            className="text-[10px] font-semibold tracking-[0.35em] uppercase"
            style={{ color: '#B07D6B' }}
          >
            Limited Time
          </span>
          <div className="h-px w-8" style={{ background: '#B07D6B' }} />
        </div>

        <h1
          className="font-serif text-4xl md:text-5xl lg:text-6xl font-light mb-4 leading-tight"
          style={{ color: '#F5E6DC' }}
        >
          The<br />
          <em style={{ color: '#B07D6B', fontStyle: 'italic' }}>Sale Edit</em>
        </h1>

        <p className="text-sm md:text-base max-w-xs md:max-w-sm" style={{ color: '#C4A898', lineHeight: '1.7' }}>
          Luxury pieces, exceptional value. Curated offers on your favourite styles — while they last.
        </p>
      </div>

      {/* Right: tag icon */}
      <div className="flex-shrink-0 hidden md:flex flex-col items-center gap-3">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(176, 125, 107, 0.2)', border: '1px solid rgba(176, 125, 107, 0.4)' }}
        >
          <Tag size={36} style={{ color: '#B07D6B' }} />
        </motion.div>
        <span className="text-[9px] tracking-[0.3em] uppercase" style={{ color: '#B07D6B' }}>
          Exclusive Offers
        </span>
      </div>
    </div>

    {/* Bottom accent line */}
    <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #B07D6B, transparent)' }} />
  </motion.div>
);


/* ─────────────────────────────────────────────
   MAIN SHOP PAGE
───────────────────────────────────────────── */
export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories } = useCategoryStore();

  const [showFilters, setShowFilters] = useState(false);
  const [gridCols, setGridCols] = useState<3 | 4>(4);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryFilter = searchParams.get('category') || '';
  const saleFilter = searchParams.get('sale') === 'true';
  const newArrivalsFilter = searchParams.get('filter') === 'new_arrivals';
  const sortFilter = searchParams.get('sort') || 'newest';
  const searchQuery = searchParams.get('q') || '';

  const [priceRange, setPriceRange] = useState<[number, number]>([299, 10000]);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(
        product => product.category === categoryFilter || product.category_slug === categoryFilter
      );
    }

    if (saleFilter) {
  filtered = filtered.filter(
    product =>
      product.isOnSale === true ||
      product.is_on_sale === true ||
      product.comparePrice != null ||
      product.compare_price != null
  );
}

    if (newArrivalsFilter) {
  filtered = filtered.filter(
    product => product.isNewArrival === true || product.is_new_arrival === true
  );
}

    filtered = filtered.filter(product => {
      const price = Number(product.price) || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    switch (sortFilter) {
      case 'price_asc':
        filtered.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case 'price_desc':
        filtered.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
    }

    return filtered;
  }, [products, searchQuery, categoryFilter, saleFilter, newArrivalsFilter, priceRange, sortFilter]);

  const updateSort = (sort: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', sort);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
    setPriceRange([299, 10000]);
    setInStockOnly(false);
  };

  const currentCategoryName = categories.find(c => c.slug === categoryFilter)?.name;

  const activeFilterCount = [
    categoryFilter,
    saleFilter || newArrivalsFilter,
    priceRange[0] > 0 || priceRange[1] < 500,
    inStockOnly,
    searchQuery,
  ].filter(Boolean).length;

  /* Page title for the standard (non-hero) header */
  const pageTitle = saleFilter
    ? 'Sale Collection'
    : newArrivalsFilter
    ? 'New Arrivals'
    : searchQuery
    ? `Search: "${searchQuery}"`
    : categoryFilter
    ? currentCategoryName || 'Shop'
    : 'Our Collection';

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Special Hero Banners ── */}
        {newArrivalsFilter && <NewArrivalsHero />}
        {saleFilter && <SaleHero />}

        {/* ── Standard Header (shown when NOT in special mode) ── */}
        {!newArrivalsFilter && !saleFilter && (
          <FadeIn>
            <div className="mb-8">
              <h1 className="heading-serif text-3xl md:text-4xl lg:text-5xl font-bold text-charcoal mb-2">
                {pageTitle}
              </h1>
              <p className="text-warm-gray">
                {filteredProducts.length}{' '}
                {filteredProducts.length === 1 ? 'piece' : 'pieces'} found
              </p>
              <div className="luxury-line mt-4 w-16" />
            </div>
          </FadeIn>
        )}

        {/* ── Piece count under hero banners ── */}
        {(newArrivalsFilter || saleFilter) && (
          <FadeIn>
            <p className="text-warm-gray text-sm mb-6 -mt-4">
              {filteredProducts.length}{' '}
              {filteredProducts.length === 1 ? 'piece' : 'pieces'} found
            </p>
          </FadeIn>
        )}

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-rose-gold text-white text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-rose-gold hover:underline">
                Clear all
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Select
              options={[
                { value: 'newest', label: 'Newest First' },
                { value: 'price_asc', label: 'Price: Low to High' },
                { value: 'price_desc', label: 'Price: High to Low' },
              ]}
              value={sortFilter}
              onChange={e => updateSort(e.target.value)}
              className="!py-2 text-sm"
            />
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setGridCols(3)}
                className={`p-2 rounded-lg ${gridCols === 3 ? 'bg-blush-light' : 'hover:bg-blush-light/50'} transition-colors`}
              >
                <Grid2X2 size={16} />
              </button>
              <button
                onClick={() => setGridCols(4)}
                className={`p-2 rounded-lg ${gridCols === 4 ? 'bg-blush-light' : 'hover:bg-blush-light/50'} transition-colors`}
              >
                <Grid3X3 size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">

          {/* ── Sidebar Filter ── */}
          <AnimatePresence>
            {showFilters && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 256, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="hidden md:block flex-shrink-0 overflow-hidden"
              >
                <div className="w-64 space-y-6">

                  <div>
                    <h3 className="text-sm font-semibold text-charcoal mb-3 uppercase tracking-wider">
                      Category
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          const p = new URLSearchParams(searchParams);
                          p.delete('category');
                          setSearchParams(p);
                        }}
                        className={`block text-sm w-full text-left px-3 py-1.5 rounded-lg transition-colors ${
                          !categoryFilter
                            ? 'bg-blush-light text-charcoal font-medium'
                            : 'text-warm-gray hover:text-charcoal'
                        }`}
                      >
                        All Categories
                      </button>

                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            const p = new URLSearchParams(searchParams);
                            p.set('category', cat.slug);
                            setSearchParams(p);
                          }}
                          className={`block text-sm w-full text-left px-3 py-1.5 rounded-lg transition-colors ${
                            categoryFilter === cat.slug
                              ? 'bg-blush-light text-charcoal font-medium'
                              : 'text-warm-gray hover:text-charcoal'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h3 className="text-sm font-semibold text-charcoal mb-3 uppercase tracking-wider">
                      Price Range
                    </h3>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min={299}
                        max={10000}
                        step={1}
                        value={priceRange[1]}
                        onChange={e => setPriceRange([299, parseInt(e.target.value)])}
                        className="w-full accent-rose-gold"
                      />
                      <div className="flex justify-between text-sm text-warm-gray">
                        <span>৳299</span>
                        <span>{priceRange[1] >= 10000 ? 'No limit' : `৳${priceRange[1]}`}</span>
                      </div>
                    </div>
                  </div>

                  {/* In Stock */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={e => setInStockOnly(e.target.checked)}
                      className="w-4 h-4 rounded accent-rose-gold"
                    />
                    <span className="text-sm text-warm-gray">In stock only</span>
                  </label>

                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* ── Products Grid ── */}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-20">
                <p className="text-warm-gray">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <h3 className="heading-serif text-2xl font-semibold text-charcoal mb-2">
                  No products found
                </h3>
                <p className="text-warm-gray mb-6">
                  {newArrivalsFilter
                    ? 'No new arrivals in the last 30 days. Check back soon!'
                    : saleFilter
                    ? 'No sale items at the moment. Check back soon!'
                    : 'Try adjusting your filters or search terms'}
                </p>
                <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
              </div>
            ) : (
              <motion.div
                layout
                className={`grid gap-4 md:gap-6 ${
                  gridCols === 3
                    ? 'grid-cols-2 md:grid-cols-3'
                    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                }`}
              >
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.3) }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};