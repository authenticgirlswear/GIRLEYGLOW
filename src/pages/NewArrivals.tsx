import React, { useState, useEffect } from 'react';
import { Clock, ShoppingBag } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  category: string;
  badge?: string;
  discountPercentage?: number;
}

// Mock data: Replace with actual API data
const SALE_PRODUCTS: Product[] = [
  { id: 101, name: "Linen Tailored Blazer", price: 145, oldPrice: 290, image: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=800&q=80", category: "Outerwear", badge: "Limited", discountPercentage: 50 },
  { id: 102, name: "Satin Midi Skirt", price: 85, oldPrice: 120, image: "https://images.unsplash.com/photo-1583391265517-355bf802613b?w=800&q=80", category: "Bottoms", discountPercentage: 30 },
  { id: 103, name: "Ribbed Knit Sweater", price: 95, oldPrice: 160, image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80", category: "Tops", badge: "Almost Gone", discountPercentage: 40 },
  { id: 104, name: "Leather Crossbody Bag", price: 210, oldPrice: 350, image: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800&q=80", category: "Accessories", discountPercentage: 40 },
];

const Sale: React.FC = () => {
  // Simple Countdown Timer Logic
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[#FAF9F7] min-h-screen text-stone-900 pb-20">
      
      {/* Sale Hero - Deep muted blush/taupe color for luxury feel */}
      <section className="bg-[#DBCBBD] py-24 px-4 text-center">
        <h3 className="uppercase tracking-[0.4em] text-stone-100 text-sm mb-4 font-semibold">The Archive Sale</h3>
        <h1 className="font-serif text-6xl md:text-8xl text-white mb-6">Up to 50% Off</h1>
        <p className="text-stone-100 max-w-lg mx-auto mb-10 text-lg">
          Exceptional pieces, exceptional prices. Refresh your wardrobe with our curated selection of markdowns.
        </p>
        <button className="bg-white text-stone-900 px-10 py-4 uppercase tracking-widest text-sm hover:bg-stone-900 hover:text-white transition-colors duration-300">
          Shop The Sale
        </button>
      </section>

      {/* Discount Highlight Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: '20% OFF', desc: 'Everyday Essentials' },
            { title: '30% OFF', desc: 'Dresses & Tailoring' },
            { title: '50% OFF', desc: 'Final Few' }
          ].map((card, i) => (
            <div key={i} className="bg-white shadow-xl shadow-stone-200/50 p-8 text-center border border-stone-100 hover:-translate-y-2 transition-transform duration-300 cursor-pointer">
              <h4 className="font-serif text-2xl text-stone-800 mb-2">{card.title}</h4>
              <p className="text-sm text-stone-500 uppercase tracking-widest">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Flash Sale with Countdown */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 pb-6 border-b border-stone-200 gap-6">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl text-stone-800 mb-2">Flash Sale</h2>
            <p className="text-stone-500">Selected styles only. Prices revert soon.</p>
          </div>
          
          {/* Elegant Countdown UI */}
          <div className="flex items-center gap-4 bg-red-900/5 text-red-900 px-6 py-3 rounded-sm border border-red-900/10">
            <Clock size={20} />
            <div className="flex items-center gap-2 font-serif text-xl">
              <span>{String(timeLeft.hours).padStart(2, '0')}h</span> :
              <span>{String(timeLeft.minutes).padStart(2, '0')}m</span> :
              <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
            </div>
          </div>
        </div>

        {/* Sale Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {SALE_PRODUCTS.map((product) => (
            <div key={product.id} className="group relative">
              <div className="relative overflow-hidden aspect-[3/4] bg-stone-100 mb-4">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Red Discount Badge */}
                {product.discountPercentage && (
                  <span className="absolute top-4 left-4 bg-red-900 text-white text-xs px-3 py-1 uppercase tracking-wider font-semibold">
                    -{product.discountPercentage}%
                  </span>
                )}
                
                {/* Quick Add Overlay */}
                <div className="absolute bottom-0 left-0 w-full p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <button className="w-full bg-stone-900 text-white py-3 flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors">
                    <ShoppingBag size={18} /> <span className="text-sm uppercase tracking-wider">Quick Add</span>
                  </button>
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="font-serif text-lg text-stone-800 mb-1">{product.name}</h3>
                <div className="flex justify-center items-center gap-3">
                  {product.oldPrice && (
                    <span className="text-stone-400 line-through text-sm">${product.oldPrice.toFixed(2)}</span>
                  )}
                  <span className="text-red-900 font-medium">${product.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default Sale;