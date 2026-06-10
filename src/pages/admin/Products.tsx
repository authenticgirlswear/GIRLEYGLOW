/* ===================================================
   AUTHENTIC GIRLSWEAR - Admin Products Management
   FIXES:
   - Robust image upload: per-file retry (3 attempts) + failed-image alert
   - setUploading(false) always called via finally block
   - All images draggable including cover (no special first-image lock)
   - Cover badge always follows index 0, not a fixed file
   - WatermarkPreview shown for whichever image is at index 0
   =================================================== */
import { uploadToCloudinary } from '@/lib/cloudinary';
import React, { useEffect, useRef, useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, RefreshCw } from 'lucide-react';
import { Button, Input, Select, Badge, Modal } from '@/components/ui';
import { useProductStore, useCategoryStore } from '@/store';
import type { Product } from '@/types';
import { supabase } from '@/lib/supabase';
import { UploadCloud } from 'lucide-react';
import { GripVertical } from 'lucide-react';

// ─────────────────────────────────────────────────
// WATERMARK POSITION — module-level mutable ref
// ─────────────────────────────────────────────────
let wmPos: { xFrac: number; yFrac: number } = { xFrac: 0.82, yFrac: 0.90 };

// ─────────────────────────────────────────────────
// FASHION COLOR MAP — 50+ names → real hex values
// ─────────────────────────────────────────────────
const FASHION_COLORS: Record<string, string> = {
  'red': '#E53E3E', 'dark red': '#9B2335', 'crimson': '#DC143C',
  'maroon': '#800000', 'burgundy': '#722F37', 'wine': '#722F37',
  'pink': '#FFC0CB', 'hot pink': '#FF69B4', 'baby pink': '#F4C2C2',
  'light pink': '#FFB6C1', 'magenta': '#FF00FF', 'blush': '#FADADD',
  'rose': '#FF007F', 'rose gold': '#B76E79', 'dusty rose': '#DCAE96',
  'coral': '#FF6B6B', 'salmon': '#FA8072', 'peach': '#FFCBA4',
  'blue': '#3182CE', 'navy': '#001F5B', 'navy blue': '#001F5B',
  'royal blue': '#4169E1', 'sky blue': '#87CEEB', 'baby blue': '#89CFF0',
  'powder blue': '#B0E0E6', 'teal': '#008080', 'turquoise': '#40E0D0',
  'aqua': '#00FFFF', 'denim': '#1560BD', 'indigo': '#4B0082',
  'cobalt': '#0047AB', 'green': '#38A169', 'dark green': '#006400',
  'forest green': '#228B22', 'olive': '#808000', 'olive green': '#6B8E23',
  'mint': '#98FF98', 'mint green': '#98FF98', 'sage': '#BCB88A',
  'emerald': '#50C878', 'lime': '#00FF00', 'army green': '#4B5320',
  'yellow': '#F6E05E', 'golden': '#FFD700', 'gold': '#FFD700',
  'mustard': '#FFDB58', 'mustard yellow': '#FFDB58', 'orange': '#ED8936',
  'burnt orange': '#CC5500', 'amber': '#FFBF00', 'lemon': '#FFF44F',
  'purple': '#805AD5', 'violet': '#8F00FF', 'lavender': '#E6E6FA',
  'lilac': '#C8A2C8', 'plum': '#8E4585', 'mauve': '#E0B0FF',
  'grape': '#6F2DA8', 'white': '#FFFFFF', 'off white': '#FAF9F6',
  'cream': '#FFFDD0', 'ivory': '#FFFFF0', 'beige': '#F5F5DC',
  'skin': '#FED9B0', 'nude': '#E3BC9A', 'tan': '#D2B48C',
  'camel': '#C19A6B', 'khaki': '#C3B091', 'brown': '#A0522D',
  'chocolate': '#7B3F00', 'coffee': '#6F4E37', 'mocha': '#967259',
  'grey': '#808080', 'gray': '#808080', 'light grey': '#D3D3D3',
  'dark grey': '#404040', 'charcoal': '#36454F', 'silver': '#C0C0C0',
  'black': '#000000', 'copper': '#B87333', 'bronze': '#CD7F32',
  'champagne': '#F7E7CE', 'steel blue': '#4682B4', 'rust': '#B7410E',
  'terracotta': '#E2725B', 'cyan': '#00BCD4', 'fuchsia': '#FF00FF',
  'shocking pink': '#FC0FC0',
};

const resolveColor = (input: string): string => {
  const normalized = input.trim().toLowerCase();
  if (FASHION_COLORS[normalized]) return FASHION_COLORS[normalized];
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)) return normalized;
  const s = new Option().style;
  s.color = normalized;
  if (s.color !== '') return normalized;
  return '#cccccc';
};

// ─────────────────────────────────────────────────
// DRAW AG LOGO WATERMARK
// ─────────────────────────────────────────────────
const drawAGLogo = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) => {
  ctx.save();
  ctx.textBaseline = 'alphabetic';

  const gap = size * 0.04;

  ctx.font = `900 ${size}px Arial, sans-serif`;
  const aWidth = ctx.measureText('A').width;
  const gWidth = ctx.measureText('G').width;
  const totalAGWidth = aWidth + gWidth + gap * 2;

  const boxW = totalAGWidth + size * 0.6;
  const boxH = size + size * 0.5;

  const boxX = x - boxW / 2;
  const boxY = y - size - size * 0.25;
  const radius = size * 0.22;

  ctx.globalAlpha = 0.52;
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(boxX + radius, boxY);
  ctx.lineTo(boxX + boxW - radius, boxY);
  ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + radius);
  ctx.lineTo(boxX + boxW, boxY + boxH - radius);
  ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - radius, boxY + boxH);
  ctx.lineTo(boxX + radius, boxY + boxH);
  ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - radius);
  ctx.lineTo(boxX, boxY + radius);
  ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 0.92;
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = size * 0.35;
  ctx.shadowOffsetX = size * 0.04;
  ctx.shadowOffsetY = size * 0.04;

  ctx.font = `900 ${size}px Arial, sans-serif`;
  ctx.fillStyle = '#C0C0C0';
  ctx.textAlign = 'right';
  ctx.fillText('A', x - gap, y);

  ctx.fillStyle = '#F5A623';
  ctx.textAlign = 'left';
  ctx.fillText('G', x + gap, y);

  // subtitle removed — AG only

  ctx.restore();
};

// ─────────────────────────────────────────────────
// WATERMARK A FILE with retry-safe canvas approach
// ─────────────────────────────────────────────────
const applyWatermark = (file: File, sizeMultiplier = 1.0): Promise<File> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const size = Math.max(18, Math.min(img.width, img.height) * 0.08) * sizeMultiplier;
      const x = wmPos.xFrac * img.width;
      const y = wmPos.yFrac * img.height;

      drawAGLogo(ctx, x, y, size);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) { resolve(file); return; }
        resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
      }, 'image/jpeg', 0.92);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
};

// ─────────────────────────────────────────────────
// MINI THUMBNAIL with watermark overlay
// ─────────────────────────────────────────────────
const MiniWatermarkThumb: React.FC<{ file: File; xFrac: number; yFrac: number }> = ({ file, xFrac, yFrac }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const xRef = useRef(xFrac);
  const yRef = useRef(yFrac);

  xRef.current = xFrac;
  yRef.current = yFrac;

  const redraw = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const displayW = 300;
    const displayH = Math.round((img.naturalHeight / img.naturalWidth) * displayW);
    canvas.width = displayW;
    canvas.height = displayH;
    ctx.drawImage(img, 0, 0, displayW, displayH);
    const size = Math.max(10, Math.min(displayW, displayH) * 0.08);
    drawAGLogo(ctx, xRef.current * displayW, yRef.current * displayH, size);
  };

  useEffect(() => {
    imgRef.current = null;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      imgRef.current = img;
      redraw();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [file]);

  useEffect(() => {
    redraw();
  }, [xFrac, yFrac]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-xl"
      style={{ display: 'block', width: '100%', height: 'auto' }}
    />
  );
};

// ─────────────────────────────────────────────────
// WATERMARK PREVIEW — interactive canvas (cover image)
// ─────────────────────────────────────────────────
interface WatermarkPreviewProps {
  file: File;
  onPositionChange: (xFrac: number, yFrac: number) => void;
  sizeMultiplier?: number;
  enabled?: boolean;
}
const WatermarkPreview: React.FC<WatermarkPreviewProps> = ({ file, onPositionChange, sizeMultiplier = 1.0, enabled = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isDragging = useRef(false);
  const [pos, setPos] = useState<{ xFrac: number; yFrac: number }>(wmPos);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawFrame = (img: HTMLImageElement) => {
      const displayW = 800;
      const displayH = Math.round((img.naturalHeight / img.naturalWidth) * displayW);
      canvas.width = displayW;
      canvas.height = displayH;
      ctx.drawImage(img, 0, 0, displayW, displayH);
      const size = Math.max(18, Math.min(displayW, displayH) * 0.08) * sizeMultiplier;
      if (enabled) drawAGLogo(ctx, pos.xFrac * displayW, pos.yFrac * displayH, size);
    };

    if (imgRef.current) {
      drawFrame(imgRef.current);
    } else {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        imgRef.current = img;
        drawFrame(img);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  }, [pos, file, sizeMultiplier, enabled]);

  const getFrac = (e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      xFrac: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      yFrac: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  };

  const applyPos = (xFrac: number, yFrac: number) => {
    wmPos = { xFrac, yFrac };
    setPos({ xFrac, yFrac });
    onPositionChange(xFrac, yFrac);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const f = getFrac(e);
      applyPos(f.xFrac, f.yFrac);
    };
    const onMouseUp = () => { isDragging.current = false; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <div className="relative select-none">
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl cursor-crosshair"
        style={{ display: 'block', maxHeight: '380px', objectFit: 'contain', userSelect: 'none', WebkitUserDrag: 'none' } as React.CSSProperties}
        onMouseDown={(e) => { isDragging.current = true; const f = getFrac(e); applyPos(f.xFrac, f.yFrac); }}
        onDragStart={(e) => e.preventDefault()}
      />
      <p className="text-[10px] text-[#6B5B55] text-center mt-1 italic">
        Click or drag to reposition the AG watermark
      </p>

    </div>
  );
};

// ─────────────────────────────────────────────────
// EMPTY PRODUCT TEMPLATE
// ─────────────────────────────────────────────────
const emptyProduct: any = {
  name: '', slug: '', description: '', shortDescription: '',
  price: 0, comparePrice: undefined, images: [],
  category: '', categorySlug: '',
  sizes: [], colors: [], stock: 150, sku: '', tags: [],
  isFeatured: false, isTrending: false, isNewArrival: false, isOnSale: false,
  customText: '',
};

// ═════════════════════════════════════════════════
// ADMIN PRODUCTS COMPONENT
// ═════════════════════════════════════════════════
export const AdminProducts: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, fetchProducts } = useProductStore();
  const { categories } = useCategoryStore();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyProduct);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  // Drag-to-reorder state — works for ALL images including cover (index 0)
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [wmFrac, setWmFrac] = useState<{ xFrac: number; yFrac: number }>({ xFrac: 0.82, yFrac: 0.90 });
  const [wmSize, setWmSize] = useState<number>(1.0);
  const [wmEnabled, setWmEnabled] = useState<boolean>(true);
  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');

  useEffect(() => { fetchProducts(); }, []);

  // ── Auto-generate SKU ──
  const generateSKU = (name: string): string => {
    if (!name.trim()) return '';
    const words = name.trim().toUpperCase().split(/\s+/);
    const prefix = words.map((w: string) => w.slice(0, 3)).join('-');
    const suffix = Date.now().toString().slice(-4);
    return `AG-${prefix}-${suffix}`;
  };

  const handleNameChange = (name: string) => {
    const newForm: Partial<Product> = { ...form, name };
    if (!form.sku || form.sku.startsWith('AG-')) newForm.sku = generateSKU(name);
    setForm(newForm);
  };

  // ── Colors ──
  const addColor = () => {
    const c = colorInput.trim();
    if (!c) return;
    const colors = form.colors || [];
    if (!colors.includes(c)) setForm({ ...form, colors: [...colors, c] });
    setColorInput('');
  };
  const removeColor = (color: string) =>
    setForm({ ...form, colors: (form.colors || []).filter((c: string) => c !== color) });

  // ── Sizes ──
  const addSizes = () => {
    if (!sizeInput.trim()) return;
    const newSizes = sizeInput.split(',').map((s: string) => s.trim()).filter(Boolean);
    const existing = form.sizes || [];
    setForm({ ...form, sizes: [...new Set([...existing, ...newSizes])] });
    setSizeInput('');
  };
  const removeSize = (size: string) =>
    setForm({ ...form, sizes: (form.sizes || []).filter((s: string) => s !== size) });

  const filtered = products.filter((p: Product) => {
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = !filterCategory || p.categorySlug === filterCategory;
    return matchesSearch && matchesCat;
  });

  const resetModal = () => {
    setImageFiles([]);
    setVideoFile(null);
    setVideoPreviewUrl('');
    setColorInput('');
    setSizeInput('');
    setUploadProgress(null);
    wmPos = { xFrac: 0.82, yFrac: 0.90 };
    setWmFrac({ xFrac: 0.82, yFrac: 0.90 });
    setWmSize(1.0);
    setWmEnabled(true);
  };

  const openAdd = () => {
    setEditingId(null);
    resetModal();
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
    resetModal();
    setVideoPreviewUrl((product as any).videoUrl || '');
    setForm({
      ...product,
      images: product.images || [],
      colors: product.colors || [],
      sizes: product.sizes || [],
      tags: product.tags || [],
    });
    setShowModal(true);
  };

  // ────────────────────────────────────────────────
  // FIXED: uploadImages — per-file retry (3 attempts),
  // tracks progress, returns { urls, failedCount }
  // ────────────────────────────────────────────────
  const uploadImages = async (
    files: File[],
    onProgress: (done: number, total: number) => void,
    sizeMultiplier = 1.0
  ): Promise<{ urls: string[]; failedCount: number }> => {
    const urls: string[] = [];
    let failedCount = 0;

    for (let i = 0; i < files.length; i++) {
      let uploaded = false;

      // Apply watermark once, then retry the upload up to 3 times
      let watermarked: File;
      try {
        watermarked = wmEnabled ? await applyWatermark(files[i], sizeMultiplier) : files[i];
      } catch {
        watermarked = files[i];
      }

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const url = await uploadToCloudinary(watermarked);
          if (url) {
            urls.push(url);
            uploaded = true;
            break; // success — stop retrying
          }
        } catch (err) {
          console.warn(`Upload attempt ${attempt}/3 failed for "${files[i].name}":`, err);
          if (attempt < 3) {
            // Wait 1s before retry
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }

      if (!uploaded) {
        failedCount++;
        console.error(`All 3 attempts failed for "${files[i].name}"`);
      }

      onProgress(i + 1, files.length);
    }

    return { urls, failedCount };
  };

  const uploadVideo = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      return data.secure_url || '';
    } catch (err) {
      console.error('Video upload failed:', err);
      return '';
    }
  };

  // ────────────────────────────────────────────────
  // FIXED: handleSave — always calls setUploading(false)
  // via finally, alerts user if any images failed
  // ────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      setUploading(true);
      setUploadProgress(null);

      const baseSlug = form.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || '';
      const slug = editingId ? baseSlug : `${baseSlug}-${Date.now().toString().slice(-6)}`;
      const cat = categories.find((c: any) => c.name === form.category);

      // Keep existing uploaded images
      let finalImages = (form.images || []).filter((img: string) => img.startsWith('http'));

      // Upload new images with progress tracking
      let failedCount = 0;
      if (imageFiles.length > 0) {
        setUploadProgress({ done: 0, total: imageFiles.length });
        const result = await uploadImages(imageFiles, (done, total) => {
          setUploadProgress({ done, total });
        }, wmSize);
        finalImages = [...finalImages, ...result.urls];
        failedCount = result.failedCount;
      }

      // Upload video
      let finalVideoUrl = (form as any).videoUrl || '';
      if (videoFile) {
        finalVideoUrl = await uploadVideo(videoFile);
      }

      const payload = {
        name: form.name, slug,
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
      setUploadProgress(null);
      setShowModal(false);

      // Warn after save if some images failed
      if (failedCount > 0) {
        alert(`Product saved, but ${failedCount} image(s) failed to upload after 3 attempts. Please re-edit the product and re-upload the missing images.`);
      }

    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
      alert('Error saving product. Check browser console (F12) for details.');
    } finally {
      // ALWAYS reset uploading state — fixes the "stuck uploading" bug
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    deleteProduct(id);
  };

  const existingImages = (form.images || []).filter((img: string) => img.startsWith('http'));

  // ────────────────────────────────────────────────
  // FIXED: Unified drag-to-reorder for ALL new images
  // Index 0 = cover. ANY image can be moved to cover slot.
  // ────────────────────────────────────────────────
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...imageFiles];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setImageFiles(updated);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
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
          options={[{ value: '', label: 'All Categories' }, ...categories.map((c: any) => ({ value: c.slug, label: c.name }))]}
          value={filterCategory}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterCategory(e.target.value)}
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
              {filtered.map((product: Product) => (
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNameChange(e.target.value)}
              placeholder="e.g. Silk Evening Gown"
            />
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Compare Price (৳) — strike-through"
              type="number"
              value={form.comparePrice?.toString() || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, comparePrice: parseFloat(e.target.value) || undefined })}
            />
            <Select
              label="Category"
              options={[{ value: '', label: 'Select category' }, ...categories.map((c: any) => ({ value: c.name, label: c.name }))]}
              value={form.category || ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const cat = categories.find((c: any) => c.name === e.target.value);
                setForm({ ...form, category: e.target.value, categorySlug: cat?.slug || '' });
              }}
            />
            <Input
              label="Stock"
              type="number"
              value={form.stock?.toString() || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
            />
          </div>

          {/* ── EXISTING IMAGES (Edit Mode) ── */}
          {editingId && existingImages.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[#6B5B55] mb-2">
                Current Images ({existingImages.length})
                <span className="ml-2 text-xs font-normal text-[#6B5B55]/70">Drag to reorder · Click × to remove</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {existingImages.map((url: string, i: number) => (
                  <div
                    key={url}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i); }}
                    onDrop={() => {
                      if (dragIndex === null || dragIndex === i) { setDragIndex(null); setDragOverIndex(null); return; }
                      const updated = [...(form.images || [])];
                      const [moved] = updated.splice(dragIndex, 1);
                      updated.splice(i, 0, moved);
                      setForm({ ...form, images: updated });
                      setDragIndex(null);
                      setDragOverIndex(null);
                    }}
                    onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                    className={`relative group rounded-xl overflow-hidden border-2 bg-white shadow-sm cursor-grab transition-all
                      ${dragOverIndex === i ? 'border-rose-gold scale-95' : 'border-blush/30'}
                      ${dragIndex === i ? 'opacity-40' : 'opacity-100'}`}
                  >
                    <div className="absolute top-1 left-1 z-10 bg-white/80 rounded-full p-0.5 shadow">
                      <GripVertical size={12} className="text-charcoal" />
                    </div>
                    <img src={url} alt="" className="w-full h-32 object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, images: (form.images || []).filter((u: string) => u !== url) })}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors"
                    >
                      <X size={12} />
                    </button>
                    {i === 0 && (
                      <div className="absolute bottom-2 left-2 bg-rose-gold text-white text-[10px] px-2 py-1 rounded-full shadow">Cover</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── NEW IMAGES DROP ZONE ── */}
          <div>
            <label className="block text-sm font-medium text-[#6B5B55] mb-2">
              {editingId && existingImages.length > 0 ? 'Add More Images' : 'Product Images'}
              <span className="ml-2 text-xs font-normal text-[#6B5B55]/70">AG logo will be auto-watermarked ✓</span>
            </label>

            <div
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const files = Array.from(e.dataTransfer.files).filter((f: File) => f.type.startsWith('image/'));
                setImageFiles(prev => [...prev, ...files]);
              }}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all
                ${dragActive ? 'border-rose-gold bg-blush-light/40' : 'border-blush/40 bg-white/60'}`}
            >
              <UploadCloud className="mx-auto mb-3 text-rose-gold" size={40} />
              <p className="text-sm font-medium text-charcoal mb-1">Drag & Drop Product Images</p>
              <p className="text-xs text-[#6B5B55] mb-4">JPG, PNG, WEBP supported</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) setImageFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
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

            {/* ────────────────────────────────────────
                FIXED IMAGE GRID:
                - Index 0 gets full-width WatermarkPreview
                - ALL images (0 included) are draggable
                - Cover badge follows index 0 dynamically
                ──────────────────────────────────────── */}
            {imageFiles.length > 0 && (
              <div className="mt-4 space-y-3">

                {/* Cover image — full-width watermark preview */}
                <div
                  draggable
                  onDragStart={() => handleDragStart(0)}
                  onDragOver={(e) => handleDragOver(e, 0)}
                  onDrop={() => handleDrop(0)}
                  onDragEnd={handleDragEnd}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-grab
                    ${dragOverIndex === 0 ? 'border-rose-gold scale-[0.99]' : 'border-blush/30'}
                    ${dragIndex === 0 ? 'opacity-50' : 'opacity-100'}`}
                >
                  {/* Drag handle */}
                  <div className="absolute top-2 left-2 z-10 bg-white/80 rounded-full p-1 shadow cursor-grab">
                    <GripVertical size={14} className="text-charcoal" />
                  </div>
                  <WatermarkPreview
                    file={imageFiles[0]}
                    sizeMultiplier={wmSize}
                    enabled={wmEnabled}
                    onPositionChange={(xFrac: number, yFrac: number) => {
                      wmPos = { xFrac, yFrac };
                      setWmFrac({ xFrac, yFrac });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setImageFiles(prev => prev.filter((_, i) => i !== 0))}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center z-10 hover:bg-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                  {existingImages.length === 0 && (
                    <div className="absolute bottom-2 left-2 bg-rose-gold text-white text-[10px] px-2 py-1 rounded-full shadow z-10">
                      Cover — drag to reorder
                    </div>
                  )}
                </div>

                {/* Watermark controls — outside draggable div so slider doesn't trigger drag */}
                <div className="bg-blush-light/30 rounded-xl px-3 py-2.5 space-y-2 border border-blush/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#6B5B55]">Watermark</span>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <span className="text-xs text-[#6B5B55]">{wmEnabled ? 'Enabled' : 'Disabled'}</span>
                      <div
                        onClick={() => setWmEnabled(v => !v)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${wmEnabled ? 'bg-rose-gold' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${wmEnabled ? 'left-4' : 'left-0.5'}`} />
                      </div>
                    </label>
                  </div>
                  {wmEnabled && (
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-[#6B5B55] whitespace-nowrap">Logo Size</span>
                      <input
                        type="range"
                        min={0.4}
                        max={2.5}
                        step={0.05}
                        value={wmSize}
                        onChange={e => setWmSize(parseFloat(e.target.value))}
                        className="flex-1 accent-rose-gold"
                      />
                      <span className="text-[11px] text-[#6B5B55] w-8 text-right">{Math.round(wmSize * 100)}%</span>
                    </div>
                  )}
                </div>

                {/* Remaining images — draggable thumbnails */}
                {imageFiles.length > 1 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {imageFiles.slice(1).map((file: File, i: number) => {
                      const realIndex = i + 1;
                      return (
                        <div
                          key={realIndex}
                          draggable
                          onDragStart={() => handleDragStart(realIndex)}
                          onDragOver={(e) => handleDragOver(e, realIndex)}
                          onDrop={() => handleDrop(realIndex)}
                          onDragEnd={handleDragEnd}
                          className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-grab
                            ${dragOverIndex === realIndex ? 'border-rose-gold scale-95' : 'border-blush/30'}
                            ${dragIndex === realIndex ? 'opacity-40' : 'opacity-100'}`}
                        >
                          <div className="absolute top-1 left-1 z-10 bg-white/80 rounded-full p-0.5 shadow">
                            <GripVertical size={12} className="text-charcoal" />
                          </div>
                          <MiniWatermarkThumb file={file} xFrac={wmFrac.xFrac} yFrac={wmFrac.yFrac} />
                          <button
                            type="button"
                            onClick={() => setImageFiles(prev => prev.filter((_, idx) => idx !== realIndex))}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-500 transition-colors z-10"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <p className="text-[10px] text-[#6B5B55] italic text-center">
                  Drag any image to reorder — the top image will be the cover photo
                </p>
              </div>
            )}
          </div>

          {/* ── VIDEO ── */}
          <div>
            <label className="block text-sm font-medium text-[#6B5B55] mb-2">Product Video</label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = Array.from(e.dataTransfer.files).find((f: File) => f.type.startsWith('video/'));
                if (file) { setVideoFile(file); setVideoPreviewUrl(URL.createObjectURL(file)); }
              }}
              className="border-2 border-dashed border-blush/40 rounded-2xl p-6 text-center bg-white/60"
            >
              <UploadCloud className="mx-auto mb-3 text-rose-gold" size={36} />
              <p className="text-sm font-medium text-charcoal mb-1">Drag & Drop Product Video</p>
              <input type="file" accept="video/*" hidden id="video-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) { setVideoFile(file); setVideoPreviewUrl(URL.createObjectURL(file)); }
                }}
              />
              <label htmlFor="video-upload" className="inline-flex items-center px-4 py-2 rounded-xl bg-rose-gold text-white text-sm cursor-pointer hover:opacity-90 mt-3">
                Browse Video
              </label>
            </div>
            {videoPreviewUrl && (
              <video src={videoPreviewUrl} controls className="mt-4 w-full rounded-2xl border border-blush/30" />
            )}
          </div>

          {/* ── COLORS ── */}
          <div>
            <label className="block text-sm font-medium text-[#6B5B55] mb-0.5">Colors</label>
            <p className="text-xs text-[#6B5B55] mb-2">
              Type color name (e.g. <span className="text-charcoal font-medium">red, navy, rose gold, maroon</span>) or hex. Press Enter or click Add.
            </p>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <input
                  value={colorInput}
                  onChange={e => setColorInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }}
                  className="w-full px-4 py-2.5 rounded-xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30"
                  placeholder="e.g. red  or  #B76E79  or  rose gold"
                />
              </div>
              <div
                className="w-11 h-11 rounded-xl border-2 border-blush/40 flex-shrink-0 transition-all"
                style={{ backgroundColor: colorInput.trim() ? resolveColor(colorInput) : '#f0f0f0' }}
              />
              <Button size="sm" onClick={addColor} type="button">Add</Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                ['White', '#FFFFFF'], ['Black', '#000000'], ['Red', '#E53E3E'],
                ['Maroon', '#800000'], ['Navy', '#001F5B'], ['Pink', '#FFC0CB'],
                ['Rose Gold', '#B76E79'], ['Green', '#38A169'], ['Yellow', '#F6E05E'],
                ['Orange', '#ED8936'], ['Purple', '#805AD5'], ['Skin', '#FED9B0'],
                ['Beige', '#F5F5DC'], ['Grey', '#808080'], ['Teal', '#008080'],
              ].map(([name, hex]) => (
                <button key={name} type="button"
                  onClick={() => { if (!(form.colors || []).includes(name)) setForm({ ...form, colors: [...(form.colors || []), name] }); }}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-blush/20 bg-white hover:bg-blush-light/40 transition-colors"
                >
                  <span className="w-3 h-3 rounded-full border border-white/80 shadow-sm flex-shrink-0" style={{ backgroundColor: hex }} />
                  {name}
                </button>
              ))}
            </div>
            {(form.colors || []).length > 0 && (
              <>
                <p className="text-xs text-[#6B5B55] mb-2">Selected ({(form.colors || []).length}):</p>
                <div className="flex flex-wrap gap-2">
                  {(form.colors || []).map((color: string) => (
                    <div key={String(color)} className="flex items-center gap-1.5 bg-white border border-blush/20 rounded-full px-3 py-1.5 shadow-sm">
                      <div className="w-4 h-4 rounded-full border border-gray-200 shadow-sm flex-shrink-0" style={{ backgroundColor: resolveColor(String(color)) }} />
                      <span className="text-xs text-charcoal font-medium">{String(color)}</span>
                      <button type="button" onClick={() => removeColor(String(color))} className="text-[#6B5B55] hover:text-red-500 ml-0.5 transition-colors"><X size={10} /></button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── SIZES ── */}
          <div>
            <label className="block text-sm font-medium text-[#6B5B55] mb-0.5">Sizes</label>
            <p className="text-xs text-[#6B5B55] mb-2">
              Type sizes separated by commas (e.g. <span className="text-charcoal font-medium">XS, S, M, L, XL</span>) then click Add.
            </p>
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
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { label: 'XS–XXL', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
                { label: 'Free Size', sizes: ['Free Size'] },
                { label: '32–40 (bra/chest)', sizes: ['32', '34', '36', '38', '40'] },
                { label: '28–36 (waist)', sizes: ['28', '30', '32', '34', '36'] },
                { label: 'S–XXL only', sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
              ].map(preset => (
                <button key={preset.label} type="button"
                  onClick={() => { const existing = form.sizes || []; setForm({ ...form, sizes: [...new Set([...existing, ...preset.sizes])] }); }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-blush-light/60 text-[#6B5B55] hover:bg-blush-light transition-colors border border-blush/20"
                >
                  + {preset.label}
                </button>
              ))}
            </div>
            {(form.sizes || []).length > 0 && (
              <>
                <p className="text-xs text-[#6B5B55] mb-2">Selected ({(form.sizes || []).length}):</p>
                <div className="flex flex-wrap gap-2">
                  {(form.sizes || []).map((size: string) => (
                    <div key={String(size)} className="flex items-center gap-1 bg-rose-gold/10 text-rose-gold rounded-full px-3 py-1 border border-rose-gold/20">
                      <span className="text-xs font-medium">{String(size)}</span>
                      <button type="button" onClick={() => removeSize(String(size))} className="hover:text-red-500 ml-1 transition-colors"><X size={10} /></button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Description ── */}
          <div>
            <label className="block text-sm font-medium text-[#6B5B55] mb-1.5">
              Products Details / Description / Notes (optional)
            </label>
            <textarea
              value={form.customText || ''}
              onChange={e => setForm({ ...form, customText: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 resize-none"
              rows={5}
              placeholder="Write custom product information, offer, sizing help, delivery notes, fabric details etc."
            />
          </div>

          {/* ── Product Assembly ── */}
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isCustomAssembly || false}
                onChange={(e) => setForm({ ...form, isCustomAssembly: e.target.checked })} />
              <span className="text-sm font-medium text-charcoal">Enable Product Assembly</span>
            </label>
            {form.isCustomAssembly && (
              <div>
                <p className="text-xs text-[#6B5B55] mb-2">Add related products separated by commas</p>
                <input
                  type="text"
                  placeholder="e.g. Hijab, Bag, Shoes"
                  value={(form.assembledProducts || []).join(', ')}
                  onChange={(e) => setForm({ ...form, assembledProducts: e.target.value.split(',').map((item: string) => item.trim()).filter(Boolean) })}
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
              onChange={e => setForm({ ...form, tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) })}
              className="w-full px-4 py-2.5 rounded-xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30"
              placeholder="e.g. silk, evening, luxury"
            />
          </div>

          {/* ── Labels ── */}
          <div>
            <label className="block text-sm font-medium text-[#6B5B55] mb-2">Product Labels</label>
            <div className="flex flex-wrap gap-4">
              {(['isFeatured', 'isTrending', 'isNewArrival', 'isOnSale'] as const).map(key => (
                <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={!!form[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })} className="w-4 h-4 rounded accent-rose-gold" />
                  <span className="text-sm text-charcoal">{key.replace('is', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ── Footer with upload progress ── */}
          <div className="flex flex-col gap-3 pt-4 border-t border-blush/20">
            {/* Upload progress bar */}
            {uploading && uploadProgress && (
              <div className="w-full">
                <div className="flex justify-between text-xs text-[#6B5B55] mb-1">
                  <span>Uploading images...</span>
                  <span>{uploadProgress.done} / {uploadProgress.total}</span>
                </div>
                <div className="w-full bg-blush/20 rounded-full h-2">
                  <div
                    className="bg-rose-gold h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={uploading}>
                {uploading
                  ? uploadProgress
                    ? `Uploading ${uploadProgress.done}/${uploadProgress.total}...`
                    : 'Saving...'
                  : editingId ? 'Save Changes' : 'Add Product'}
              </Button>
            </div>
          </div>

        </div>
      </Modal>
    </div>
  );
};