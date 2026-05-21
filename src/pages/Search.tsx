/* ===================================================
   AUTHENTIC GIRLSWEAR - Search Page
   FIXED: Now searches Supabase products via useProductStore
   =================================================== */

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search as SearchIcon } from 'lucide-react';
import { ProductCard } from '@/components/home';
import { Button, EmptyState } from '@/components/ui';
import { useProductStore } from '@/store';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(query);
  const { products, fetchProducts } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, []);

  // Sync input with URL changes (e.g. from navbar search)
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return products.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.shortDescription?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(q)))
    );
  }, [query, products]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="min-h-screen pt-12 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-gray" />
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Search for dresses, tops, skirts..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-blush/30 bg-white/80 text-lg focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold transition-all"
                autoFocus
              />
            </div>
          </form>
        </div>

        {/* Results */}
        {query && (
          <div>
            <h2 className="heading-serif text-2xl font-bold text-charcoal mb-2">
              {results.length} {results.length === 1 ? 'result' : 'results'} for "{query}"
            </h2>
            <div className="luxury-line mb-8 w-16" />

            {results.length === 0 ? (
              <EmptyState
                icon={<SearchIcon size={48} />}
                title="No results found"
                description="Try different keywords or browse our collections"
                action={<Button onClick={() => { setInputValue(''); setSearchParams({}); }}>Clear Search</Button>}
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {results.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {!query && (
          <div className="text-center py-12">
            <h2 className="heading-serif text-3xl font-bold text-charcoal mb-4">What are you looking for?</h2>
            <p className="text-warm-gray">Search for products by name, category, or style</p>
          </div>
        )}
      </div>
    </div>
  );
};