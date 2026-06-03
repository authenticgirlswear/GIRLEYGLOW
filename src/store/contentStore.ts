import { create } from 'zustand';
import { supabase } from '@/lib/supabase';


// ─── Types ────────────────────────────────────────────────────────────────────

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  gradient: string;
  imageUrl: string;
  active: boolean;
}

export interface AnnouncementSettings {
  enabled: boolean;
  messages: string[];
  animation: 'marquee' | 'fade' | 'static';
  bgColor: string;
  textColor: string;
  bold: boolean;
  dismissible: boolean;
}

export interface ContentData {
  // Hero
  heroEnabled: boolean;
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroImageUrl: string;

  // Banners
  banners: Banner[];

  // New Arrival Banners
  newArrivalBanners: Banner[];

  // Sale Banners
  saleBanners: Banner[];

  // Announcement bar
  announcement: AnnouncementSettings;

  // Section titles
  featuredTitle: string;
  featuredSubtitle: string;
  trendingTitle: string;
  trendingSubtitle: string;
  newsletterTitle: string;
  newsletterSubtitle: string;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const defaultContent: ContentData = {
  heroEnabled: true,
  heroTitle: 'Discover Your Style',
  heroSubtitle: 'Explore our curated collection of girlswear — designed for confidence, comfort, and elegance.',
  heroButtonText: 'Shop Now',
  heroImageUrl: '',

  banners: [],
  newArrivalBanners: [],
  saleBanners: [],
  announcement: {
    enabled: true,
    messages: ['Free shipping on orders over $50!'],
    animation: 'marquee',
    bgColor: '#000000',
    textColor: '#ffffff',
    bold: false,
    dismissible: false,
  },

  featuredTitle: 'Featured Collection',
  featuredSubtitle: 'Handpicked styles just for you',
  trendingTitle: 'Trending Now',
  trendingSubtitle: 'What everyone is wearing right now',
  newsletterTitle: 'Stay in the Loop',
  newsletterSubtitle: 'Get the latest drops, exclusive offers, and style inspiration.',
};

// ─── Store ────────────────────────────────────────────────────────────────────

interface ContentStore {
  content: ContentData;
  loading: boolean;
  hasFetched: boolean;
  error: string | null;

  /** Used by Admin Content editor for local edits before saving */
  setContent: (data: ContentData) => void;

  loadContent: () => Promise<void>;
  saveContent: (data: ContentData) => Promise<void>;
}

const CONTENT_ROW_ID = 'global-content';

/** Deep-merge loaded data with defaults so missing keys never cause crashes */
function mergeWithDefaults(loaded: Partial<ContentData>): ContentData {
  return {
    ...defaultContent,
    ...loaded,
    announcement: {
      ...defaultContent.announcement,
      ...(loaded.announcement ?? {}),
      // Always ensure messages is a non-empty array
      messages:
        Array.isArray(loaded.announcement?.messages) && loaded.announcement.messages.length > 0
          ? loaded.announcement.messages
          : defaultContent.announcement.messages,
    },
    banners: Array.isArray(loaded.banners) ? loaded.banners : [],
    newArrivalBanners: Array.isArray(loaded.newArrivalBanners) ? loaded.newArrivalBanners : [],
    saleBanners: Array.isArray(loaded.saleBanners)
      ? loaded.saleBanners
      : [],
  };
}

export const useContentStore = create<ContentStore>()((set, get) => ({
  content: defaultContent,
  loading: false,
  hasFetched: false,
  error: null,

  // ── Local setter (used by admin editor for live preview before save) ─────────
  setContent: (data) => set({ content: data }),

  // ── Load from Supabase ───────────────────────────────────────────────────────
  loadContent: async () => {
    if (get().hasFetched || get().loading) return;
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('content')
        .eq('id', CONTENT_ROW_ID)
        .single();

      // PGRST116 = row not found — that's fine, use defaults
      if (error && error.code !== 'PGRST116') throw error;

      set({
        content: data?.content ? mergeWithDefaults(data.content) : defaultContent,
        loading: false,
        hasFetched: true,
      });
    } catch (err) {
      console.error('[ContentStore] loadContent:', err);
      set({
        content: defaultContent,
        loading: false,
        hasFetched: true,
        error: err instanceof Error ? err.message : 'Failed to load content',
      });
    }
  },

  // ── Save to Supabase (called by admin Content.tsx handleSave) ────────────────
  saveContent: async (data) => {
    const { error } = await supabase
      .from('site_content')
      .upsert(
        { id: CONTENT_ROW_ID, content: data, updated_at: new Date().toISOString() },
        { onConflict: 'id' },
      );

    if (error) throw error;

    // Sync into local state after confirmed DB write
    set({ content: data });
  },
}));