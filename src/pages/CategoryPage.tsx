/* ===================================================
   AUTHENTIC GIRLSWEAR - Category Page
   FIXED: Fetches products from Supabase directly,
   filters by category_slug column (matches admin upload)
   =================================================== */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

import { ProductCard } from '@/components/home';
import { FadeIn, Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useCategoryStore } from '@/store';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Find category metadata (name, gradient, description) from mockData
  const { categories } = useCategoryStore();

  const category = useMemo(() => {
    if (!slug) return undefined;

    return categories.find((c) => c.slug === slug);
  }, [slug, categories]);

  // Fetch products from Supabase filtered by category_slug.
  // This matches exactly how admin/products.tsx saves them:
  //   category_slug: cat?.slug || ''
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

  // Normalise Supabase snake_case fields → camelCase so ProductCard
  // receives the same shape it gets on the Shop page
  const normalisedProducts = useMemo(() => {
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

  // Category not found in mockData (bad slug in URL)
  if (!category) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="heading-serif text-3xl font-bold text-charcoal mb-4">
            Category Not Found
          </h2>
          <Link to="/shop">
            <Button>Back to Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#6B5B55] mb-6">
          <Link to="/" className="hover:text-rose-gold transition-colors">
            Home
          </Link>
          <ChevronRight size={14} />
          <Link to="/shop" className="hover:text-rose-gold transition-colors">
            Shop
          </Link>
          <ChevronRight size={14} />
          <span className="text-charcoal">{category.name}</span>
        </nav>

        {/* Hero Banner */}
        <FadeIn>
          <div
            className="rounded-3xl p-8 md:p-12 mb-10 min-h-[220px] flex items-center"
            style={{ background: category.gradient }}
          >
            <div>
              <h1 className="heading-serif text-3xl md:text-5xl font-bold text-charcoal mb-3">
                {category.name}
              </h1>
              <p className="text-[#6B5B55] max-w-xl leading-relaxed">
                {category.description}
              </p>
              <p className="text-sm text-[#6B5B55] mt-4">
                {loading ? 'Loading...' : `${normalisedProducts.length} products`}
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Products */}
        {loading ? (
          <div className="text-center py-16">
            <p className="text-[#6B5B55]">Loading products...</p>
          </div>
        ) : normalisedProducts.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="heading-serif text-2xl font-semibold text-charcoal mb-3">
              No Products Found
            </h3>
            <p className="text-[#6B5B55] mb-6">
              Products for this category will appear here.
            </p>
            <Link to="/shop">
              <Button variant="outline">Browse All Products</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {normalisedProducts.map((product, index) => (
              <FadeIn key={product.id} delay={index * 0.08}>
                <ProductCard product={product} />
              </FadeIn>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default CategoryPage;