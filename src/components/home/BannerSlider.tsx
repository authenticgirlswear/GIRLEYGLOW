import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';
import { useContentStore } from '@/store/contentStore';

export const BannerSlider: React.FC = () => {
    const [current, setCurrent] = useState(0);
    const { content } = useContentStore();
    const banners = content.banners.filter((b) => b.active);
    const navigate = useNavigate();

    useEffect(() => {
        if (banners.length === 0) return;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [banners.length]);

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
                            onClick={() => setCurrent((prev) => (prev - 1 + banners.length) % banners.length)}
                            className="absolute left-8 md:left-12 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/80 transition-colors z-10"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <button
                            onClick={() => setCurrent((prev) => (prev + 1) % banners.length)}
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
