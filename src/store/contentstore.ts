// src/store/contentStore.ts
import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';

// ─── Supabase client ──────────────────────────────────────────────────────────
// These env vars must be set in your Vercel project settings.
// They are NEXT_PUBLIC_ so they are safely available on the client.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Domain types (unchanged) ─────────────────────────────────────────────────

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  gradient: string;
  imageUrl?: string;
  active: boolean;
}

export interface AnnouncementSettings {
  enabled: boolean;
  messages: string[];
  bgColor: string;
  textColor: string;
  animation: 'marquee' | 'fade' | 'static';
  bold: boolean;
  dismissible: boolean;
}

export interface ContentData {
  heroEnabled: boolean;
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroImageUrl: string;
  featuredTitle: string;
  featuredSubtitle: string;
  trendingTitle: string;
  trendingSubtitle: string;
  newsletterTitle: string;
  newsletterSubtitle: string;
  banners: Banner[];
  announcement: AnnouncementSettings;
}

// ─── Supabase row type ────────────────────────────────────────────────────────
// Maps to: site_content (id text PK, content jsonb)

interface SiteContentRow {
  id: string;       // always 'global-content'
  content: ContentData;
}

// ─── Defaults (used as fallback when Supabase is unreachable) ─────────────────

export const defaultContent: ContentData = {
  heroEnabled: true,
  heroTitle: 'Elegance Redefined',
  heroSubtitle:
    'Discover our curated collection of authentic girlswear — where every piece tells a story of grace and style.',
  heroButtonText: 'Shop Now',
  heroImageUrl: '',
  featuredTitle: 'Featured Collection',
  featuredSubtitle: 'Hand-picked pieces for the modern woman',
  trendingTitle: 'Trending Now',
  trendingSubtitle: 'What everyone is wearing this season',
  newsletterTitle: 'Join Our World',
  newsletterSubtitle: 'Subscribe for exclusive offers and style inspiration',
  banners: [
    {
      id: '1',
      title: 'New Arrivals',
      subtitle: 'Fresh styles just dropped',
      buttonText: 'Shop Now',
      buttonLink: '/shop?sort=newest',
      gradient: 'linear-gradient(135deg, #F4C2C2, #E6E6FA, #F7E7CE)',
      active: true,
    },
    {
      id: '2',
      title: 'Sale Collection',
      subtitle: 'Up to 50% off selected items',
      buttonText: 'Shop Sale',
      buttonLink: '/shop?sale=true',
      gradient: 'linear-gradient(135deg, #B76E79, #E3BCA4, #F7E7CE)',
      active: true,
    },
  ],
  announcement: {
    enabled: true,
    messages: [
      'Free shipping on orders over $99',
      'New collection just dropped!',
      'Use code WELCOME10 for 10% off',
    ],
    bgColor: '#B76E79',
    textColor: '#FFFFFF',
    animation: 'marquee',
    bold: false,
    dismissible: true,
  },
};

// ─── Store shape ──────────────────────────────────────────────────────────────

interface ContentStore {
  /** Current live content (sourced from Supabase) */
  content: ContentData;

  /** True while the initial fetch is in-flight */
  loading: boolean;

  /** Non-null when the last fetch or save failed */
  error: string | null;

  /**
   * Fetch the single `global-content` row from Supabase and hydrate the store.
   * Falls back to `defaultContent` when the row is missing so the site never
   * renders empty.  Call this once on app mount (e.g. in _app.tsx / layout.tsx).
   */
  loadContent: () => Promise<void>;

  /**
   * Persist updated content to Supabase (upsert) and keep the local store in
   * sync.  Throws on failure so the calling UI can surface the error.
   */
  setContent: (c: ContentData) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useContentStore = create<ContentStore>((set) => ({
  content: defaultContent,
  loading: false,
  error: null,

  // ── loadContent ─────────────────────────────────────────────────────────────
  loadContent: async () => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('content')
        .eq('id', 'global-content')
        .single();

      if (error) {
        // PGRST116 = row not found — treat as "use defaults"
        if (error.code === 'PGRST116') {
          set({ content: defaultContent, loading: false });
          return;
        }
        throw new Error(error.message);
      }

      const row = data as SiteContentRow | null;

      if (!row?.content) {
        // Row exists but content column is null — use defaults
        set({ content: defaultContent, loading: false });
        return;
      }

      // Deep-merge fetched content over defaults so newly added keys are never
      // undefined for existing rows that pre-date the schema addition.
      const merged: ContentData = {
        ...defaultContent,
        ...row.content,
        announcement: {
          ...defaultContent.announcement,
          ...(data.content.announcement ?? {}),
        },
      };

      set({ content: merged, loading: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load content';
      console.error('[contentStore] loadContent error:', message);
      // Keep whatever content is already in the store (defaultContent on first
      // load) so the UI stays functional even when Supabase is unreachable.
      set({ error: message, loading: false });
    }
  },

  // ── setContent ──────────────────────────────────────────────────────────────
  setContent: async (content: ContentData) => {
    // Optimistically update local state first so the admin UI feels instant.
    set({ content, error: null });

    const { error } = await supabase
      .from('site_content')
      .upsert(
        { id: 'global-content', content } satisfies SiteContentRow,
        { onConflict: 'id' }
      );

    if (error) {
      const message = error.message;
      console.error('[contentStore] setContent error:', message);
      set({ error: message });
      // Re-throw so admin forms can display the failure to the user.
      throw new Error(message);
    }
  },
}));