/* ===================================================
   GIrley GLow - New Arrivals Page
   Dedicated page for the newest collection additions
   =================================================== */

declare global { interface Window { dataLayer: any[]; } }
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3X3, Grid2X2, SlidersHorizontal, Sparkles, X } from 'lucide-react';

import { ProductCard } from '@/components/home';
import { FadeIn, Button, Select } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useCategoryStore } from '@/store';
import { useContentStore } from '@/store/contentStore';

/* ─── Fisher-Yates shuffle (returns a new array) ─── */
const shuffleArray = <T,>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/* ─────────────────────────────────────────────
   NEW ARRIVALS HERO BANNER
───────────────────────────────────────────── */
const NewArrivalsHero: React.FC<{
  banner?: { title?: string; subtitle?: string; imageUrl?: string; gradient?: string };
}> = ({ banner }) => (
  <motion.div
    initial={{ opacity: 0, y: -16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    className="relative mb-10 rounded-3xl overflow-hidden"
    style={
      banner?.imageUrl
        ? { backgroundImage: `url(${banner.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: banner?.gradient || 'linear-gradient(135deg, #F5E6DC 0%, #EDD5C5 40%, #E8C9B8 100%)' }
    }
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

    {/* Top rule */}
    <div className="absolute top-0 left-0 right-0 h-px opacity-30" style={{ background: '#B07D6B' }} />

    <div className="relative z-10 px-8 md:px-16 py-8 md:py-10 flex flex-col md:flex-row items-center gap-8">
      {/* Left: text */}
      <div className="flex-1 text-center md:text-left">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="h-px w-8" style={{ background: '#B07D6B' }} />
          <span className="text-[10px] font-semibold tracking-[0.35em] uppercase" style={{ color: '#B07D6B' }}>
            Just Arrived
          </span>
          <div className="h-px w-8" style={{ background: '#B07D6B' }} />
        </div>

        <h1
          className="font-serif text-4xl md:text-5xl lg:text-6xl font-light mb-4 leading-tight"
          style={{ color: '#2C2C2C' }}
        >
          {banner?.title || 'New Arrivals'}
        </h1>

        <p className="text-sm md:text-base mb-0 max-w-xs md:max-w-sm" style={{ color: '#8C7269', lineHeight: '1.7' }}>
          {banner?.subtitle || 'Fresh pieces, curated with love. Be the first to wear what\'s new this season.'}
        </p>
      </div>

      {/* Right: decorative icon */}
      <div className="flex-shrink-0 hidden md:flex flex-col items-center gap-3">
        <motion.div
          animate={{ rotate: [0, 3, -3, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(176, 125, 107, 0.15)', border: '1px solid rgba(176, 125, 107, 0.3)' }}
        >
          <Sparkles size={36} style={{ color: '#B07D6B' }} />
        </motion.div>
          <span className="text-[9px] tracking-[0.3em] uppercase" style={{ color: '#B07D6B' }}>New Season</span>
      </div>
    </div>

    {/* Bottom rule */}
    <div className="absolute bottom-0 left-0 right-0 h-px opacity-30" style={{ background: '#B07D6B' }} />
  </motion.div>
);

/* ─────────────────────────────────────────────
   NEW ARRIVALS PAGE
───────────────────────────────────────────── */
export const NewArrivalsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories } = useCategoryStore();
  const { content } = useContentStore();

  const [showFilters, setShowFilters] = useState(false);
  const [gridCols, setGridCols] = useState<3 | 4>(4);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryFilter = searchParams.get('category') || '';
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
      setProducts(shuffleArray(data || []));
    }
    setLoading(false);
  };

  const filteredProducts = useMemo(() => {
    // Filter specifically for new arrivals first
    let filtered = products.filter(
      product => product.isNewArrival === true || product.is_new_arrival === true
    );

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(
        product =>
          product.category_slug === categoryFilter ||
          product.category_name === categoryFilter ||
          product.category === categoryFilter
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
        // keep standard default order
        break;
    }

    return filtered;
  }, [products, searchQuery, categoryFilter, priceRange, sortFilter]);

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

  const activeFilterCount = [
    categoryFilter,
    priceRange[0] > 299 || priceRange[1] < 10000,
    inStockOnly,
    searchQuery,
  ].filter(Boolean).length;

  /* GTM DATA LAYER — view_item_list */
  useEffect(() => {
    if (filteredProducts.length === 0) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: 'view_item_list',
      ecommerce: {
        item_list_name: 'New Arrivals',
        items: filteredProducts.slice(0, 20).map((product, index) => ({
          item_id: product.id,
          item_name: product.name,
          item_category: product.category || product.category_name || '',
          price: Number(product.price) || 0,
          index: index,
        })),
      },
    });
  }, [filteredProducts]);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Special Hero Banners ── */}
        <NewArrivalsHero banner={content.newArrivalBanners?.[0]} />

        {/* ── Piece count under hero banner ── */}
        <FadeIn>
          <p className="text-[#6B5B55] text-sm mb-6 -mt-4">
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1 ? 'piece' : 'pieces'} found
          </p>
        </FadeIn>

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

        {/* ══════════════════════════════════════════════════
            MOBILE FILTER BOTTOM SHEET
        ══════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showFilters && (
            <>
              {/* Backdrop */}
              <motion.div
                key="mobile-filter-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-40 md:hidden"
                onClick={() => setShowFilters(false)}
              />

              {/* Sheet */}
              <motion.div
                key="mobile-filter-sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white rounded-t-3xl shadow-2xl max-h-[82vh] overflow-y-auto"
              >
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-gray-300" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-blush/30">
                  <span className="text-base font-semibold text-charcoal">Filters</span>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="p-1.5 rounded-full hover:bg-blush-light transition-colors"
                    aria-label="Close filters"
                  >
                    <X size={18} className="text-[#6B5B55]" />
                  </button>
                </div>

                {/* Filter content */}
                <div className="px-5 py-5 space-y-6">

                  {/* Category */}
                  <div>
                    <h3 className="text-sm font-semibold text-charcoal mb-3 uppercase tracking-wider">
                      Category
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const p = new URLSearchParams(searchParams);
                          p.delete('category');
                          setSearchParams(p);
                        }}
                        className={`text-sm px-3 py-2 rounded-xl border transition-colors text-left ${!categoryFilter
                          ? 'bg-rose-gold text-white border-rose-gold font-medium'
                          : 'border-blush/40 text-[#6B5B55] hover:border-rose-gold'
                          }`}
                      >
                        All
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            const p = new URLSearchParams(searchParams);
                            p.set('category', cat.slug);
                            setSearchParams(p);
                          }}
                          className={`text-sm px-3 py-2 rounded-xl border transition-colors text-left ${categoryFilter === cat.slug
                            ? 'bg-rose-gold text-white border-rose-gold font-medium'
                            : 'border-blush/40 text-[#6B5B55] hover:border-rose-gold'
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
                    <input
                      type="range"
                      min={299}
                      max={10000}
                      step={1}
                      value={priceRange[1]}
                      onChange={e => setPriceRange([299, parseInt(e.target.value)])}
                      className="w-full accent-rose-gold"
                    />
                    <div className="flex justify-between text-sm text-[#6B5B55] mt-1">
                      <span>৳299</span>
                      <span>{priceRange[1] >= 10000 ? 'No limit' : `৳${priceRange[1]}`}</span>
                    </div>
                  </div>

                  {/* In Stock */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={e => setInStockOnly(e.target.checked)}
                      className="w-5 h-5 rounded accent-rose-gold"
                    />
                    <span className="text-sm text-[#6B5B55]">In stock only</span>
                  </label>

                  {/* Apply / Clear */}
                  <div className="flex gap-3 pt-2 pb-safe">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="flex-1 py-3 rounded-xl border-2 border-blush/40 text-sm font-medium text-[#6B5B55] hover:border-rose-gold transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFilters(false)}
                      className="flex-1 py-3 rounded-xl bg-rose-gold text-white text-sm font-semibold hover:bg-deep-rose transition-colors"
                    >
                      Show {filteredProducts.length} Results
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="flex gap-8">

          {/* ── Desktop Sidebar Filter ── */}
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
                        type="button"
                        onClick={() => {
                          const p = new URLSearchParams(searchParams);
                          p.delete('category');
                          setSearchParams(p);
                        }}
                        className={`block text-sm w-full text-left px-3 py-1.5 rounded-lg transition-colors ${!categoryFilter
                          ? 'bg-blush-light text-charcoal font-medium'
                          : 'text-[#6B5B55] hover:text-charcoal'
                          }`}
                      >
                        All Categories
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            const p = new URLSearchParams(searchParams);
                            p.set('category', cat.slug);
                            setSearchParams(p);
                          }}
                          className={`block text-sm w-full text-left px-3 py-1.5 rounded-lg transition-colors ${categoryFilter === cat.slug
                            ? 'bg-blush-light text-charcoal font-medium'
                            : 'text-[#6B5B55] hover:text-charcoal'
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
                      <div className="flex justify-between text-sm text-[#6B5B55]">
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
                    <span className="text-sm text-[#6B5B55]">In stock only</span>
                  </label>

                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* ── Products Grid ── */}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-20">
                <p className="text-[#6B5B55]">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <h3 className="heading-serif text-2xl font-semibold text-charcoal mb-2">
                  No products found
                </h3>
                <p className="text-[#6B5B55] mb-6">
                  No new arrivals in the last 30 days. Check back soon!
                </p>
                <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
              </div>
            ) : (
              <motion.div
                layout
                className={`grid gap-4 md:gap-6 ${gridCols === 3
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
                    <ProductCard product={product} priority={index < 4} />
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
