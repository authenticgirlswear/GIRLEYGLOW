/* ===================================================
   AUTHENTIC GIRLSWEAR - Admin Content Editor
   FIXED + NEW FEATURES:
   - Hero banner image upload
   - Banner slider image upload per banner
   - ✅ NEW: Announcement bar editor (enable/disable, colors, animation, messages)
   - Content persists via useContentStore (localStorage)
   =================================================== */

import React, { useState } from 'react';
import { Save, Eye, Plus, Trash2, Image, Megaphone } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ──
interface Banner {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  gradient: string;
  imageUrl?: string;
  active: boolean;
}

interface AnnouncementSettings {
  enabled: boolean;
  messages: string[];
  bgColor: string;
  textColor: string;
  animation: 'marquee' | 'fade' | 'static';
  bold: boolean;
  dismissible: boolean;
}

interface ContentData {
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

const defaultContent: ContentData = {
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
    { id: '1', title: 'New Arrivals', subtitle: 'Fresh styles just dropped', buttonText: 'Shop Now', buttonLink: '/shop?sort=newest', gradient: 'linear-gradient(135deg, #F4C2C2, #E6E6FA, #F7E7CE)', active: true },
    { id: '2', title: 'Sale Collection', subtitle: 'Up to 50% off selected items', buttonText: 'Shop Sale', buttonLink: '/shop?sale=true', gradient: 'linear-gradient(135deg, #B76E79, #E3BCA4, #F7E7CE)', active: true },
  ],
  announcement: {
    enabled: true,
    messages: ['Free shipping on orders over $99', 'New collection just dropped!', 'Use code WELCOME10 for 10% off'],
    bgColor: '#B76E79',
    textColor: '#FFFFFF',
    animation: 'marquee',
    bold: false,
    dismissible: true,
  },
};

// Persisted content store
export const useContentStore = create<{ content: ContentData; setContent: (c: ContentData) => void }>()(
  persist(
    (set) => ({
      content: defaultContent,
      setContent: (content) => set({ content }),
    }),
    {
      name: 'authentic-girlswear-content',
      // Merge with defaults on hydration (so existing users get announcement key)
      merge: (persisted: any, current) => ({
        ...current,
        content: {
          ...current.content,
          ...(persisted?.content || {}),
          announcement: {
            ...current.content.announcement,
            ...(persisted?.content?.announcement || {}),
          },
        },
      }),
    }
  )
);

const gradients = [
  'linear-gradient(135deg, #F4C2C2, #E6E6FA, #F7E7CE)',
  'linear-gradient(135deg, #B76E79, #E3BCA4, #F7E7CE)',
  'linear-gradient(135deg, #D4949E, #F4C2C2, #E6E6FA)',
  'linear-gradient(135deg, #E6E6FA, #F4C2C2, #FADBD8)',
  'linear-gradient(135deg, #F7E7CE, #E3BCA4, #F4C2C2)',
];

const announcementColorPresets = [
  { bg: '#B76E79', text: '#FFFFFF', name: 'Rose Gold' },
  { bg: '#2D2D2D', text: '#FFFFFF', name: 'Charcoal' },
  { bg: '#F4C2C2', text: '#2D2D2D', name: 'Blush' },
  { bg: '#E6E6FA', text: '#2D2D2D', name: 'Lavender' },
  { bg: '#000000', text: '#F7E7CE', name: 'Black & Gold' },
  { bg: '#D4949E', text: '#FFFFFF', name: 'Dusty Pink' },
];

// ── Upload image to Supabase Storage ──
const uploadContentImage = async (file: File, folder: string): Promise<string> => {
  const ext = file.name.split('.').pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file);
  if (error) { console.error('Upload error:', error); return ''; }
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
};

export const AdminContent: React.FC = () => {
  const { content, setContent } = useContentStore();
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState('');
  const [bannerFiles, setBannerFiles] = useState<Record<string, File>>({});
  const [bannerPreviews, setBannerPreviews] = useState<Record<string, string>>({});

  const updateField = (field: keyof ContentData, value: string) => {
    setContent({ ...content, [field]: value } as ContentData);
  };

  const updateBanner = (index: number, field: keyof Banner, value: string | boolean) => {
    const banners = [...content.banners];
    banners[index] = { ...banners[index], [field]: value };
    setContent({ ...content, banners });
  };

  const updateAnnouncement = (field: keyof AnnouncementSettings, value: any) => {
    setContent({
      ...content,
      announcement: { ...content.announcement, [field]: value },
    });
  };

  const updateAnnouncementMessage = (index: number, value: string) => {
    const messages = [...content.announcement.messages];
    messages[index] = value;
    updateAnnouncement('messages', messages);
  };

  const addAnnouncementMessage = () => {
    updateAnnouncement('messages', [...content.announcement.messages, 'New announcement']);
  };

  const removeAnnouncementMessage = (index: number) => {
    updateAnnouncement('messages', content.announcement.messages.filter((_, i) => i !== index));
  };

  const addBanner = () => {
    setContent({
      ...content,
      banners: [...content.banners, {
        id: Date.now().toString(),
        title: 'New Banner',
        subtitle: 'Banner description',
        buttonText: 'Shop Now',
        buttonLink: '/shop',
        gradient: gradients[0],
        imageUrl: '',
        active: true,
      }],
    });
  };

  const removeBanner = (index: number) => {
    setContent({ ...content, banners: content.banners.filter((_, i) => i !== index) });
  };

  const handleSave = async () => {
    setUploading(true);
    let updatedContent = { ...content };

    if (heroFile) {
      const url = await uploadContentImage(heroFile, 'hero');
      if (url) updatedContent.heroImageUrl = url;
    }

    const updatedBanners = [...content.banners];
    for (const [bannerId, file] of Object.entries(bannerFiles)) {
      const url = await uploadContentImage(file, 'banners');
      if (url) {
        const idx = updatedBanners.findIndex(b => b.id === bannerId);
        if (idx !== -1) updatedBanners[idx] = { ...updatedBanners[idx], imageUrl: url };
      }
    }
    updatedContent.banners = updatedBanners;

    setContent(updatedContent);
    setHeroFile(null);
    setHeroPreview('');
    setBannerFiles({});
    setBannerPreviews({});
    setUploading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-serif text-2xl md:text-3xl font-bold text-charcoal">Content Editor</h1>
          <p className="text-warm-gray text-sm">Manage homepage content without touching code</p>
        </div>
        <Button onClick={handleSave} disabled={uploading}>
          {uploading ? 'Uploading...' : saved ? '✓ Saved!' : <><Save size={16} /> Save Changes</>}
        </Button>
      </div>

      {/* ✅ NEW: Announcement Bar */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-charcoal flex items-center gap-2">
            <Megaphone size={16} className="text-rose-gold" /> Announcement Bar
          </h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={content.announcement.enabled}
              onChange={e => updateAnnouncement('enabled', e.target.checked)}
              className="w-4 h-4 rounded accent-rose-gold"
            />
            <span className="text-sm text-charcoal">Enabled</span>
          </label>
        </div>

        {/* Live Preview */}
        <div
          className="rounded-xl overflow-hidden mb-4 h-10 flex items-center justify-center px-4"
          style={{
            backgroundColor: content.announcement.bgColor,
            color: content.announcement.textColor,
          }}
        >
          <p
            className="text-sm text-center"
            style={{ fontWeight: content.announcement.bold ? 600 : 500 }}
          >
            ✨ {content.announcement.messages[0] || 'Your announcement preview'}
          </p>
        </div>

        {/* Messages */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-warm-gray">Messages</label>
            <Button size="sm" onClick={addAnnouncementMessage}>
              <Plus size={12} /> Add Message
            </Button>
          </div>
          <div className="space-y-2">
            {content.announcement.messages.map((msg, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={msg}
                  onChange={e => updateAnnouncementMessage(idx, e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30"
                  placeholder="Enter announcement text..."
                />
                <button
                  onClick={() => removeAnnouncementMessage(idx)}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Animation Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-warm-gray mb-2">Animation Style</label>
          <div className="grid grid-cols-3 gap-2">
            {(['marquee', 'fade', 'static'] as const).map(anim => (
              <button
                key={anim}
                type="button"
                onClick={() => updateAnnouncement('animation', anim)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  content.announcement.animation === anim
                    ? 'bg-rose-gold text-white'
                    : 'bg-blush-light/50 text-charcoal hover:bg-blush-light'
                }`}
              >
                {anim === 'marquee' ? '➡️ Scrolling' : anim === 'fade' ? '✨ Fade' : '⏸️ Static'}
              </button>
            ))}
          </div>
        </div>

        {/* Color Presets */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-warm-gray mb-2">Color Theme</label>
          <div className="flex gap-2 flex-wrap">
            {announcementColorPresets.map(preset => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  updateAnnouncement('bgColor', preset.bg);
                  updateAnnouncement('textColor', preset.text);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                  content.announcement.bgColor === preset.bg
                    ? 'border-rose-gold scale-105'
                    : 'border-transparent'
                }`}
                style={{ backgroundColor: preset.bg, color: preset.text }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Colors */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-warm-gray mb-1.5">Background Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={content.announcement.bgColor}
                onChange={e => updateAnnouncement('bgColor', e.target.value)}
                className="w-12 h-10 rounded-lg border border-blush/30 cursor-pointer"
              />
              <input
                type="text"
                value={content.announcement.bgColor}
                onChange={e => updateAnnouncement('bgColor', e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-blush/30 bg-white/80 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-warm-gray mb-1.5">Text Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={content.announcement.textColor}
                onChange={e => updateAnnouncement('textColor', e.target.value)}
                className="w-12 h-10 rounded-lg border border-blush/30 cursor-pointer"
              />
              <input
                type="text"
                value={content.announcement.textColor}
                onChange={e => updateAnnouncement('textColor', e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-blush/30 bg-white/80 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Extra options */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={content.announcement.bold}
              onChange={e => updateAnnouncement('bold', e.target.checked)}
              className="w-4 h-4 rounded accent-rose-gold"
            />
            <span className="text-sm text-charcoal">Bold text</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={content.announcement.dismissible}
              onChange={e => updateAnnouncement('dismissible', e.target.checked)}
              className="w-4 h-4 rounded accent-rose-gold"
            />
            <span className="text-sm text-charcoal">Show close button</span>
          </label>
        </div>
      </div>

      {/* Hero Section */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <h3 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
          <Eye size={16} className="text-rose-gold" /> Hero Section
        </h3>
        <div className="space-y-4">
          <Input label="Hero Title" value={content.heroTitle} onChange={e => updateField('heroTitle', e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-warm-gray mb-1.5">Hero Subtitle</label>
            <textarea value={content.heroSubtitle} onChange={e => updateField('heroSubtitle', e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 resize-none" rows={3} />
          </div>
          <Input label="Button Text" value={content.heroButtonText} onChange={e => updateField('heroButtonText', e.target.value)} />

          <div>
            <label className="text-sm font-medium text-warm-gray mb-1.5 flex items-center gap-1.5">
              <Image size={14} /> Hero Background Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0] || null;
                setHeroFile(file);
                if (file) setHeroPreview(URL.createObjectURL(file));
              }}
              className="w-full text-sm text-warm-gray file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blush-light file:text-charcoal hover:file:bg-blush cursor-pointer"
            />
            {(heroPreview || content.heroImageUrl) && (
              <div className="mt-2 relative">
                <img
                  src={heroPreview || content.heroImageUrl}
                  alt="Hero preview"
                  className="w-full h-32 object-cover rounded-xl border border-blush/30"
                />
                {content.heroImageUrl && !heroPreview && (
                  <p className="text-xs text-warm-gray mt-1">Current hero image — upload a new one to replace</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div
          className="mt-4 rounded-xl overflow-hidden h-32 flex items-center justify-center relative"
          style={content.heroImageUrl && !heroPreview
            ? { backgroundImage: `url(${content.heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : heroPreview
            ? { backgroundImage: `url(${heroPreview})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: 'linear-gradient(135deg, #F4C2C2, #E6E6FA, #F7E7CE)' }
          }
        >
          <div className="text-center bg-white/40 backdrop-blur-sm rounded-xl px-4 py-2">
            <p className="heading-serif text-lg font-bold text-charcoal">{content.heroTitle}</p>
            <p className="text-xs text-warm-gray">{content.heroSubtitle.substring(0, 60)}...</p>
            <p className="text-xs font-medium text-rose-gold mt-1">{content.heroButtonText}</p>
          </div>
        </div>
      </div>

      {/* Section Titles */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <h3 className="font-semibold text-charcoal mb-4">Section Titles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Featured Title" value={content.featuredTitle} onChange={e => updateField('featuredTitle', e.target.value)} />
          <Input label="Featured Subtitle" value={content.featuredSubtitle} onChange={e => updateField('featuredSubtitle', e.target.value)} />
          <Input label="Trending Title" value={content.trendingTitle} onChange={e => updateField('trendingTitle', e.target.value)} />
          <Input label="Trending Subtitle" value={content.trendingSubtitle} onChange={e => updateField('trendingSubtitle', e.target.value)} />
          <Input label="Newsletter Title" value={content.newsletterTitle} onChange={e => updateField('newsletterTitle', e.target.value)} />
          <Input label="Newsletter Subtitle" value={content.newsletterSubtitle} onChange={e => updateField('newsletterSubtitle', e.target.value)} />
        </div>
      </div>

      {/* Banner Slider */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-charcoal">Banner Slider ({content.banners.length} banners)</h3>
          <Button size="sm" onClick={addBanner}><Plus size={14} /> Add Banner</Button>
        </div>

        <div className="space-y-4">
          {content.banners.map((banner, index) => (
            <div key={banner.id} className="border border-blush/20 rounded-xl overflow-hidden">
              <div
                className="h-20 flex items-center px-6 relative"
                style={bannerPreviews[banner.id]
                  ? { backgroundImage: `url(${bannerPreviews[banner.id]})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : banner.imageUrl
                  ? { backgroundImage: `url(${banner.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: banner.gradient }
                }
              >
                <div className="flex-1 bg-white/40 backdrop-blur-sm rounded-lg px-3 py-1">
                  <p className="font-medium text-charcoal text-sm">{banner.title}</p>
                  <p className="text-xs text-warm-gray">{banner.subtitle.substring(0, 50)}</p>
                </div>
                <button onClick={() => removeBanner(index)} className="p-1.5 rounded-lg hover:bg-white/50 ml-2">
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Title" value={banner.title} onChange={e => updateBanner(index, 'title', e.target.value)} />
                  <Input label="Button Text" value={banner.buttonText} onChange={e => updateBanner(index, 'buttonText', e.target.value)} />
                  <Input label="Button Link" value={banner.buttonLink} onChange={e => updateBanner(index, 'buttonLink', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-gray mb-1.5">Subtitle</label>
                  <input value={banner.subtitle} onChange={e => updateBanner(index, 'subtitle', e.target.value)} className="w-full px-4 py-2 rounded-xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30" />
                </div>

                <div>
                  <label className="text-sm font-medium text-warm-gray mb-1.5 flex items-center gap-1.5">
                    <Image size={14} /> Banner Background Image (overrides gradient)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      if (file) {
                        setBannerFiles(prev => ({ ...prev, [banner.id]: file }));
                        setBannerPreviews(prev => ({ ...prev, [banner.id]: URL.createObjectURL(file) }));
                      }
                    }}
                    className="w-full text-sm text-warm-gray file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blush-light file:text-charcoal hover:file:bg-blush cursor-pointer"
                  />
                  {banner.imageUrl && !bannerPreviews[banner.id] && (
                    <div className="flex items-center gap-2 mt-1">
                      <img src={banner.imageUrl} alt="" className="w-16 h-8 object-cover rounded-lg border border-blush/30" />
                      <p className="text-xs text-warm-gray">Current image</p>
                      <button
                        type="button"
                        onClick={() => updateBanner(index, 'imageUrl', '')}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-warm-gray mb-1.5">Gradient (used if no image)</label>
                  <div className="flex gap-2 flex-wrap">
                    {gradients.map(g => (
                      <button key={g} type="button" onClick={() => updateBanner(index, 'gradient', g)} className={`w-12 h-8 rounded-lg border-2 ${banner.gradient === g ? 'border-rose-gold' : 'border-transparent'}`} style={{ background: g }} />
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={banner.active} onChange={e => updateBanner(index, 'active', e.target.checked)} className="w-4 h-4 rounded accent-rose-gold" />
                  <span className="text-sm text-charcoal">Active (show on website)</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-warm-gray mt-4">
          💡 Click <strong>Save Changes</strong> to upload images and apply all edits to the website.
        </p>
      </div>
    </div>
  );
};