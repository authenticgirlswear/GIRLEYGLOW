/* ===================================================
   GIrley GLow - Elegant Footer
   =================================================== */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { BRAND } from '@/config/brandingConfig';
import { CONTACT } from '@/config/contactConfig';
import { SITE } from '@/config/siteConfig';

// ===================================================
// TYPES
// ===================================================

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  setCategories: (categories: Category[]) => void;
}

// ===================================================
// SUPABASE-BACKED ZUSTAND STORE
// Global singleton — all components share the same
// fetched state, so one tab re-fetch updates all.
// ===================================================

const useSupabaseCategoryStore = create<CategoryState>((set) => ({
  categories: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    set({ loading: true, error: null });

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name', { ascending: true });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    set({ categories: data ?? [], loading: false });
  },

  setCategories: (categories: Category[]) => set({ categories }),
}));

// ===================================================
// HOOK — fetch on mount + realtime sync
// ===================================================

function useCategoriesSync() {
  const { fetchCategories } = useSupabaseCategoryStore();

  useEffect(() => {
    // Initial fetch
    fetchCategories();

    // Delay subscription slightly to avoid premature-close errors
    const timer = setTimeout(() => {
      const channel = supabase
        .channel('public:categories')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'categories' },
          () => {
            fetchCategories();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchCategories]);
}

// ===================================================
// FOOTER COMPONENT
// ===================================================

export const Footer: React.FC = () => {
  const { categories, loading } = useSupabaseCategoryStore();

  // Kick off fetch + realtime subscription
  useCategoriesSync();

  // ===================================================
  // HELP LINKS — Size Guide, FAQ, Shipping Info, and
  // Track Order removed per latest design
  // ===================================================

  const helpLinks: { label: string; to: string }[] = [
    { label: 'About Us', to: '/about' },
    { label: 'Returns & Exchanges', to: '/return-policy' },
    { label: 'Contact Us', to: '/contact' },
  ];

  // ===================================================
  // LEGAL LINKS — Return Policy removed per latest design
  // ===================================================

  const legalLinks: { label: string; to: string }[] = [
    { label: 'Privacy Policy', to: '/privacy-policy' },
    { label: 'Terms & Conditions', to: '/terms' },
  ];

  return (
    <>
      <footer className="bg-charcoal text-white/80">

        {/* ===================================================
            MAIN FOOTER
        =================================================== */}

        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6 md:py-10">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* ===================================================
                BRAND COLUMN
            =================================================== */}

            <div className="lg:col-span-1">

              <Link to="/" className="inline-block mb-4">
                <h2 className="heading-serif text-2xl font-bold text-white tracking-wide">
                  {BRAND.nameTop}
                  <span className="block text-[10px] font-sans font-normal tracking-[0.3em] text-rose-gold-light -mt-1">
                    {BRAND.nameBottom}
                  </span>
                </h2>
              </Link>

              <p className="text-white/50 text-sm leading-relaxed mb-6">
                {BRAND.description ?? 'Luxury feminine fashion crafted for the modern woman. Every piece tells a story of elegance, confidence, and timeless beauty.'}
              </p>

              {/* ===================================================
                  SOCIAL ICONS — pulled from CONTACT / SITE config
              =================================================== */}

              <div className="flex items-center gap-3">

                {/* Instagram */}
                {(CONTACT.instagram ?? SITE.instagram) && (
                  <a
                    href={CONTACT.instagram ?? SITE.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-rose-gold/30 border border-white/10 hover:border-rose-gold-light/40 flex items-center justify-center transition-all duration-300 hover:scale-110"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                  </a>
                )}

                {/* Facebook */}
                {(CONTACT.facebook ?? SITE.facebook) && (
                  <a
                    href={CONTACT.facebook ?? SITE.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-rose-gold/30 border border-white/10 hover:border-rose-gold-light/40 flex items-center justify-center transition-all duration-300 hover:scale-110"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </a>
                )}

                {/* WhatsApp */}
                {(CONTACT.whatsapp ?? CONTACT.phone) && (
                  <a
                    href={`https://wa.me/${(CONTACT.whatsapp ?? CONTACT.phone ?? '').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-green-500/20 border border-white/10 hover:border-green-400/40 flex items-center justify-center transition-all duration-300 hover:scale-110"
                  >
                    <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor" className="text-white">
                      <path d="M16 0C7.163 0 0 7.163 0 16c0 2.833.737 5.49 2.027 7.8L0 32l8.418-2.004A15.954 15.954 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm8.043 22.205c-.33.928-1.944 1.77-2.664 1.88-.72.111-1.62.157-2.61-.164-.602-.19-1.374-.444-2.355-.87-4.145-1.79-6.852-5.972-7.06-6.25-.207-.277-1.687-2.244-1.687-4.28 0-2.035 1.068-3.033 1.446-3.446.378-.414.825-.518 1.1-.518.275 0 .55.003.79.014.254.012.594-.096.93.71.344.827 1.17 2.862 1.272 3.069.103.207.172.45.034.727-.138.276-.207.449-.413.69-.207.242-.435.54-.62.725-.206.206-.421.43-.181.843.24.414 1.067 1.76 2.29 2.851 1.574 1.402 2.9 1.835 3.314 2.042.413.207.655.172.896-.103.24-.276 1.033-1.205 1.308-1.618.276-.414.55-.345.928-.207.378.138 2.404 1.135 2.817 1.342.413.207.688.31.79.482.104.173.104 1.002-.226 1.93z" />
                    </svg>
                  </a>
                )}

              </div>
            </div>

            {/* ===================================================
                SHOP COLUMN — Supabase-synced categories
            =================================================== */}

            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                Shop
              </h4>

              <ul className="space-y-3">
                {loading && categories.length === 0 ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <li key={i}>
                      <span className="inline-block h-4 w-24 rounded bg-white/10 animate-pulse" />
                    </li>
                  ))
                ) : (
                  categories.map(category => (
                    <li key={category.id}>
                      <Link
                        to={`/shop?category=${category.slug}`}
                        className="text-white/50 hover:text-rose-gold-light text-sm transition-colors"
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))
                )}

                {/* Static shop shortcuts always shown below categories */}
                <li>
                  <Link to="/new-arrivals" className="text-white/50 hover:text-rose-gold-light text-sm transition-colors">
                    New Arrivals
                  </Link>
                </li>
                <li>
                  <Link to="/sale" className="text-white/50 hover:text-rose-gold-light text-sm transition-colors">
                    Sale
                  </Link>
                </li>
                <li>
                  <Link to="/wishlist" className="text-white/50 hover:text-rose-gold-light text-sm transition-colors">
                    Wishlist
                  </Link>
                </li>
              </ul>
            </div>

            {/* ===================================================
                HELP COLUMN
            =================================================== */}

            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                Help
              </h4>

              <ul className="space-y-3">
                {helpLinks.map(link => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-white/50 hover:text-rose-gold-light text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Legal links sub-section */}
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mt-6 mb-4">
                Legal
              </h4>

              <ul className="space-y-3">
                {legalLinks.map(link => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-white/50 hover:text-rose-gold-light text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ===================================================
                CONTACT COLUMN
            =================================================== */}

            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
                Contact Us
              </h4>

              <ul className="space-y-4">

                {CONTACT.address && (
                  <li className="flex items-start gap-3">
                    <MapPin size={16} className="text-rose-gold-light mt-0.5 flex-shrink-0" />
                    <span className="text-white/50 text-sm">{CONTACT.address}</span>
                  </li>
                )}

                {CONTACT.phone && (
                  <li className="flex items-start gap-3">
                    <Phone size={16} className="text-rose-gold-light mt-0.5 flex-shrink-0" />
                    <a
                      href={`tel:${CONTACT.phone}`}
                      className="text-white/50 hover:text-rose-gold-light text-sm transition-colors"
                    >
                      {CONTACT.phone}
                    </a>
                  </li>
                )}

                {CONTACT.email && (
                  <li className="flex items-start gap-3">
                    <Mail size={16} className="text-rose-gold-light mt-0.5 flex-shrink-0" />
                    <a
                      href={`mailto:${CONTACT.email}`}
                      className="text-white/50 hover:text-rose-gold-light text-sm transition-colors"
                    >
                      {CONTACT.email}
                    </a>
                  </li>
                )}

              </ul>

              {/* PAYMENT METHODS */}
              <div className="mt-6">
                <h5 className="text-white/60 text-xs uppercase tracking-wider mb-3">
                  Payment Methods
                </h5>
                <div className="flex gap-2 flex-wrap">
                  {(SITE.paymentMethods ?? ['bKash', 'Nagad', 'COD']).map(method => (
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

      </footer>
    </>
  );
};