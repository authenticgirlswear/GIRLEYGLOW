/* ===================================================
   AUTHENTIC GIRLSWEAR - Admin Categories Management
   Enhanced: image upload + collage showcase per category
   =================================================== */

import React, { useState, useRef, useCallback } from 'react';
import { Plus, Edit2, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';
import { useCategoryStore } from '@/store';
import type { Category } from '@/types';

/* ── Types ── */
// Extend Category with optional images array
type CategoryWithImages = Category & {
  images?: string[]; // base64 or object URLs
};

/* ── Collage component ── */
// Renders 1–4 uploaded images in a mosaic grid,
// falling back to the gradient if no images are present.
const CategoryCollage: React.FC<{
  images?: string[];
  gradient: string;
  alt: string;
}> = ({ images, gradient, alt }) => {
  const filled = (images ?? []).slice(0, 4);

  if (filled.length === 0) {
    return <div className="h-32 w-full" style={{ background: gradient }} />;
  }

  /* Layout configs per image count */
  const gridClass =
    filled.length === 1
      ? 'grid-cols-1 grid-rows-1'
      : filled.length === 2
        ? 'grid-cols-2 grid-rows-1'
        : filled.length === 3
          ? 'grid-cols-2 grid-rows-2'
          : 'grid-cols-2 grid-rows-2'; // 4

  return (
    <div className={`h-32 w-full grid ${gridClass} gap-0.5 overflow-hidden`}>
      {filled.map((src, i) => (
        <div
          key={i}
          className={`overflow-hidden ${filled.length === 3 && i === 0 ? 'row-span-2' : ''
            }`}
        >
          <img
            src={src}
            alt={`${alt} ${i + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
};

/* ── Dropzone inside modal ── */
const ImageDropzone: React.FC<{
  images: string[];
  onChange: (imgs: string[]) => void;
}> = ({ images, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const readFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const remaining = 4 - images.length;
      Array.from(files)
        .slice(0, remaining)
        .forEach((file) => {
          if (!file.type.startsWith('image/')) return;
          const reader = new FileReader();

          reader.onload = (e) => {
            const result = e.target?.result as string;
            onChange([...images, result].slice(0, 4));
          };
          reader.readAsDataURL(file);
        });
    },
    [images, onChange]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      readFiles(e.dataTransfer.files);
    },
    [readFiles]
  );

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-warm-gray mb-1.5">
        Category Images{' '}
        <span className="text-warm-gray/60 font-normal">
          (up to 4 — shown as a collage)
        </span>
      </label>

      {/* Thumbnail strip */}
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-2">
          {images.map((src, i) => (
            <div key={i} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-blush/30">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop target — only shown when under 4 images */}
      {images.length < 4 && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 h-24 rounded-2xl border-2 border-dashed border-blush/50 bg-white/50 cursor-pointer hover:bg-rose-50/50 hover:border-rose-gold/50 transition-all"
        >
          <Upload size={20} className="text-warm-gray/60" />
          <p className="text-xs text-warm-gray/60 text-center px-4">
            Drag & drop images here, or{' '}
            <span className="text-rose-gold font-medium">browse</span>
            <br />
            ({4 - images.length} slot{4 - images.length !== 1 ? 's' : ''} remaining)
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => readFiles(e.target.files)}
          />
        </div>
      )}
    </div>
  );
};

/* ── Main component ── */
export const AdminCategories: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } =
    useCategoryStore() as {
      categories: CategoryWithImages[];
      addCategory: (c: CategoryWithImages) => void;
      updateCategory: (id: string, c: Partial<CategoryWithImages>) => void;
      deleteCategory: (id: string) => void;
    };

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    name: string;
    description: string;
    gradient: string;
    images: string[];
  }>({
    name: '',
    description: '',
    gradient: 'linear-gradient(135deg, #F4C2C2, #E6E6FA)',
    images: [],
  });

  const gradients = [
    'linear-gradient(135deg, #F4C2C2, #E6E6FA)',
    'linear-gradient(135deg, #F7E7CE, #F4C2C2)',
    'linear-gradient(135deg, #E3BCA4, #FADBD8)',
    'linear-gradient(135deg, #B76E79, #F4C2C2)',
    'linear-gradient(135deg, #D4949E, #E6E6FA)',
    'linear-gradient(135deg, #FADBD8, #F7E7CE)',
    'linear-gradient(135deg, #C8C8E0, #E3BCA4)',
  ];

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: '', description: '', gradient: gradients[0], images: [] });
    setShowModal(true);
  };

  const openEdit = (cat: CategoryWithImages) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description,
      gradient: cat.gradient,
      images: cat.images ?? [],
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const slug = form.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    if (editingId) {
      updateCategory(editingId, {
        name: form.name,
        slug,
        description: form.description,
        gradient: form.gradient,
        images: form.images,
      });
    } else {
      addCategory({
        id: Date.now().toString(),
        name: form.name,
        slug,
        description: form.description,
        image: 'product-gradient-1',
        productCount: 0,
        gradient: form.gradient,
        images: form.images,
        createdAt: new Date().toISOString(),
      });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this category?')) deleteCategory(id);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="heading-serif text-2xl md:text-3xl font-bold text-charcoal">
            Categories
          </h1>
          <p className="text-warm-gray text-sm">{categories.length} categories</p>
        </div>
        <Button onClick={openAdd}>
          <Plus size={16} /> Add Category
        </Button>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="glass-card rounded-2xl overflow-hidden">
            {/* Collage / gradient header */}
            <div className="relative">
              <CategoryCollage
                images={cat.images}
                gradient={cat.gradient}
                alt={cat.name}
              />
              {/* Image count badge */}
              {cat.images && cat.images.length > 0 && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5">
                  <ImageIcon size={10} className="text-white" />
                  <span className="text-white text-xs">{cat.images.length}</span>
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-charcoal">{cat.name}</h3>
              <p className="text-sm text-warm-gray mt-1 line-clamp-2">
                {cat.description}
              </p>
              <p className="text-xs text-warm-gray mt-2">{cat.productCount} products</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="ghost" onClick={() => openEdit(cat)}>
                  <Edit2 size={14} /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="!text-red-500 hover:!bg-red-50"
                  onClick={() => handleDelete(cat.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Category' : 'Add Category'}
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Dresses"
          />

          <div>
            <label className="block text-sm font-medium text-warm-gray mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 resize-none"
              rows={3}
            />
          </div>

          {/* ── Image upload & collage preview ── */}
          <ImageDropzone
            images={form.images}
            onChange={(imgs) => setForm({ ...form, images: imgs })}
          />

          {/* Live collage preview */}
          {form.images.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-warm-gray mb-1.5">
                Collage Preview
              </label>
              <div className="rounded-2xl overflow-hidden border border-blush/20 shadow-sm">
                <CategoryCollage
                  images={form.images}
                  gradient={form.gradient}
                  alt="preview"
                />
              </div>
            </div>
          )}

          {/* Gradient picker — shown as fallback label */}
          <div>
            <label className="block text-sm font-medium text-warm-gray mb-1.5">
              Fallback Gradient{' '}
              <span className="text-warm-gray/60 font-normal">
                (used when no images uploaded)
              </span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {gradients.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm({ ...form, gradient: g })}
                  className={`h-12 rounded-xl border-2 transition-all ${form.gradient === g
                    ? 'border-rose-gold scale-105'
                    : 'border-transparent'
                    }`}
                  style={{ background: g }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? 'Save Changes' : 'Add Category'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};