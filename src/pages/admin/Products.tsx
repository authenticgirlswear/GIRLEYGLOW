/* ===================================================
   AUTHENTIC GIRLSWEAR - Admin Products Management
   FIXED:
   - Color input with circle preview + 50+ fashion color auto-map
   - Custom size input (free text, comma separated) — ALWAYS VISIBLE
   - Auto SKU generation from product name
   - Video upload field
   - Categories from useCategoryStore (not mockData)
   =================================================== */
import { uploadToCloudinary } from '@/lib/cloudinary';
import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, RefreshCw } from 'lucide-react';
import { Button, Input, Select, Badge, Modal } from '@/components/ui';
import { useProductStore, useCategoryStore } from '@/store';
import type { Product } from '@/types';
import { supabase } from '@/lib/supabase';
import { UploadCloud } from 'lucide-react';
import { GripVertical } from 'lucide-react';


const emptyProduct: any = {
  name: '', slug: '', description: '', shortDescription: '',
  price: 0, comparePrice: undefined, images: [],
  category: '', categorySlug: '',
  sizes: [], colors: [], stock: 0, sku: '', tags: [],
  isFeatured: false, isTrending: false, isNewArrival: false, isOnSale: false,
  customText: '',
};

// ─────────────────────────────────────────────────
// FASHION COLOR MAP — 50+ names → real hex values
// Covers common Bangladeshi/South-Asian fashion terms
// ─────────────────────────────────────────────────
const FASHION_COLORS: Record<string, string> = {
  // Reds & Pinks
  'red': '#E53E3E',
  'dark red': '#9B2335',
  'crimson': '#DC143C',
  'maroon': '#800000',
  'burgundy': '#722F37',
  'wine': '#722F37',
  'pink': '#FFC0CB',
  'hot pink': '#FF69B4',
  'baby pink': '#F4C2C2',
  'light pink': '#FFB6C1',
  'magenta': '#FF00FF',
  'blush': '#FADADD',
  'rose': '#FF007F',
  'rose gold': '#B76E79',
  'dusty rose': '#DCAE96',
  'coral': '#FF6B6B',
  'salmon': '#FA8072',
  'peach': '#FFCBA4',

  // Blues
  'blue': '#3182CE',
  'navy': '#001F5B',
  'navy blue': '#001F5B',
  'royal blue': '#4169E1',
  'sky blue': '#87CEEB',
  'baby blue': '#89CFF0',
  'powder blue': '#B0E0E6',
  'teal': '#008080',
  'turquoise': '#40E0D0',
  'aqua': '#00FFFF',
  'denim': '#1560BD',
  'indigo': '#4B0082',
  'cobalt': '#0047AB',

  // Greens
  'green': '#38A169',
  'dark green': '#006400',
  'forest green': '#228B22',
  'olive': '#808000',
  'olive green': '#6B8E23',
  'mint': '#98FF98',
  'mint green': '#98FF98',
  'sage': '#BCB88A',
  'emerald': '#50C878',
  'lime': '#00FF00',
  'army green': '#4B5320',

  // Yellows & Oranges
  'yellow': '#F6E05E',
  'golden': '#FFD700',
  'gold': '#FFD700',
  'mustard': '#FFDB58',
  'mustard yellow': '#FFDB58',
  'orange': '#ED8936',
  'burnt orange': '#CC5500',
  'amber': '#FFBF00',
  'lemon': '#FFF44F',

  // Purples
  'purple': '#805AD5',
  'violet': '#8F00FF',
  'lavender': '#E6E6FA',
  'lilac': '#C8A2C8',
  'plum': '#8E4585',
  'mauve': '#E0B0FF',
  'grape': '#6F2DA8',

  // Neutrals & Skin Tones
  'white': '#FFFFFF',
  'off white': '#FAF9F6',
  'cream': '#FFFDD0',
  'ivory': '#FFFFF0',
  'beige': '#F5F5DC',
  'skin': '#FED9B0',
  'nude': '#E3BC9A',
  'tan': '#D2B48C',
  'camel': '#C19A6B',
  'khaki': '#C3B091',
  'brown': '#A0522D',
  'chocolate': '#7B3F00',
  'coffee': '#6F4E37',
  'mocha': '#967259',

  // Greys & Black
  'grey': '#808080',
  'gray': '#808080',
  'light grey': '#D3D3D3',
  'dark grey': '#404040',
  'charcoal': '#36454F',
  'silver': '#C0C0C0',
  'black': '#000000',

  // Special Fashion
  'copper': '#B87333',
  'bronze': '#CD7F32',
  'champagne': '#F7E7CE',
  'steel blue': '#4682B4',
  'rust': '#B7410E',
  'terracotta': '#E2725B',
  'cyan': '#00BCD4',
  'fuchsia': '#FF00FF',
  'shocking pink': '#FC0FC0',
};

/**
 * Resolves a color string to a real CSS color:
 * 1. Checks FASHION_COLORS map (case-insensitive)
 * 2. Tries browser CSS parsing (handles hex, rgb(), named CSS colors)
 * 3. Falls back to grey
 */
const resolveColor = (input: string): string => {
  const normalized = input.trim().toLowerCase();
  if (FASHION_COLORS[normalized]) return FASHION_COLORS[normalized];

  // Try hex directly
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)) return normalized;

  // Try browser CSS parser
  const s = new Option().style;
  s.color = normalized;
  if (s.color !== '') return normalized;

  return '#cccccc'; // unknown → grey
};

export const AdminProducts: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, fetchProducts } = useProductStore();
  const { categories } = useCategoryStore();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyProduct); const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);



  // Color input state
  const [colorInput, setColorInput] = useState('');

  // Size free-text input state
  const [sizeInput, setSizeInput] = useState('');

  useEffect(() => { fetchProducts(); }, []);

  // ── Auto-generate SKU from product name ──
  const generateSKU = (name: string): string => {
    if (!name.trim()) return '';
    const words = name.trim().toUpperCase().split(/\s+/);
    const prefix = words.map(w => w.slice(0, 3)).join('-');
    const suffix = Date.now().toString().slice(-4);
    return `AG-${prefix}-${suffix}`;
  };

  const handleNameChange = (name: string) => {
    const newForm: Partial<Product> = { ...form, name };
    if (!form.sku || form.sku.startsWith('AG-')) {
      newForm.sku = generateSKU(name);
    }
    setForm(newForm);
  };

  // ── Add a color ──
  const addColor = () => {
    const c = colorInput.trim();
    if (!c) return;
    const colors = form.colors || [];
    if (!colors.includes(c)) {
      setForm({ ...form, colors: [...colors, c] });
    }
    setColorInput('');
  };

  const removeColor = (color: string) => {
    setForm({ ...form, colors: (form.colors || []).filter((c: string) => c !== color) });
  };

  // ── Add sizes from free-text ──
  const addSizes = () => {
    if (!sizeInput.trim()) return;
    const newSizes = sizeInput.split(',').map(s => s.trim()).filter(Boolean);
    const existing = form.sizes || [];
    const merged = [...new Set([...existing, ...newSizes])];
    setForm({ ...form, sizes: merged });
    setSizeInput('');
  };

  const removeSize = (size: string) => {
    setForm({ ...form, sizes: (form.sizes || []).filter((s: string) => s !== size) });
  };
  const filtered = products.filter(p => {
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = !filterCategory || p.categorySlug === filterCategory;
    return matchesSearch && matchesCat;
  });

  const openAdd = () => {
    setEditingId(null);
    setImageFiles([]);
    setVideoFile(null);
    setVideoPreviewUrl('');
    setColorInput('');
    setSizeInput('');
    setForm({
      ...emptyProduct,
      id: '',
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rating: 0,
      reviewCount: 0,
    });
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setImageFiles([]);
    setVideoFile(null);
    setVideoPreviewUrl((product as any).videoUrl || '');
    setColorInput('');
    setSizeInput('');
    setForm({ ...product });
    setShowModal(true);
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];

    for (const file of files) {
      try {
        const url = await uploadToCloudinary(file);
        urls.push(url);
      } catch (err) {
        console.error('Cloudinary upload failed:', err);
      }
    }

    return urls;
  };

  const uploadVideo = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();

      formData.append('file', file);
      formData.append(
        'upload_preset',
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
      );

      const cloudName =
        import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await res.json();
      console.log(data);

      return data.secure_url;
    } catch (err) {
      console.error(err);
      return '';
    }
  };
  const handleSave = async () => {
    try {
      const slug = form.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || '';
      const cat = categories.find(c => c.name === form.category);

      let finalImages = (form.images || []).filter((img: string) => img.startsWith('http'));
      if (imageFiles.length > 0) {
        setUploading(true);
        const uploaded = await uploadImages(imageFiles);
        finalImages = [...finalImages, ...uploaded];
      }

      let finalVideoUrl = (form as any).videoUrl || '';
      if (videoFile) {
        finalVideoUrl = await uploadVideo(videoFile);
      }
      setUploading(false);

      const payload = {
        name: form.name, slug,
        description: form.description,
        short_description: form.shortDescription,
        images: finalImages,
        video_url: finalVideoUrl || null,
        price: form.price,
        compare_price: form.comparePrice || null,
        category_name: form.category,
        category_slug: cat?.slug || form.categorySlug || '',
        sizes: form.sizes || [],
        colors: form.colors || [],
        stock: form.stock || 0,
        sku: form.sku || null,
        tags: form.tags || [],
        custom_text: form.customText || '',
        is_featured: form.isFeatured || false,
        is_trending: form.isTrending || false,
        is_new_arrival: form.isNewArrival || false,
        is_on_sale: form.isOnSale || false,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingId);
        if (error) throw error;
        updateProduct(editingId, {
          ...form, slug, images: finalImages,
          categorySlug: cat?.slug || form.categorySlug || '',
          videoUrl: finalVideoUrl,
          customText: form.customText || '',
          updatedAt: new Date().toISOString(),
        } as any);
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([{ ...payload, is_active: true, rating: 0, review_count: 0, created_at: new Date().toISOString() }])
          .select();
        if (error) throw error;
        addProduct({
          ...form, id: data[0].id, slug, images: finalImages,
          categorySlug: cat?.slug || '',
          videoUrl: finalVideoUrl,
          customText: form.customText || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rating: 0, reviewCount: 0,
        } as Product);
      }

      setImageFiles([]);
      setVideoFile(null);
      setShowModal(false);
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
      alert('Error saving product. Check browser console (F12) for details.');
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    deleteProduct(id);
  };

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="heading-serif text-2xl md:text-3xl font-bold text-charcoal">Products</h1>
          <p className="text-[#6B5B55] text-sm">{products.length} total products</p>
        </div>
        <Button onClick={openAdd}><Plus size={16} /> Add Product</Button>
      </div>

      {/* ── Search & Filter ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5B55]" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30"
          />
        </div>
        <Select
          options={[{ value: '', label: 'All Categories' }, ...categories.map(c => ({ value: c.slug, label: c.name }))]}
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="!w-auto"
        />
      </div>

      {/* ── Products Table ── */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blush/20 bg-blush-light/20">
                <th className="text-left py-3 px-4 text-[#6B5B55] font-medium">Product</th>
                <th className="text-left py-3 px-4 text-[#6B5B55] font-medium">Category</th>
                <th className="text-left py-3 px-4 text-[#6B5B55] font-medium">Price</th>
                <th className="text-left py-3 px-4 text-[#6B5B55] font-medium">Stock</th>
                <th className="text-left py-3 px-4 text-[#6B5B55] font-medium">Status</th>
                <th className="text-right py-3 px-4 text-[#6B5B55] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
                <tr key={product.id} className="border-b border-blush/10 last:border-0 hover:bg-blush-light/10 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {product.images?.[0]?.startsWith('http') ? (
                        <img src={product.images[0]} alt={product.name} className="w-10 h-12 object-cover rounded-lg flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-12 rounded-lg bg-gradient-to-br from-blush to-lavender flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-charcoal line-clamp-1">{product.name}</p>
                        <p className="text-xs text-[#6B5B55]">{product.sku}</p>
                        {/* Color swatches in table row */}
                        {(product.colors || []).length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {(product.colors || []).slice(0, 5).map((color: any) => (
                              <div
                                key={String(color)}
                                className="w-3 h-3 rounded-full border border-white shadow-sm"
                                style={{ backgroundColor: resolveColor(String(color)) }}
                                title={String(color)}
                              />
                            ))}
                            {(product.colors || []).length > 5 && (
                              <span className="text-xs text-[#6B5B55]">+{(product.colors || []).length - 5}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#6B5B55]">{product.category}</td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-charcoal">৳{product.price.toFixed(0)}</span>
                    {product.comparePrice && (
                      <span className="text-xs text-[#6B5B55] line-through ml-1">৳{product.comparePrice.toFixed(0)}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${product.stock <= 10 ? 'text-red-500' : 'text-charcoal'}`}>{product.stock}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1 flex-wrap">
                      {product.isFeatured && <Badge variant="featured">Featured</Badge>}
                      {product.isOnSale && <Badge variant="sale">Sale</Badge>}
                      {product.isNewArrival && <Badge variant="new">New</Badge>}
                      {product.isTrending && <Badge variant="trending">Trending</Badge>}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(product)} className="p-2 rounded-lg hover:bg-blush-light/50 text-[#6B5B55] hover:text-rose-gold transition-colors"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 rounded-lg hover:bg-red-50 text-[#6B5B55] hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="text-center py-12 text-[#6B5B55]">No products found</div>}
      </div>

      {/* ════════════════════════════════════════
          ADD / EDIT MODAL
          ════════════════════════════════════════ */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Product' : 'Add Product'} size="xl">
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">

          {/* ── Basic Info ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Product Name"
              value={form.name || ''}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="e.g. Silk Evening Gown"
            />

            {/* SKU with refresh */}
            <div>
              <label className="block text-sm font-medium text-[#6B5B55] mb-1.5">SKU (auto-generated)</label>
              <div className="flex gap-2">
                <input
                  value={form.sku || ''}
                  onChange={e => setForm({ ...form, sku: e.target.value })}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30"
                  placeholder="Auto-filled from name"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, sku: generateSKU(form.name || '') })}
                  className="px-3 py-2 rounded-xl bg-blush-light hover:bg-blush transition-colors"
                  title="Regenerate SKU"
                >
                  <RefreshCw size={14} className="text-[#6B5B55]" />
                </button>
              </div>
            </div>

            <Input
              label="Price (৳)"
              type="number"
              value={form.price?.toString() || ''}
              onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Compare Price (৳) — strike-through"
              type="number"
              value={form.comparePrice?.toString() || ''}
              onChange={e => setForm({ ...form, comparePrice: parseFloat(e.target.value) || undefined })}
            />

            <Select
              label="Category"
              options={[{ value: '', label: 'Select category' }, ...categories.map(c => ({ value: c.name, label: c.name }))]}
              value={form.category || ''}
              onChange={e => {
                const cat = categories.find(c => c.name === e.target.value);
                setForm({ ...form, category: e.target.value, categorySlug: cat?.slug || '' });
              }}
            />
            <Input
              label="Stock"
              type="number"
              value={form.stock?.toString() || ''}
              onChange={e => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
            />
          </div>

          {/* ── Descriptions ── */}
          <div>
            <label className="block text-sm font-medium text-[#6B5B55] mb-1.5">Short Description</label>
            <input
              value={form.shortDescription || ''}
              onChange={e => setForm({ ...form, shortDescription: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30"
              placeholder="One line shown on product cards"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B5B55] mb-1.5">Full Description</label>
            <textarea
              value={form.description || ''}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 resize-none"
              rows={3}
              placeholder="Detailed product description shown on product detail page"
            />
          </div>

          {/* ── DRAG & DROP IMAGES ── */}
          <div>
            <label className="block text-sm font-medium text-[#6B5B55] mb-2">
              Product Images
            </label>

            <div
              onDragEnter={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);

                const files = Array.from(e.dataTransfer.files).filter(file =>
                  file.type.startsWith('image/')
                );

                setImageFiles(prev => [...prev, ...files]);
              }}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all
      ${dragActive
                  ? 'border-rose-gold bg-blush-light/40'
                  : 'border-blush/40 bg-white/60'
                }`}
            >
              <UploadCloud className="mx-auto mb-3 text-rose-gold" size={40} />

              <p className="text-sm font-medium text-charcoal mb-1">
                Drag & Drop Product Images
              </p>

              <p className="text-xs text-[#6B5B55] mb-4">
                JPG, PNG, WEBP supported
              </p>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    setImageFiles(prev => [
                      ...prev,
                      ...Array.from(e.target.files || [])
                    ]);
                  }
                }}
                className="hidden"
                id="product-image-upload"
              />

              <label
                htmlFor="product-image-upload"
                className="inline-flex items-center px-4 py-2 rounded-xl bg-rose-gold text-white text-sm cursor-pointer hover:opacity-90"
              >
                Browse Images
              </label>
            </div>

            {imageFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {imageFiles.map((file, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragIndex === null) return;

                      const updated = [...imageFiles];

                      const draggedItem = updated[dragIndex];

                      updated.splice(dragIndex, 1);

                      updated.splice(i, 0, draggedItem);

                      setImageFiles(updated);

                      setDragIndex(null);
                    }}
                    className="relative group rounded-xl overflow-hidden border border-blush/30 bg-white"
                  >
                    {/* Drag Icon */}
                    <div className="absolute top-2 left-2 z-10 bg-white/80 rounded-full p-1 shadow">
                      <GripVertical size={14} className="text-charcoal" />
                    </div>

                    {/* Image */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="w-full h-32 object-cover"
                    />

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setImageFiles(prev =>
                          prev.filter((_, index) => index !== i)
                        )
                      }
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>

                    {/* Cover Badge */}
                    {i === 0 && (
                      <div className="absolute bottom-2 left-2 bg-rose-gold text-white text-[10px] px-2 py-1 rounded-full shadow">
                        Cover
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* ── Video Upload ── */}
          {/* ── DRAG & DROP VIDEO ── */}
          <div>
            <label className="block text-sm font-medium text-[#6B5B55] mb-2">
              Product Video
            </label>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();

                const file = Array.from(e.dataTransfer.files).find(file =>
                  file.type.startsWith('video/')
                );

                if (file) {
                  setVideoFile(file);
                  setVideoPreviewUrl(URL.createObjectURL(file));
                }
              }}
              className="border-2 border-dashed border-blush/40 rounded-2xl p-6 text-center bg-white/60"
            >
              <UploadCloud className="mx-auto mb-3 text-rose-gold" size={36} />

              <p className="text-sm font-medium text-charcoal mb-1">
                Drag & Drop Product Video
              </p>

              <input
                type="file"
                accept="video/*"
                hidden
                id="video-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    setVideoFile(file);
                    setVideoPreviewUrl(URL.createObjectURL(file));
                  }
                }}
              />

              <label
                htmlFor="video-upload"
                className="inline-flex items-center px-4 py-2 rounded-xl bg-rose-gold text-white text-sm cursor-pointer hover:opacity-90 mt-3"
              >
                Browse Video
              </label>
            </div>

            {videoPreviewUrl && (
              <video
                src={videoPreviewUrl}
                controls
                className="mt-4 w-full rounded-2xl border border-blush/30"
              />
            )}
          </div>

          {/* ════════════════════════════════════════
              COLORS — type name or hex, auto-resolved
              ════════════════════════════════════════ */}
          <div>
            <label className="block text-sm font-medium text-[#6B5B55] mb-0.5">
              Colors
            </label>
            <p className="text-xs text-[#6B5B55] mb-2">
              Type color name (e.g. <span className="text-charcoal font-medium">red, navy, rose gold, maroon</span>) or hex (e.g. <span className="text-charcoal font-medium">#FF5733</span>). Press Enter or click Add. Add multiple colors one by one.
            </p>

            {/* Input row */}
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <input
                  value={colorInput}
                  onChange={e => setColorInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }}
                  className="w-full px-4 py-2.5 rounded-xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30"
                  placeholder="e.g. red  or  #B76E79  or  rose gold  or  navy blue"
                />
              </div>
              {/* Live color preview circle */}
              <div
                className="w-11 h-11 rounded-xl border-2 border-blush/40 flex-shrink-0 transition-all"
                style={{
                  backgroundColor: colorInput.trim() ? resolveColor(colorInput) : '#f0f0f0',
                }}
                title={colorInput || 'preview'}
              />
              <Button size="sm" onClick={addColor} type="button">Add</Button>
            </div>

            {/* Quick common color buttons */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                ['White', '#FFFFFF'],
                ['Black', '#000000'],
                ['Red', '#E53E3E'],
                ['Maroon', '#800000'],
                ['Navy', '#001F5B'],
                ['Pink', '#FFC0CB'],
                ['Rose Gold', '#B76E79'],
                ['Green', '#38A169'],
                ['Yellow', '#F6E05E'],
                ['Orange', '#ED8936'],
                ['Purple', '#805AD5'],
                ['Skin', '#FED9B0'],
                ['Beige', '#F5F5DC'],
                ['Grey', '#808080'],
                ['Teal', '#008080'],
              ].map(([name, hex]) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    if (!(form.colors || []).includes(name)) {
                      setForm({ ...form, colors: [...(form.colors || []), name] });
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-blush/20 bg-white hover:bg-blush-light/40 transition-colors"
                >
                  <span className="w-3 h-3 rounded-full border border-white/80 shadow-sm flex-shrink-0" style={{ backgroundColor: hex }} />
                  {name}
                </button>
              ))}
            </div>

            {/* Selected colors */}
            {(form.colors || []).length > 0 && (
              <>
                <p className="text-xs text-[#6B5B55] mb-2">Selected ({(form.colors || []).length}):</p>
                <div className="flex flex-wrap gap-2">
                  {(form.colors || []).map((color: string) => (
                    <div
                      key={String(color)}
                      className="flex items-center gap-1.5 bg-white border border-blush/20 rounded-full px-3 py-1.5 shadow-sm"
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-gray-200 shadow-sm flex-shrink-0"
                        style={{ backgroundColor: resolveColor(String(color)) }}
                        title={resolveColor(String(color))}
                      />
                      <span className="text-xs text-charcoal font-medium">{String(color)}</span>
                      <button
                        type="button"
                        onClick={() => removeColor(String(color))}
                        className="text-[#6B5B55] hover:text-red-500 ml-0.5 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ════════════════════════════════════════
              SIZES — free text input (ALWAYS VISIBLE)
              ════════════════════════════════════════ */}
          <div>
            <label className="block text-sm font-medium text-[#6B5B55] mb-0.5">
              Sizes
            </label>
            <p className="text-xs text-[#6B5B55] mb-2">
              Type any sizes separated by commas (e.g. <span className="text-charcoal font-medium">XS, S, M, L, XL</span> or <span className="text-charcoal font-medium">Free Size</span> or <span className="text-charcoal font-medium">32, 34, 36, 38</span>) then click Add.
            </p>

            {/* Free text input — ALWAYS RENDERED, no conditional */}
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={sizeInput}
                onChange={e => setSizeInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSizes(); } }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30"
                placeholder="e.g.  S, M, L   or   Free Size   or   32, 34, 36"
              />
              <Button size="sm" onClick={addSizes} type="button">Add</Button>
            </div>

            {/* Quick preset buttons */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { label: 'XS–XXL', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
                { label: 'Free Size', sizes: ['Free Size'] },
                { label: '32–40 (bra/chest)', sizes: ['32', '34', '36', '38', '40'] },
                { label: '28–36 (waist)', sizes: ['28', '30', '32', '34', '36'] },
                { label: 'S–XXL only', sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
              ].map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    const existing = form.sizes || [];
                    setForm({ ...form, sizes: [...new Set([...existing, ...preset.sizes])] });
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-blush-light/60 text-[#6B5B55] hover:bg-blush-light transition-colors border border-blush/20"
                >
                  + {preset.label}
                </button>
              ))}
            </div>

            {/* Selected sizes as tags */}
            {(form.sizes || []).length > 0 && (
              <>
                <p className="text-xs text-[#6B5B55] mb-2">Selected ({(form.sizes || []).length}):</p>
                <div className="flex flex-wrap gap-2">
                  {(form.sizes || []).map((size: string) => (
                    <div key={String(size)} className="flex items-center gap-1 bg-rose-gold/10 text-rose-gold rounded-full px-3 py-1 border border-rose-gold/20">
                      <span className="text-xs font-medium">{String(size)}</span>
                      <button type="button" onClick={() => removeSize(String(size))} className="hover:text-red-500 ml-1 transition-colors">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Custom Product Detail Text ── */}
          <div>
            <label className="block text-sm font-medium text-[#6B5B55] mb-1.5">
              Custom Product Detail Text
            </label>

            <textarea
              value={form.customText || ''}
              onChange={e => setForm({ ...form, customText: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 resize-none"
              rows={5}
              placeholder="Write custom product information, offer, sizing help, delivery notes, fabric details etc."
            />
          </div>
          {/* ── CUSTOM PRODUCT ASSEMBLY ── */}
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isCustomAssembly || false}
                onChange={(e) =>
                  setForm({
                    ...form,
                    isCustomAssembly: e.target.checked,
                  })
                }
              />

              <span className="text-sm font-medium text-charcoal">
                Enable Product Assembly
              </span>
            </label>

            {form.isCustomAssembly && (
              <div>
                <p className="text-xs text-[#6B5B55] mb-2">
                  Add related products separated by commas
                </p>

                <input
                  type="text"
                  placeholder="e.g. Hijab, Bag, Shoes"
                  value={(form.assembledProducts || []).join(', ')}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      assembledProducts: e.target.value
                        .split(',')
                        .map(item => item.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-blush/30 bg-white/80 text-sm"
                />
              </div>
            )}
          </div>
          {/* ── Tags ── */}
          <div>
            <label className="block text-sm font-medium text-[#6B5B55] mb-1.5">Tags (comma separated)</label>
            <input
              value={(form.tags || []).join(', ')}
              onChange={e => setForm({ ...form, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              className="w-full px-4 py-2.5 rounded-xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30"
              placeholder="e.g. silk, evening, luxury"
            />
          </div>

          {/* ── Labels / Badges ── */}
          <div>
            <label className="block text-sm font-medium text-[#6B5B55] mb-2">Product Labels</label>
            <div className="flex flex-wrap gap-4">
              {(['isFeatured', 'isTrending', 'isNewArrival', 'isOnSale'] as const).map(key => (
                <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.checked })}
                    className="w-4 h-4 rounded accent-rose-gold"
                  />
                  <span className="text-sm text-charcoal">
                    {key.replace('is', '').replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex justify-end gap-3 pt-4 border-t border-blush/20">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={uploading}>
              {uploading ? 'Uploading...' : editingId ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>

        </div>
      </Modal>
    </div>
  );
};