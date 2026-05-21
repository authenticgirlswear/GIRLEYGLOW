/* ===================================================
   AUTHENTIC GIRLSWEAR - Elegant Footer
   =================================================== */

import React from 'react';
import { Link } from 'react-router-dom';
import {  MapPin, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-charcoal text-white/80">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <h2 className="heading-serif text-2xl font-bold text-white tracking-wide">
                AUTHENTIC
                <span className="block text-[10px] font-sans font-normal tracking-[0.3em] text-rose-gold-light -mt-1">
                  GIRLSWEAR
                </span>
              </h2>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Luxury feminine fashion crafted for the modern woman. 
              Every piece tells a story of elegance, confidence, and timeless beauty.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-rose-gold/30 flex items-center justify-center transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-rose-gold/30 flex items-center justify-center transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-rose-gold/30 flex items-center justify-center transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Shop</h4>
            <ul className="space-y-3">
              {['New Arrivals', 'Sale', 'Dresses', 'Nightdresses', 'Bras'].map(item => (
                <li key={item}>
                  <Link to="/shop" className="text-white/50 hover:text-rose-gold-light text-sm transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Help</h4>
            <ul className="space-y-3">
              {['Size Guide', 'Shipping Info', 'Returns & Exchanges', 'Track Order', 'FAQ', 'Privacy Policy', 'Terms of Service'].map(item => (
                <li key={item}>
                  <a href="#" className="text-white/50 hover:text-rose-gold-light text-sm transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-rose-gold-light mt-0.5 flex-shrink-0" />
                <span className="text-white/50 text-sm"> Office Dhaka mohammadpur kaderabad houding road no 6</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={16} className="text-rose-gold-light mt-0.5 flex-shrink-0" />
                <span className="text-white/50 text-sm">+880 1610-563060</span>
              </li>
            </ul>

            {/* Payment Methods */}
            <div className="mt-6">
              <h5 className="text-white/60 text-xs uppercase tracking-wider mb-3">Payment Methods</h5>
              <div className="flex gap-2">
                {['bKash', 'Nagad', 'COD'].map(method => (
                  <span key={method} className="px-3 py-1.5 bg-white/10 rounded-lg text-xs text-white/60">
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
            <p>&copy; {new Date().getFullYear()} Authentic Girlswear. All rights reserved.</p>
            <p>Designed with love for the modern woman</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
