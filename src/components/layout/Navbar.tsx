/* ===================================================
   GIrley GLow - Floating Pill Navbar
   - Takes ZERO layout space — purely overlays the hero
   - Transparent outside the pill (no white gaps)
   - Full viewport width pill with tiny edge margins
   - Hide on scroll DOWN / show on scroll UP
   =================================================== */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Menu, X, ChevronDown, Heart, Package } from 'lucide-react';
import { useCartStore, useUIStore, useCategoryStore } from '@/store';
import { BRAND } from '@/config/brandingConfig';
import { CONTACT } from '@/config/contactConfig';

interface NavbarProps {
  barVisible?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ barVisible = false }) => {
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

  const { categories, loadCategories, loading: categoriesLoading } = useCategoryStore();

  const itemCount = getItemCount();

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

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
    const current = location.pathname + location.search;

    if (current === path) return true;

    if (path === '/') {
      return location.pathname === '/';
    }

    if (path === '/shop') {
      return location.pathname === '/shop' && location.search === '';
    }

    return false;
  };

  const renderCategoryLinks = (onClick?: () => void) => {
    if (categoriesLoading) {
      return (
        <p className="px-4 py-2 text-[10px] text-[#9A8880] text-center">
          Loading…
        </p>
      );
    }
    if (categories.length === 0) {
      return (
        <p className="px-4 py-2 text-[10px] text-[#9A8880] text-center">
          No categories yet
        </p>
      );
    }
    return categories.map(cat => (
      <Link
        key={cat.id}
        to={`/shop?category=${cat.slug}`}
        onClick={onClick}
        className="block px-4 py-2 text-[10px] font-semibold tracking-wider uppercase text-[#2C2C2C] hover:bg-white/60 hover:text-[#B07D6B] rounded-xl transition-all duration-200"
      >
        {cat.name}
      </Link>
    ));
  };

  return (
    <>
      {/* ── Outer fixed wrapper: shifts down by 10 when announcement bar is visible ── */}
      <div
        className={`fixed left-0 right-0 z-50 pointer-events-none ${barVisible ? 'top-10' : 'top-0'
          }`}
      >
        {/* ── Pill Navbar ── */}
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{
            y: hidden ? -120 : 0,
            opacity: hidden ? 0 : 1,
          }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="px-3 md:px-4 mt-1"
        >
          <nav
            className={`
              w-full rounded-full pointer-events-auto
              transition-all duration-500
              ${scrolled
                ? 'bg-[#cfc1b4]/85 backdrop-blur-2xl shadow-xl shadow-black/10'
                : 'bg-[#cfc1b4]/70 backdrop-blur-xl shadow-lg shadow-black/5'
              }
            `}
          >
            <div className="flex items-center justify-between h-14 md:h-16 px-5 md:px-10 lg:px-14">

              {/* Logo — pulled from brandingConfig */}
              <Link to="/" className="flex-shrink-0 group">
                <div className="flex flex-col items-start leading-none">
                  <span className="font-serif text-[22px] md:text-[22px] font-semibold tracking-[0.15em] text-[#FF5349] group-hover:text-[#B07D6B] transition-colors duration-300">
                    {BRAND.nameTop}
                  </span>
                  <span className="font-serif text-[18px] md:text-[18px] font-semibold tracking-[0.15em] text-[#2C2C2C] mt-0.5">
                    {BRAND.nameBottom}
                  </span>
                </div>
              </Link>
              {/* Desktop Nav Links + Categories — centered */}
              <div className="hidden md:flex items-center gap-5 lg:gap-8">
                {navLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`
                      text-[13px] lg:text-[14px] font-semibold tracking-[0.25em] uppercase
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

                {/* Categories dropdown — inline with nav links */}
                <div
                  className="relative"
                  onMouseEnter={() => setCategoriesOpen(true)}
                  onMouseLeave={() => setCategoriesOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setCategoriesOpen(o => !o)}
                    className={`text-[13px] lg:text-[14px] font-semibold tracking-[0.25em] uppercase transition-colors duration-300 flex items-center gap-1 py-1 ${categoriesOpen ? 'text-[#B07D6B]' : 'text-[#2C2C2C] hover:text-[#B07D6B]'}`}
                  >
                    Categories
                    <ChevronDown
                      size={12}
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
                        className="absolute top-full left-1/2 -translate-x-1/2 pt-4 z-10"
                      >
                        <div className="bg-[#F5E6DC]/95 backdrop-blur-xl rounded-2xl p-1.5 shadow-xl shadow-black/10 min-w-[180px] border border-white/50">
                          {renderCategoryLinks()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>


              {/* Right Icons */}
              <div className="flex items-center gap-0.5 md:gap-1">
                {/* Mobile menu toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-full hover:bg-white/40 transition-colors text-[#2C2C2C]"
                >
                  {mobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
                </button>

                {/* Search */}
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="p-2 rounded-full hover:bg-white/40 transition-all duration-300 text-[#2C2C2C] hover:text-[#B07D6B]"
                  aria-label="Search"
                >
                  <Search size={20} />
                </button>

                {/* Cart */}
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
                        placeholder={`Search ${BRAND.tagline ?? 'dresses, tops, accessories'}...`}
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
      </div >
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
                {/* Mobile drawer header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col items-start leading-none">
                    <span className="font-serif text-sm font-semibold tracking-[0.2em] text-[#2C2C2C]">
                      {BRAND.nameTop}
                    </span>
                    <span className="font-serif text-[8px] font-normal tracking-[0.5em] text-[#B07D6B] mt-0.5">
                      {BRAND.nameBottom}
                    </span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-white/50">
                    <X size={17} />
                  </button>
                </div>

                {/* Mobile search */}
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

                {/* Main nav links */}
                <div className="space-y-0.5 mb-5">
                  {navLinks.map(link => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`block px-4 py-2.5 rounded-xl text-[10px] font-semibold tracking-[0.25em] uppercase transition-colors ${isActive(link.path)
                        ? 'bg-white/70 text-[#B07D6B]'
                        : 'text-[#2C2C2C] hover:bg-white/40'
                        }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className="h-px bg-[#2C2C2C]/10 my-4" />

                {/* Categories */}
                <p className="px-4 text-[9px] font-semibold text-[#9A8880] uppercase tracking-[0.3em] mb-2">
                  Categories
                </p>
                <div className="space-y-0.5 mb-5">
                  {renderCategoryLinks(() => setMobileMenuOpen(false))}
                </div>

                <div className="h-px bg-[#2C2C2C]/10 my-4" />

                {/* Account / utility links */}
                <p className="px-4 text-[9px] font-semibold text-[#9A8880] uppercase tracking-[0.3em] mb-2">
                  My Account
                </p>
                <div className="space-y-0.5 mb-5">
                  <Link
                    to="/wishlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-semibold tracking-[0.25em] uppercase transition-colors ${isActive('/wishlist')
                      ? 'bg-white/70 text-[#B07D6B]'
                      : 'text-[#2C2C2C] hover:bg-white/40'
                      }`}
                  >
                    <Heart size={13} />
                    Wishlist
                  </Link>

                  <Link
                    to="/track-order"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-semibold tracking-[0.25em] uppercase transition-colors ${isActive('/track-order')
                      ? 'bg-white/70 text-[#B07D6B]'
                      : 'text-[#2C2C2C] hover:bg-white/40'
                      }`}
                  >
                    <Package size={13} />
                    Track Order
                  </Link>
                </div>

                <div className="h-px bg-[#2C2C2C]/10 my-4" />

                {/* Cart */}
                <Link
                  to="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/50 hover:bg-white/70 transition-colors"
                >
                  <ShoppingBag size={16} />
                  <span className="text-[10px] font-semibold tracking-[0.22em] uppercase">
                    Shopping Bag ({itemCount})
                  </span>
                </Link>

                {/* Contact info from contactConfig */}
                {CONTACT?.phone && (
                  <>
                    <div className="h-px bg-[#2C2C2C]/10 my-4" />
                    <a
                      href={`tel:${CONTACT.phone}`}
                      className="flex items-center gap-2 px-4 py-2 text-[9px] text-[#9A8880] tracking-wider"
                    >
                      📞 {CONTACT.phone}
                    </a>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};