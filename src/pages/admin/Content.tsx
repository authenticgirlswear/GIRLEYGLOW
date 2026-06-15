/* ===================================================
   GIrley GLow - Admin Content Editor
   Fixed: uses saveContent from store, guards undefined messages
   =================================================== */

import React, { useState } from 'react';
import { Save, Eye, Plus, Trash2, Image, Megaphone, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useContentStore, type ContentData } from '@/store/contentStore';

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

// ── Upload image to Cloudinary ──
const uploadContentImage = async (
  file: File,
  folder: string
): Promise<string> => {
  const formData = new FormData();

  formData.append('file', file);
  formData.append(
    'upload_preset',
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  );
  formData.append('folder', folder);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Cloudinary upload failed');
  }

  return data.secure_url;
};

export const AdminContent: React.FC = () => {
  const { content, setContent, saveContent } = useContentStore();
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Hero image state
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState('');

  // Homepage banner image state
  const [bannerFiles, setBannerFiles] = useState<Record<string, File>>({});
  const [bannerPreviews, setBannerPreviews] = useState<Record<string, string>>({});

  // New Arrival banner image state
  const [newArrivalBannerFiles, setNewArrivalBannerFiles] = useState<Record<string, File>>({});
  const [newArrivalBannerPreviews, setNewArrivalBannerPreviews] = useState<Record<string, string>>({});

  // sale banner image state
  const [saleBannerFiles, setSaleBannerFiles] = useState<Record<string, File>>({});
  const [saleBannerPreviews, setSaleBannerPreviews] = useState<Record<string, string>>({});

  // Safe accessor — announcement.messages is always an array after contentStore defaults
  const messages = content.announcement?.messages ?? [];

  const updateField = (field: keyof ContentData, value: unknown) => {
    setContent({ ...content, [field]: value });
  };

  // ── Homepage Banner helpers ──────────────────────────────────────────────────

  const updateBanner = (index: number, field: string, value: string | boolean) => {
    const banners = [...content.banners];
    banners[index] = { ...banners[index], [field]: value };
    setContent({ ...content, banners });
  };

  const addBanner = () => {
    setContent({
      ...content,
      banners: [
        ...content.banners,
        {
          id: Date.now().toString(),
          title: 'New Banner',
          subtitle: 'Banner description',
          buttonText: 'Shop Now',
          buttonLink: '/shop',
          gradient: gradients[0],
          imageUrl: '',
          active: true,
        },
      ],
    });
  };

  const removeBanner = (index: number) =>
    setContent({ ...content, banners: content.banners.filter((_, i) => i !== index) });

  // ── New Arrival Banner helpers ───────────────────────────────────────────────

  const updateNewArrivalBanner = (index: number, field: string, value: string | boolean) => {
    const newArrivalBanners = [...content.newArrivalBanners];
    newArrivalBanners[index] = { ...newArrivalBanners[index], [field]: value };
    setContent({ ...content, newArrivalBanners });
  };

  const addNewArrivalBanner = () => {
    setContent({
      ...content,
      newArrivalBanners: [
        ...(content.newArrivalBanners ?? []),
        {
          id: Date.now().toString(),
          title: 'New Arrival Banner',
          subtitle: 'Banner description',
          buttonText: 'Shop Now',
          buttonLink: '/new-arrivals',
          gradient: gradients[0],
          imageUrl: '',
          active: true,
        },
      ],
    });
  };

  const removeNewArrivalBanner = (index: number) =>
    setContent({
      ...content,
      newArrivalBanners: (content.newArrivalBanners ?? []).filter((_, i) => i !== index),
    });
  // ── Sale Banner helpers ───────────────────────────────────────────────
  const updateSaleBanner = (
    index: number,
    field: string,
    value: string | boolean
  ) => {
    const saleBanners = [...(content.saleBanners ?? [])];

    saleBanners[index] = {
      ...saleBanners[index],
      [field]: value,
    };

    setContent({
      ...content,
      saleBanners,
    });
  };

  const addSaleBanner = () => {
    setContent({
      ...content,
      saleBanners: [
        ...(content.saleBanners ?? []),
        {
          id: Date.now().toString(),
          title: 'Sale Banner',
          subtitle: 'Limited time offers',
          buttonText: 'Shop Sale',
          buttonLink: '/shop?sale=true',
          gradient: gradients[0],
          imageUrl: '',
          active: true,
        },
      ],
    });
  };

  const removeSaleBanner = (index: number) =>
    setContent({
      ...content,
      saleBanners: (content.saleBanners ?? []).filter(
        (_, i) => i !== index
      ),
    });
  // ── Announcement helpers ─────────────────────────────────────────────────────

  const updateAnnouncement = (field: string, value: unknown) => {
    setContent({
      ...content,
      announcement: { ...content.announcement, [field]: value },
    });
  };

  const updateAnnouncementMessage = (index: number, value: string) => {
    const updated = [...messages];
    updated[index] = value;
    updateAnnouncement('messages', updated);
  };

  const addAnnouncementMessage = () =>
    updateAnnouncement('messages', [...messages, 'New announcement']);

  const removeAnnouncementMessage = (index: number) =>
    updateAnnouncement('messages', messages.filter((_, i) => i !== index));

  // ── Save handler ─────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setUploading(true);
    setUploadError('');
    let updatedContent = { ...content };

    try {
      // Step 1: Upload hero image if selected
      if (heroFile) {
        const url = await uploadContentImage(heroFile, 'hero');
        updatedContent = { ...updatedContent, heroImageUrl: url };
      }

      // Step 2: Upload homepage banner images
      const updatedBanners = [...updatedContent.banners];
      for (const [bannerId, file] of Object.entries(bannerFiles)) {
        const url = await uploadContentImage(file, 'banners');
        const idx = updatedBanners.findIndex(b => b.id === bannerId);
        if (idx !== -1) updatedBanners[idx] = { ...updatedBanners[idx], imageUrl: url };
      }
      updatedContent = { ...updatedContent, banners: updatedBanners };

      // Step 3: Upload new arrival banner images
      const updatedNewArrivalBanners = [...updatedContent.newArrivalBanners];
      for (const [bannerId, file] of Object.entries(newArrivalBannerFiles)) {
        const url = await uploadContentImage(file, 'new-arrival-banners');
        const idx = updatedNewArrivalBanners.findIndex(b => b.id === bannerId);
        if (idx !== -1) updatedNewArrivalBanners[idx] = { ...updatedNewArrivalBanners[idx], imageUrl: url };
      }
      updatedContent = { ...updatedContent, newArrivalBanners: updatedNewArrivalBanners };

      // Step 3: Upload sale banner images
      const updatedSaleBanners = [
        ...(updatedContent.saleBanners ?? [])
      ];

      for (const [bannerId, file] of Object.entries(
        saleBannerFiles
      )) {
        const url = await uploadContentImage(
          file,
          'sale-banners'
        );

        const idx = updatedSaleBanners.findIndex(
          b => b.id === bannerId
        );

        if (idx !== -1) {
          updatedSaleBanners[idx] = {
            ...updatedSaleBanners[idx],
            imageUrl: url,
          };
        }
      }

      updatedContent = {
        ...updatedContent,
        saleBanners: updatedSaleBanners,
      };

      // Step 4: Save to Supabase via store (handles upsert + local state update)
      await saveContent(updatedContent);

      // Step 5: Clean up local file state
      setHeroFile(null);
      setHeroPreview('');
      setBannerFiles({});
      setBannerPreviews({});
      setNewArrivalBannerFiles({});
      setNewArrivalBannerPreviews({});
      setSaleBannerFiles({});
      setSaleBannerPreviews({});

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      const isStorageError = msg.toLowerCase().includes('upload') || msg.toLowerCase().includes('storage');
      setUploadError(
        isStorageError
          ? `Image upload failed: ${msg}. Check Supabase bucket permissions.`
          : `Save failed: ${msg}. Check Supabase table permissions for site_content.`,
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-serif text-2xl md:text-3xl font-bold text-charcoal">Content Editor</h1>
          <p className="text-[#6B5B55] text-sm">Manage homepage content without touching code</p>
        </div>
        <Button onClick={handleSave} disabled={uploading}>
          {uploading ? 'Uploading...' : saved ? '✓ Saved!' : <><Save size={16} /> Save Changes</>}
        </Button>
      </div>

      {uploadError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          ⚠️ {uploadError}
        </div>
      )}

      {/* ── Announcement Bar ─────────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-charcoal flex items-center gap-2">
            <Megaphone size={16} className="text-rose-gold" /> Announcement Bar
          </h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={content.announcement?.enabled ?? false}
              onChange={e => updateAnnouncement('enabled', e.target.checked)}
              className="w-4 h-4 rounded accent-rose-gold"
            />
            <span className="text-sm text-charcoal">Enabled</span>
          </label>
        </div>

        {/* Live Preview */}
        <div
          className="rounded-xl overflow-hidden mb-4 h-10 flex items-center justify-center px-4"
          style={{ backgroundColor: content.announcement?.bgColor ?? '#000', color: content.announcement?.textColor ?? '#fff' }}
        >
          <p className="text-sm text-center" style={{ fontWeight: content.announcement?.bold ? 600 : 500 }}>
            ✨ {messages[0] || 'Your announcement preview'}
          </p>
        </div>

        {/* Messages */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[#6B5B55]">Messages</label>
            <Button size="sm" onClick={addAnnouncementMessage}><Plus size={12} /> Add Message</Button>
          </div>
          <div className="space-y-2">
            {messages.map((msg, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={msg}
                  onChange={e => updateAnnouncementMessage(idx, e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30"
                  placeholder="Enter announcement text..."
                />
                <button onClick={() => removeAnnouncementMessage(idx)} className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Animation Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#6B5B55] mb-2">Animation Style</label>
          <div className="grid grid-cols-3 gap-2">
            {(['marquee', 'fade', 'static'] as const).map(anim => (
              <button
                key={anim}
                type="button"
                onClick={() => updateAnnouncement('animation', anim)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${content.announcement?.animation === anim
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
          <label className="block text-sm font-medium text-[#6B5B55] mb-2">Color Theme</label>
          <div className="flex gap-2 flex-wrap">
            {announcementColorPresets.map(preset => (
              <button
                key={preset.name}
                type="button"
                onClick={() => { updateAnnouncement('bgColor', preset.bg); updateAnnouncement('textColor', preset.text); }}
                className={`px-3 py-2 rounded-lg text-xs font-medium border-2 transition-all ${content.announcement?.bgColor === preset.bg ? 'border-rose-gold scale-105' : 'border-transparent'}`}
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
            <label className="block text-sm font-medium text-[#6B5B55] mb-1.5">Background Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={content.announcement?.bgColor ?? '#000000'} onChange={e => updateAnnouncement('bgColor', e.target.value)} className="w-12 h-10 rounded-lg border border-blush/30 cursor-pointer" />
              <input type="text" value={content.announcement?.bgColor ?? '#000000'} onChange={e => updateAnnouncement('bgColor', e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-blush/30 bg-white/80 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B5B55] mb-1.5">Text Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={content.announcement?.textColor ?? '#ffffff'} onChange={e => updateAnnouncement('textColor', e.target.value)} className="w-12 h-10 rounded-lg border border-blush/30 cursor-pointer" />
              <input type="text" value={content.announcement?.textColor ?? '#ffffff'} onChange={e => updateAnnouncement('textColor', e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-blush/30 bg-white/80 text-sm" />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={content.announcement?.bold ?? false} onChange={e => updateAnnouncement('bold', e.target.checked)} className="w-4 h-4 rounded accent-rose-gold" />
            <span className="text-sm text-charcoal">Bold text</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={content.announcement?.dismissible ?? false} onChange={e => updateAnnouncement('dismissible', e.target.checked)} className="w-4 h-4 rounded accent-rose-gold" />
            <span className="text-sm text-charcoal">Show close button</span>
          </label>
        </div>
      </div>

      {/* ── Hero Section ─────────────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-charcoal flex items-center gap-2">
            <Eye size={16} className="text-rose-gold" /> Hero Section
          </h3>
          <button
            type="button"
            onClick={() => updateField('heroEnabled', !content.heroEnabled)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blush/30 bg-white/60 hover:bg-white/80 transition-colors"
          >
            {content.heroEnabled
              ? <ToggleRight size={20} className="text-rose-gold" />
              : <ToggleLeft size={20} className="text-[#6B5B55]" />}
            <span className="text-sm font-medium text-charcoal">
              {content.heroEnabled ? 'Visible' : 'Hidden'}
            </span>
          </button>
        </div>

        <div className="space-y-4">
          <Input label="Hero Title" value={content.heroTitle} onChange={e => updateField('heroTitle', e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-[#6B5B55] mb-1.5">Hero Subtitle</label>
            <textarea
              value={content.heroSubtitle}
              onChange={e => updateField('heroSubtitle', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 resize-none"
              rows={3}
            />
          </div>
          <Input label="Button Text" value={content.heroButtonText} onChange={e => updateField('heroButtonText', e.target.value)} />

          <div>
            <label className="text-sm font-medium text-[#6B5B55] mb-1.5 flex items-center gap-1.5">
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
              className="w-full text-sm text-[#6B5B55] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blush-light file:text-charcoal hover:file:bg-blush cursor-pointer"
            />
            {(heroPreview || content.heroImageUrl) && (
              <div className="mt-2 relative">
                <img
                  src={heroPreview || content.heroImageUrl}
                  alt="Hero preview"
                  className="w-full h-32 object-cover rounded-xl border border-blush/30"
                />
                {content.heroImageUrl && !heroPreview && (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-[#6B5B55]">Current hero image — upload a new one to replace</p>
                    <button type="button" onClick={() => updateField('heroImageUrl', '')} className="text-xs text-red-400 hover:text-red-600">Remove image</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Hero Live Preview */}
        <div
          className="mt-4 rounded-xl overflow-hidden h-32 flex items-center justify-center relative"
          style={
            heroPreview || content.heroImageUrl
              ? { backgroundImage: `url(${heroPreview || content.heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: 'linear-gradient(135deg, #F4C2C2, #E6E6FA, #F7E7CE)' }
          }
        >
          {!content.heroEnabled && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
              <p className="text-white text-sm font-medium">Hero is hidden on website</p>
            </div>
          )}
          <div className="text-center bg-white/40 backdrop-blur-sm rounded-xl px-4 py-2">
            <p className="heading-serif text-lg font-bold text-charcoal">{content.heroTitle}</p>
            <p className="text-xs text-[#6B5B55]">{content.heroSubtitle?.substring(0, 60)}...</p>
            <p className="text-xs font-medium text-rose-gold mt-1">{content.heroButtonText}</p>
          </div>
        </div>
      </div>

      {/* ── Section Titles ───────────────────────────────────────────────────── */}
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

      {/* ── Banner Slider ────────────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-charcoal">Banner Slider ({(content.banners ?? []).length} banners)</h3>
          <Button size="sm" onClick={addBanner}><Plus size={14} /> Add Banner</Button>
        </div>

        <div className="space-y-4">
          {(content.banners ?? []).map((banner, index) => (
            <div key={banner.id} className="border border-blush/20 rounded-xl overflow-hidden">
              <div
                className="h-20 flex items-center px-6 relative"
                style={
                  bannerPreviews[banner.id]
                    ? { backgroundImage: `url(${bannerPreviews[banner.id]})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : banner.imageUrl
                      ? { backgroundImage: `url(${banner.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : { background: banner.gradient }
                }
              >
                <div className="flex-1 bg-white/40 backdrop-blur-sm rounded-lg px-3 py-1">
                  <p className="font-medium text-charcoal text-sm">{banner.title}</p>
                  <p className="text-xs text-[#6B5B55]">{banner.subtitle.substring(0, 50)}</p>
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
                  <label className="block text-sm font-medium text-[#6B5B55] mb-1.5">Subtitle</label>
                  <input
                    value={banner.subtitle}
                    onChange={e => updateBanner(index, 'subtitle', e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#6B5B55] mb-1.5 flex items-center gap-1.5">
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
                    className="w-full text-sm text-[#6B5B55] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blush-light file:text-charcoal hover:file:bg-blush cursor-pointer"
                  />
                  {banner.imageUrl && !bannerPreviews[banner.id] && (
                    <div className="flex items-center gap-2 mt-1">
                      <img src={banner.imageUrl} alt="" className="w-16 h-8 object-cover rounded-lg border border-blush/30" />
                      <p className="text-xs text-[#6B5B55]">Current image</p>
                      <button type="button" onClick={() => updateBanner(index, 'imageUrl', '')} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6B5B55] mb-1.5">Gradient (used if no image)</label>
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

        <p className="text-xs text-[#6B5B55] mt-4">
          💡 Click <strong>Save Changes</strong> to upload images and apply all edits to the website.
        </p>
      </div>

      {/* ── New Arrival Page Banners ─────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-charcoal">
            New Arrival Page Banners ({(content.newArrivalBanners ?? []).length} banners)
          </h3>
          <Button size="sm" onClick={addNewArrivalBanner}><Plus size={14} /> Add Banner</Button>
        </div>

        <div className="space-y-4">
          {(content.newArrivalBanners ?? []).map((banner, index) => (
            <div key={banner.id} className="border border-blush/20 rounded-xl overflow-hidden">
              <div
                className="h-20 flex items-center px-6 relative"
                style={
                  newArrivalBannerPreviews[banner.id]
                    ? { backgroundImage: `url(${newArrivalBannerPreviews[banner.id]})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : banner.imageUrl
                      ? { backgroundImage: `url(${banner.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : { background: banner.gradient }
                }
              >
                <div className="flex-1 bg-white/40 backdrop-blur-sm rounded-lg px-3 py-1">
                  <p className="font-medium text-charcoal text-sm">{banner.title}</p>
                  <p className="text-xs text-[#6B5B55]">{banner.subtitle.substring(0, 50)}</p>
                </div>
                <button onClick={() => removeNewArrivalBanner(index)} className="p-1.5 rounded-lg hover:bg-white/50 ml-2">
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Title" value={banner.title} onChange={e => updateNewArrivalBanner(index, 'title', e.target.value)} />
                  <Input label="Button Text" value={banner.buttonText} onChange={e => updateNewArrivalBanner(index, 'buttonText', e.target.value)} />
                  <Input label="Button Link" value={banner.buttonLink} onChange={e => updateNewArrivalBanner(index, 'buttonLink', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6B5B55] mb-1.5">Subtitle</label>
                  <input
                    value={banner.subtitle}
                    onChange={e => updateNewArrivalBanner(index, 'subtitle', e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#6B5B55] mb-1.5 flex items-center gap-1.5">
                    <Image size={14} /> Banner Background Image (overrides gradient)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      if (file) {
                        setNewArrivalBannerFiles(prev => ({ ...prev, [banner.id]: file }));
                        setNewArrivalBannerPreviews(prev => ({ ...prev, [banner.id]: URL.createObjectURL(file) }));
                      }
                    }}
                    className="w-full text-sm text-[#6B5B55] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blush-light file:text-charcoal hover:file:bg-blush cursor-pointer"
                  />
                  {banner.imageUrl && !newArrivalBannerPreviews[banner.id] && (
                    <div className="flex items-center gap-2 mt-1">
                      <img src={banner.imageUrl} alt="" className="w-16 h-8 object-cover rounded-lg border border-blush/30" />
                      <p className="text-xs text-[#6B5B55]">Current image</p>
                      <button type="button" onClick={() => updateNewArrivalBanner(index, 'imageUrl', '')} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6B5B55] mb-1.5">Gradient (used if no image)</label>
                  <div className="flex gap-2 flex-wrap">
                    {gradients.map(g => (
                      <button key={g} type="button" onClick={() => updateNewArrivalBanner(index, 'gradient', g)} className={`w-12 h-8 rounded-lg border-2 ${banner.gradient === g ? 'border-rose-gold' : 'border-transparent'}`} style={{ background: g }} />
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={banner.active} onChange={e => updateNewArrivalBanner(index, 'active', e.target.checked)} className="w-4 h-4 rounded accent-rose-gold" />
                  <span className="text-sm text-charcoal">Active (show on website)</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-[#6B5B55] mt-4">
          💡 Click <strong>Save Changes</strong> to upload images and apply all edits to the website.
        </p>
      </div>

      {/* ── SALE PAGE BANNERS ───────────────────────────── */}
      <div className="glass-card rounded-2xl p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-charcoal">
            Sale Page Banners ({(content.saleBanners ?? []).length} banners)
          </h3>
          <Button size="sm" onClick={addSaleBanner}><Plus size={14} /> Add Banner</Button>
        </div>

        <div className="space-y-4">
          {(content.saleBanners ?? []).map((banner, index) => (
            <div key={banner.id} className="border border-blush/20 rounded-xl overflow-hidden">
              <div
                className="h-20 flex items-center px-6 relative"
                style={
                  saleBannerPreviews[banner.id]
                    ? { backgroundImage: `url(${saleBannerPreviews[banner.id]})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : banner.imageUrl
                      ? { backgroundImage: `url(${banner.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : { background: banner.gradient }
                }
              >
                <div className="flex-1 bg-white/40 backdrop-blur-sm rounded-lg px-3 py-1">
                  <p className="font-medium text-charcoal text-sm">{banner.title}</p>
                  <p className="text-xs text-[#6B5B55]">{banner.subtitle.substring(0, 50)}</p>
                </div>
                <button onClick={() => removeSaleBanner(index)} className="p-1.5 rounded-lg hover:bg-white/50 ml-2">
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Title" value={banner.title} onChange={e => updateSaleBanner(index, 'title', e.target.value)} />
                  <Input label="Button Text" value={banner.buttonText} onChange={e => updateSaleBanner(index, 'buttonText', e.target.value)} />
                  <Input label="Button Link" value={banner.buttonLink} onChange={e => updateSaleBanner(index, 'buttonLink', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6B5B55] mb-1.5">Subtitle</label>
                  <input
                    value={banner.subtitle}
                    onChange={e => updateSaleBanner(index, 'subtitle', e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#6B5B55] mb-1.5 flex items-center gap-1.5">
                    <Image size={14} /> Banner Background Image (overrides gradient)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      if (file) {
                        setSaleBannerFiles(prev => ({ ...prev, [banner.id]: file }));
                        setSaleBannerPreviews(prev => ({ ...prev, [banner.id]: URL.createObjectURL(file) }));
                      }
                    }}
                    className="w-full text-sm text-[#6B5B55] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blush-light file:text-charcoal hover:file:bg-blush cursor-pointer"
                  />
                  {banner.imageUrl && !saleBannerPreviews[banner.id] && (
                    <div className="flex items-center gap-2 mt-1">
                      <img src={banner.imageUrl} alt="" className="w-16 h-8 object-cover rounded-lg border border-blush/30" />
                      <p className="text-xs text-[#6B5B55]">Current image</p>
                      <button type="button" onClick={() => updateSaleBanner(index, 'imageUrl', '')} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6B5B55] mb-1.5">Gradient (used if no image)</label>
                  <div className="flex gap-2 flex-wrap">
                    {gradients.map(g => (
                      <button key={g} type="button" onClick={() => updateSaleBanner(index, 'gradient', g)} className={`w-12 h-8 rounded-lg border-2 ${banner.gradient === g ? 'border-rose-gold' : 'border-transparent'}`} style={{ background: g }} />
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={banner.active} onChange={e => updateSaleBanner(index, 'active', e.target.checked)} className="w-4 h-4 rounded accent-rose-gold" />
                  <span className="text-sm text-charcoal">Active (show on website)</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-[#6B5B55] mt-4">
          💡 Click <strong>Save Changes</strong> to upload images and apply all edits to the website.
        </p>
      </div>
    </div>
  );
};