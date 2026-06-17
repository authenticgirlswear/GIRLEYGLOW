import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { FadeIn, SectionHeader, PriceDisplay, Badge, Button } from '@/components/ui';
import { useProductStore } from '@/store';
import { useContentStore } from '@/store/contentStore';
import { getOptimizedImageUrl } from '@/lib/cloudinary';

export const FeaturedCollection: React.FC = () => {
    const { products, fetchProducts } = useProductStore();
    const { content } = useContentStore();
    const navigate = useNavigate();

    const trackRef = useRef<HTMLDivElement>(null);
    const animFrameRef = useRef<number>(0);
    const positionRef = useRef(0);
    const isPausedRef = useRef(false);

    const CARD_WIDTH = 280 + 20;
    const SPEED = 1.2;

    useEffect(() => { fetchProducts(); }, []);

    const featured = products.filter((p) => p.isFeatured);
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
        positionRef.current += CARD_WIDTH;
        if (trackRef.current) {
            trackRef.current.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            trackRef.current.style.transform = `translateX(-${positionRef.current}px)`;
        }
        setTimeout(() => {
            if (trackRef.current) trackRef.current.style.transition = 'none';
            isPausedRef.current = false;
        }, 700);
    };

    return (
        <section className="py-5 md:py-5 overflow-hidden" style={{ backgroundColor: '#F7EFEA' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <FadeIn>
                    <SectionHeader title={content.featuredTitle} subtitle={content.featuredSubtitle} />
                </FadeIn>
            </div>

            {featured.length === 0 ? (
                <div className="text-center py-16 text-[#6B5B55]">
                    <p>No featured products yet. Mark products as "Featured" in the admin panel.</p>
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
                                                src={getOptimizedImageUrl(product.images[0], { width: 360, height: 480, crop: 'fill' })}
                                                alt={product.name}
                                                loading={idx < 6 ? 'eager' : 'lazy'}
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

                                    {/* Text below photo */}
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

                    <button
                        onClick={handlePrev}
                        aria-label="Previous slide"
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200"
                    >
                        <ArrowLeft size={18} className="text-charcoal" />
                    </button>
                    <button
                        onClick={handleNext}
                        aria-label="Next slide"
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200"
                    >
                        <ArrowRight size={18} className="text-charcoal" />
                    </button>
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
