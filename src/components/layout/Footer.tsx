/* ===================================================
   AUTHENTIC GIRLSWEAR - Elegant Footer
   WITH Luxury Animated Bra Size Guide Modal
   =================================================== */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  X,
  Sparkles,
  Ruler,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCategoryStore } from '@/store';

export const Footer: React.FC = () => {
  const { categories } = useCategoryStore();

  // ===================================================
  // SIZE GUIDE STATES
  // ===================================================

  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [bandSize, setBandSize] = useState('');
  const [bustSize, setBustSize] = useState('');
  const [result, setResult] = useState('');
  const [showResult, setShowResult] = useState(false);

  // ===================================================
  // BRA SIZE CALCULATOR
  // ===================================================

  const calculateBraSize = () => {
    const band = parseFloat(bandSize);
    const bust = parseFloat(bustSize);

    if (!band || !bust) return;

    // Round band size
    const roundedBand = Math.round(band / 2) * 2;

    // Cup calculation
    const difference = bust - band;

    const cupSizes = [
      'AA',
      'A',
      'B',
      'C',
      'D',
      'DD',
      'E',
      'F',
      'G'
    ];

    const cupIndex = Math.max(
      0,
      Math.min(Math.round(difference), cupSizes.length - 1)
    );

    const cup = cupSizes[cupIndex];

    setResult(`${roundedBand}${cup}`);
    setShowResult(true);
  };

  return (
    <>
      <footer className="bg-charcoal text-white/80">

        {/* ===================================================
            MAIN FOOTER
        =================================================== */}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* ===================================================
                BRAND COLUMN
            =================================================== */}

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
                Every piece tells a story of elegance, confidence,
                and timeless beauty.
              </p>

              {/* ===================================================
                  SOCIAL ICONS
              =================================================== */}

              <div className="flex items-center gap-3">

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/auntheticgirlswear"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-rose-gold/30 border border-white/10 hover:border-rose-gold-light/40 flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href="https://www.facebook.com/authenticgirlswear"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-rose-gold/30 border border-white/10 hover:border-rose-gold-light/40 flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/8801610563060"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-green-500/20 border border-white/10 hover:border-green-400/40 flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 32 32"
                    fill="currentColor"
                    className="text-white"
                  >
                    <path d="M16 0C7.163 0 0 7.163 0 16c0 2.833.737 5.49 2.027 7.8L0 32l8.418-2.004A15.954 15.954 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm8.043 22.205c-.33.928-1.944 1.77-2.664 1.88-.72.111-1.62.157-2.61-.164-.602-.19-1.374-.444-2.355-.87-4.145-1.79-6.852-5.972-7.06-6.25-.207-.277-1.687-2.244-1.687-4.28 0-2.035 1.068-3.033 1.446-3.446.378-.414.825-.518 1.1-.518.275 0 .55.003.79.014.254.012.594-.096.93.71.344.827 1.17 2.862 1.272 3.069.103.207.172.45.034.727-.138.276-.207.449-.413.69-.207.242-.435.54-.62.725-.206.206-.421.43-.181.843.24.414 1.067 1.76 2.29 2.851 1.574 1.402 2.9 1.835 3.314 2.042.413.207.655.172.896-.103.24-.276 1.033-1.205 1.308-1.618.276-.414.55-.345.928-.207.378.138 2.404 1.135 2.817 1.342.413.207.688.31.79.482.104.173.104 1.002-.226 1.93z"/>
                  </svg>
                </a>

              </div>
            </div>

            {/* ===================================================
                QUICK LINKS
            =================================================== */}

            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                Shop
              </h4>

              <ul className="space-y-3">
                {categories.map(category => (
                  <li key={category.id}>
                    <Link
                      to={`/shop?category=${category.slug}`}
                      className="text-white/50 hover:text-rose-gold-light text-sm transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ===================================================
                HELP SECTION
            =================================================== */}

            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                Help
              </h4>

              <ul className="space-y-3">

                {/* SIZE GUIDE BUTTON */}
                <li>
                  <button
                    onClick={() => {
                      setShowSizeGuide(true);
                      setShowResult(false);
                    }}
                    className="text-white/50 hover:text-rose-gold-light text-sm transition-colors"
                  >
                    Size Guide
                  </button>
                </li>

                {[
                  'Shipping Info',
                  'Returns & Exchanges',
                  'Track Order',
                  'FAQ',
                  'Privacy Policy',
                  'Terms of Service'
                ].map(item => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-white/50 hover:text-rose-gold-light text-sm transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* ===================================================
                CONTACT SECTION
            =================================================== */}

            <div>

              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                Contact Us
              </h4>

              <ul className="space-y-4">

                <li className="flex items-start gap-3">
                  <MapPin
                    size={16}
                    className="text-rose-gold-light mt-0.5 flex-shrink-0"
                  />

                  <span className="text-white/50 text-sm">
                    Office Dhaka mohammadpur kaderabad houding road no 6
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <Phone
                    size={16}
                    className="text-rose-gold-light mt-0.5 flex-shrink-0"
                  />

                  <span className="text-white/50 text-sm">
                    +880 1610-563060
                  </span>
                </li>
              </ul>

              {/* PAYMENT METHODS */}

              <div className="mt-6">

                <h5 className="text-white/60 text-xs uppercase tracking-wider mb-3">
                  Payment Methods
                </h5>

                <div className="flex gap-2">

                  {['bKash', 'Nagad', 'COD'].map(method => (
                    <span
                      key={method}
                      className="px-3 py-1.5 bg-white/10 rounded-lg text-xs text-white/60"
                    >
                      {method}
                    </span>
                  ))}

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            BOTTOM BAR
        =================================================== */}

        <div className="border-t border-white/10">

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">

              <p>
                &copy; {new Date().getFullYear()} Authentic Girlswear.
                All rights reserved.
              </p>

              <p>
                Designed with love for the modern woman
              </p>

            </div>
          </div>
        </div>
      </footer>

      {/* ===================================================
          SIZE GUIDE MODAL
      =================================================== */}

      <AnimatePresence>

        {showSizeGuide && (

          <motion.div
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >

            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                type: 'spring',
                damping: 18,
                stiffness: 150
              }}
              className="relative w-full max-w-md rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
            >

              {/* BACKGROUND */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#2b2b2b] via-[#3a3433] to-[#e7d6d0]" />

              {/* GLOW */}
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-rose-300/20 rounded-full blur-3xl" />

              {/* CONTENT */}
              <div className="relative p-8">

                {/* CLOSE BUTTON */}

                <button
                  onClick={() => setShowSizeGuide(false)}
                  className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
                >
                  <X size={18} />
                </button>

                {/* HEADER */}

                <div className="text-center mb-8">

                  <motion.div
                    animate={{
                      rotate: [0, 8, -8, 0]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity
                    }}
                    className="w-20 h-20 rounded-full bg-rose-200/20 backdrop-blur-md flex items-center justify-center mx-auto mb-5 border border-white/10"
                  >
                    <Ruler className="text-rose-100" size={34} />
                  </motion.div>

                  <h2 className="text-3xl font-serif text-white mb-2">
                    Find Your Perfect Fit
                  </h2>

                  <p className="text-white/60 text-sm">
                    Luxury comfort starts with the perfect size
                  </p>
                </div>

                {!showResult ? (
                  <>
                    {/* INPUTS */}

                    <div className="space-y-5">

                      {/* BAND SIZE */}

                      <div>
                        <label className="block text-sm text-white/70 mb-2">
                          Band Size (Under Bust)
                        </label>

                        <input
                          type="number"
                          placeholder="e.g. 32"
                          value={bandSize}
                          onChange={(e) => setBandSize(e.target.value)}
                          className="w-full h-14 rounded-2xl bg-white/10 border border-white/10 px-5 text-white placeholder:text-white/30 focus:outline-none focus:border-rose-200/40 transition"
                        />
                      </div>

                      {/* BUST SIZE */}

                      <div>
                        <label className="block text-sm text-white/70 mb-2">
                          Bust Size (Fullest Part)
                        </label>

                        <input
                          type="number"
                          placeholder="e.g. 36"
                          value={bustSize}
                          onChange={(e) => setBustSize(e.target.value)}
                          className="w-full h-14 rounded-2xl bg-white/10 border border-white/10 px-5 text-white placeholder:text-white/30 focus:outline-none focus:border-rose-200/40 transition"
                        />
                      </div>

                      {/* BUTTON */}

                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={calculateBraSize}
                        className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#d8b4a0] to-[#f0d9d2] text-[#2d2d2d] font-semibold tracking-wide shadow-xl mt-4"
                      >
                        Calculate My Size
                      </motion.button>

                    </div>
                  </>
                ) : (
                  <>
                    {/* RESULT */}

                    <motion.div
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center py-6"
                    >

                      {/* HEART */}

                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity
                        }}
                        className="w-24 h-24 rounded-full bg-rose-200/20 flex items-center justify-center mx-auto mb-6"
                      >
                        <Heart
                          className="text-rose-100 fill-rose-100"
                          size={42}
                        />
                      </motion.div>

                      <div className="flex justify-center mb-3">
                        <Sparkles className="text-rose-100" />
                      </div>

                      <h3 className="text-2xl font-serif text-white mb-2">
                        Congratulations!
                      </h3>

                      <p className="text-white/60 mb-6">
                        Your perfect bra size is
                      </p>

                      <motion.div
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 180
                        }}
                        className="text-6xl font-bold text-rose-100 mb-8"
                      >
                        {result}
                      </motion.div>

                      <button
                        onClick={() => {
                          setShowResult(false);
                          setBandSize('');
                          setBustSize('');
                        }}
                        className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 transition text-white"
                      >
                        Calculate Again
                      </button>

                    </motion.div>
                  </>
                )}

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};