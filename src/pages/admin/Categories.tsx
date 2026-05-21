/* ===================================================
   AUTHENTIC GIRLSWEAR - Admin Categories Management
   Fixed: uses persistent store so data survives refresh
   =================================================== */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';
import { useCategoryStore } from '@/store';
import type { Category } from '@/types';

export const AdminCategories: React.FC = () => {
  // ✅ Pull from the persistent store — not local state
  const { categories, addCategory, updateCategory, deleteCategory } = useCategoryStore();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    gradient: 'linear-gradient(135deg, #F4C2C2, #E6E6FA)',
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
    setForm({ name: '', description: '', gradient: gradients[0] });
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, description: cat.description, gradient: cat.gradient });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return; // Don't save empty names
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (editingId) {
      // ✅ Update in persistent store
      updateCategory(editingId, {
        name: form.name,
        slug,
        description: form.description,
        gradient: form.gradient,
      });
    } else {
      // ✅ Add to persistent store — survives page refresh
      addCategory({
        id: Date.now().toString(),
        name: form.name,
        slug,
        description: form.description,
        image: 'product-gradient-1',
        productCount: 0,
        gradient: form.gradient,
        createdAt: new Date().toISOString(),
      });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this category?')) {
      // ✅ Delete from persistent store — won't come back on refresh
      deleteCategory(id);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="heading-serif text-2xl md:text-3xl font-bold text-charcoal">Categories</h1>
          <p className="text-warm-gray text-sm">{categories.length} categories</p>
        </div>
        <Button onClick={openAdd}><Plus size={16} /> Add Category</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="glass-card rounded-2xl overflow-hidden">
            <div className="h-24" style={{ background: cat.gradient }} />
            <div className="p-4">
              <h3 className="font-semibold text-charcoal">{cat.name}</h3>
              <p className="text-sm text-warm-gray mt-1 line-clamp-2">{cat.description}</p>
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

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Category' : 'Add Category'}
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Dresses"
          />
          <div>
            <label className="block text-sm font-medium text-warm-gray mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-blush/30 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-rose-gold/30 resize-none"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-warm-gray mb-1.5">Gradient</label>
            <div className="grid grid-cols-4 gap-2">
              {gradients.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setForm({ ...form, gradient: g })}
                  className={`h-12 rounded-xl border-2 transition-all ${form.gradient === g ? 'border-rose-gold scale-105' : 'border-transparent'}`}
                  style={{ background: g }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? 'Save Changes' : 'Add Category'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};