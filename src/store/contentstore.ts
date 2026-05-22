// src/store/contentStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  heroEnabled: boolean;          // ← NEW: hero on/off toggle
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

export const defaultContent: ContentData = {
  heroEnabled: true,
  heroTitle: 'Elegance Redefined',
  heroSubtitle: 'Discover our curated collection of authentic girlswear — where every piece tells a story of grace and style.',
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

interface ContentStore {
  content: ContentData;
  setContent: (c: ContentData) => void;
}

export const useContentStore = create<ContentStore>()(
  persist(
    (set) => ({
      content: defaultContent,
      setContent: (content) => set({ content }),
    }),
    {
      name: 'authentic-girlswear-content',
      merge: (persisted: any, current) => ({
        ...current,
        content: {
          ...current.content,
          ...(persisted?.content || {}),
          // Always merge announcement deeply so new keys appear for existing users
          announcement: {
            ...current.content.announcement,
            ...(persisted?.content?.announcement || {}),
          },
        },
      }),
    }
  )
);