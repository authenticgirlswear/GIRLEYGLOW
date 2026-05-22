/* ===================================================
   AUTHENTIC GIRLSWEAR - Floating Pill Navbar
   - Takes ZERO layout space — purely overlays the hero
   - Transparent outside the pill (no white gaps)
   - Full viewport width pill with tiny edge margins
   - Hide on scroll DOWN / show on scroll UP
   =================================================== */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Menu, X, ChevronDown } from 'lucide-react';
import { useCartStore, useUIStore, useCategoryStore } from '@/store';
import { AnnouncementBar } from './AnnouncementBar';

export const Navbar: React.FC = () => {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const lastScrollY = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const getItemCount = useCartStore(s => s.getItemCount);
  const { categories } = useCategoryStore();

  const itemCount = getItemCount();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 40);

      if (currentScrollY < 60) {
        setHidden(false);
        lastScrollY.current = currentScrollY;
        return;
      }

      if (currentScrollY > lastScrollY.current + 4) {
        setHidden(true);
        setSearchOpen(false);
        setCategoriesOpen(false);
      } else if (currentScrollY < lastScrollY.current - 4) {
        setHidden(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setCategoriesOpen(false);
  }, [location.pathname, setMobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Shop', path: '/shop' },
    { label: 'New Arrivals', path: '/shop?filter=new_arrivals' },
    { label: 'Sale', path: '/shop?sale=true' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    const fullPath = location.pathname + location.search;
    if (fullPath === path) return true;
    return location.pathname.startsWith(path.split('?')[0]) && path !== '/';
  };

  return (
    <>
      {/*
        ═══════════════════════════════════════════════
        ENTIRE HEADER: fixed, full-width, zero height
        in the document flow — floats over everything.

        • position: fixed, top-0, left-0, right-0
        • NO height on this wrapper → takes ZERO space
        • pointer-events-none so hero clicks pass through
          the transparent gaps
        ═══════════════════════════════════════════════
      */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">

        {/* ── Announcement Bar ── */}
        <motion.div
          className="pointer-events-auto"
          animate={{ y: hidden ? '-100%' : 0, opacity: hidden ? 0 : 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <AnnouncementBar />
        </motion.div>

        {/* ── Pill Navbar ── */}
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{
            y: hidden ? -120 : 0,
            opacity: hidden ? 0 : 1,
          }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          /*
            px-3 md:px-4 = tiny gap so pill doesn't touch screen edges.
            mt-2 = gap between announcement bar and pill.
            Everything outside the pill is transparent.
          */
          className="px-3 md:px-4 mt-2"
        >
          <nav
            className={`
              w-full rounded-full pointer-events-auto
              transition-all duration-500
              ${scrolled
                ? 'bg-[#c4a484]/85 backdrop-blur-2xl shadow-xl shadow-black/10'
                : 'bg-[#c4a484]/70 backdrop-blur-xl shadow-lg shadow-black/5'
              }
            `}
          >
            <div className="flex items-center justify-between h-14 md:h-16 px-5 md:px-10 lg:px-14">

              {/* Logo */}
              <Link to="/" className="flex-shrink-0 group">
                <div className="flex flex-col items-start leading-none">
                  <span className="font-serif text-[22px] md:text-[22px] font-semibold tracking-[0.15em] text-[#FF5349] group-hover:text-[#B07D6B] transition-colors duration-300">
                    AUTHENTIC
                  </span>
                  <span className="font-serif text-[18px] md:text-[18px] font-semibold tracking-[0.15em] text-[#2C2C2C] mt-0.5">
                    GIRLSWEAR
                  </span>
                </div>
              </Link>

              {/* Desktop Nav Links — centered */}
              <div className="hidden md:flex items-center gap-5 lg:gap-8 absolute left-1/2 -translate-x-1/2">
                {navLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`
                      text-[10px] lg:text-[11px] font-semibold tracking-[0.25em] uppercase
                      transition-colors duration-300 hover:text-[#B07D6B] relative py-1
                      ${isActive(link.path) ? 'text-[#B07D6B]' : 'text-[#2C2C2C]'}
                    `}
                  >
                    {link.label}
                    {isActive(link.path) && (
                      <motion.span
                        layoutId="activeNavUnderline"
                        className="absolute -bottom-0.5 left-0 right-0 h-px bg-[#B07D6B]"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                ))}

                {/* Categories Dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => setCategoriesOpen(true)}
                  onMouseLeave={() => setCategoriesOpen(false)}
                >
                  <button className="text-[10px] lg:text-[11px] font-semibold tracking-[0.25em] uppercase text-[#2C2C2C] hover:text-[#B07D6B] transition-colors duration-300 flex items-center gap-1 py-1">
                    Categories
                    <ChevronDown
                      size={11}
                      className={`transition-transform duration-300 ${categoriesOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {categoriesOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="absolute top-full left-1/2 -translate-x-1/2 pt-4"
                      >
                        <div className="bg-[#F5E6DC]/95 backdrop-blur-xl rounded-2xl p-1.5 shadow-xl shadow-black/10 min-w-[180px] border border-white/50">
                          {categories.length === 0 ? (
                            <p className="px-4 py-2 text-[10px] text-[#9A8880] text-center">No categories yet</p>
                          ) : (
                            categories.map(cat => (
                              <Link
                                key={cat.id}
                                to={`/shop?category=${cat.slug}`}
                                className="block px-4 py-2 text-[10px] font-semibold tracking-wider uppercase text-[#2C2C2C] hover:bg-white/60 hover:text-[#B07D6B] rounded-xl transition-all duration-200"
                              >
                                {cat.name}
                              </Link>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Icons */}
              <div className="flex items-center gap-0.5 md:gap-1">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-full hover:bg-white/40 transition-colors text-[#2C2C2C]"
                >
                  {mobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
                </button>

                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="p-2 rounded-full hover:bg-white/40 transition-all duration-300 text-[#2C2C2C] hover:text-[#B07D6B]"
                  aria-label="Search"
                >
                  <Search size={20} />
                </button>

                <Link
                  to="/cart"
                  className="relative p-2 rounded-full hover:bg-white/40 transition-all duration-300 text-[#2C2C2C] hover:text-[#B07D6B]"
                  aria-label="Shopping bag"
                >
                  <ShoppingBag size={24} />
                  {itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#B07D6B] text-white text-[8px] font-bold rounded-full flex items-center justify-center"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </Link>
              </div>
            </div>

            {/* Expandable Search */}
            <AnimatePresence>
              {searchOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: 'easeInOut' }}
                  className="overflow-hidden border-t border-[#2C2C2C]/10"
                >
                  <form onSubmit={handleSearch} className="px-5 md:px-10 py-3">
                    <div className="relative max-w-xl mx-auto">
                      <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A8880]" />
                      <input
                        type="text"
                        placeholder="Search dresses, tops, accessories..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        autoFocus
                        className="w-full pl-10 pr-10 py-2 rounded-full bg-white/60 border border-white/70 text-xs placeholder:text-[#9A8880]/60 text-[#2C2C2C] focus:outline-none focus:ring-2 focus:ring-[#B07D6B]/25 focus:bg-white/80 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-[#F5E6DC]/60 transition-colors"
                      >
                        <X size={12} className="text-[#9A8880]" />
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </nav>
        </motion.div>

      </div>
      {/* ═══ END FIXED HEADER — zero layout space taken ═══ */}


      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#2C2C2C]/25 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-[#F5E6DC] z-[80] shadow-2xl overflow-y-auto md:hidden"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col items-start leading-none">
                    <span className="font-serif text-sm font-semibold tracking-[0.2em] text-[#2C2C2C]">AUTHENTIC</span>
                    <span className="font-serif text-[8px] font-normal tracking-[0.5em] text-[#B07D6B] mt-0.5">GIRLSWEAR</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-white/50">
                    <X size={17} />
                  </button>
                </div>

                <form onSubmit={handleSearch} className="mb-5">
                  <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A8880]" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-[#B07D6B]/15 text-xs focus:outline-none focus:ring-2 focus:ring-[#B07D6B]/20"
                    />
                  </div>
                </form>

                <div className="space-y-0.5 mb-5">
                  {navLinks.map(link => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`block px-4 py-2.5 rounded-xl text-[10px] font-semibold tracking-[0.25em] uppercase transition-colors ${isActive(link.path) ? 'bg-white/70 text-[#B07D6B]' : 'text-[#2C2C2C] hover:bg-white/40'
                        }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className="h-px bg-[#2C2C2C]/10 my-4" />

                <p className="px-4 text-[9px] font-semibold text-[#9A8880] uppercase tracking-[0.3em] mb-2">Categories</p>
                <div className="space-y-0.5 mb-5">
                  {categories.length === 0 ? (
                    <p className="px-4 py-2 text-xs text-[#9A8880]">No categories yet</p>
                  ) : (
                    categories.map(cat => (
                      <Link
                        key={cat.id}
                        to={`/shop?category=${cat.slug}`}
                        className="block px-4 py-2.5 rounded-xl text-[10px] font-semibold tracking-wider uppercase text-[#9A8880] hover:bg-white/40 hover:text-[#2C2C2C] transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))
                  )}
                </div>

                <div className="h-px bg-[#2C2C2C]/10 my-4" />

                <Link
                  to="/cart"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/50 hover:bg-white/70 transition-colors"
                >
                  <ShoppingBag size={16} />
                  <span className="text-[10px] font-semibold tracking-[0.22em] uppercase">
                    Shopping Bag ({itemCount})
                  </span>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};