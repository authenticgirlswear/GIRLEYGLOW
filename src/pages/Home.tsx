/* ===================================================
   AUTHENTIC GIRLSWEAR - Home Page
   =================================================== */

import React from 'react';
import { Hero, BannerSlider, FeaturedCollection, CategoryShowcase, TrendingProducts, NewArrivals } from '@/components/home';

export const HomePage: React.FC = () => {
  return (
    <div>
      <Hero />
      <BannerSlider />
      <FeaturedCollection />
      <CategoryShowcase />
      <TrendingProducts />
      <NewArrivals />
    </div>
  );
};
