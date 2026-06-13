/* ===================================================
   AUTHENTIC GIRLSWEAR - Home Page
   =================================================== */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Hero, BannerSlider, FeaturedCollection, CategoryShowcase, TrendingProducts, NewArrivals } from '@/components/home';

export const HomePage: React.FC = () => {
  return (
    <div>
      <Helmet>
        <title>Authentic Girlswear | Premium Women's Fashion Bangladesh</title>
        <meta name="description" content="Shop premium push-up bras, maternity wear, shapewear, nightwear and elegant dresses. Free delivery available. Authentic Girlswear — Bangladesh's trusted women's fashion store." />
        <link rel="canonical" href="https://authentic-girlswear.vercel.app/" />
        <meta property="og:title" content="Authentic Girlswear | Premium Women's Fashion Bangladesh" />
        <meta property="og:description" content="Shop premium push-up bras, maternity wear, shapewear, nightwear and elegant dresses." />
        <meta property="og:url" content="https://authentic-girlswear.vercel.app/" />
        <meta property="og:type" content="website" />
      </Helmet>
      <Hero />
      <BannerSlider />
      <NewArrivals />
      <TrendingProducts />
      <FeaturedCollection />
      <CategoryShowcase />
    </div>
  );
};
