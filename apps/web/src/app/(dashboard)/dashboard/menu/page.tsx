'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, Edit2, X, Check } from 'lucide-react';

interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image: string;
  image_url: string | null;
  is_available: number;
  prep_time_mins: number;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  emoji: string;
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMenu = async () => {
    const res = await fetch('/api/menu');
    const data = await res.json();
    setItems(data.items);
    setCategories(data.categories);
    setLoading(false);
  };

  useEffect(() => { fetchMenu(); }, []);

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await fetch(`/api/menu/${id}`, { method: 'DELETE' });
    setItems(items.filter((i) => i.id !== id));
  };

  const toggleAvailability = async (item: MenuItem) => {
    const res = await fetch(`/api/menu/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_available: !item.is_available }),
    });
    const updated = await res.json();
    setItems(items.map((i) => (i.id === updated.id ? updated : i)));
  };

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name || '';

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text-primary))]">Menu</h1>
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">{items.length} items</p>
        </div>
        <button
          onClick={() => { setEditingItem(null); setShowAddModal(true); }}
          className="flex items-center gap-2 rounded-lg bg-[rgb(var(--color-brand-500))] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[rgb(var(--color-brand-600))] transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Item
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] px-3 py-2">
        <Search className="h-4 w-4 text-[rgb(var(--color-text-tertiary))]" />
        <input
          type="text"
          placeholder="Search menu items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence>
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-4 shadow-sm ${!item.is_available ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />
                ) : (
                  <span className="text-3xl">{item.image}</span>
                )}
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditingItem(item); setShowAddModal(true); }}
                    className="rounded p-1 text-[rgb(var(--color-text-tertiary))] hover:bg-[rgb(var(--color-surface-secondary))] hover:text-[rgb(var(--color-text-primary))]"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="rounded p-1 text-[rgb(var(--color-text-tertiary))] hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-[rgb(var(--color-text-primary))]">{item.name}</h3>
              <p className="mt-0.5 text-xs text-[rgb(var(--color-text-tertiary))]">{getCategoryName(item.category_id)}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-base font-bold text-[rgb(var(--color-brand-500))]">RM {(item.price / 100).toFixed(2)}</p>
                <button
                  onClick={() => toggleAvailability(item)}
                  className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                >
                  {item.is_available ? 'Available' : 'Unavailable'}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddItemModal
            categories={categories}
            editingItem={editingItem}
            onClose={() => setShowAddModal(false)}
            onSaved={(saved) => {
              if (editingItem) {
                setItems(items.map((i) => (i.id === saved.id ? saved : i)));
              } else {
                setItems([saved, ...items]);
              }
              setShowAddModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AddItemModal({ categories, editingItem, onClose, onSaved }: {
  categories: Category[];
  editingItem: MenuItem | null;
  onClose: () => void;
  onSaved: (item: MenuItem) => void;
}) {
  const [name, setName] = useState(editingItem?.name || '');
  const [price, setPrice] = useState(editingItem ? String(editingItem.price / 100) : '');
  const [categoryId, setCategoryId] = useState(editingItem?.category_id || categories[0]?.id || '');
  const [image, setImage] = useState(editingItem?.image || '🍽️');
  const [imageUrl, setImageUrl] = useState(editingItem?.image_url || '');
  const [description, setDescription] = useState(editingItem?.description || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) setImageUrl(data.url);
      else alert(data.error || 'Upload failed');
    } catch { alert('Upload failed'); }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload: any = {
      name,
      price: Math.round(parseFloat(price) * 100),
      category_id: categoryId,
      image,
      description: description || null,
    };
    if (imageUrl) payload.image_url = imageUrl;

    let res;
    if (editingItem) {
      res = await fetch(`/api/menu/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    const saved = await res.json();
    onSaved(saved);
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-6 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[rgb(var(--color-text-primary))]">
            {editingItem ? 'Edit Item' : 'Add Menu Item'}
          </h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-[rgb(var(--color-surface-secondary))]">
            <X className="h-5 w-5 text-[rgb(var(--color-text-tertiary))]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Food Photo</label>
            <div className="flex items-center gap-4">
              {imageUrl ? (
                <div className="relative">
                  <img src={imageUrl} alt="Preview" className="h-20 w-20 rounded-lg object-cover border" />
                  <button type="button" onClick={() => setImageUrl('')} className="absolute -top-1 -right-1 rounded-full bg-red-500 p-0.5 text-white"><X className="h-3 w-3" /></button>
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-[rgb(var(--color-border-default))] text-3xl">
                  {image}
                </div>
              )}
              <div className="flex-1">
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2 text-sm hover:bg-[rgb(var(--color-surface-secondary))] transition-colors">
                  {uploading ? 'Uploading...' : '📷 Upload Photo'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
                <p className="mt-1 text-xs text-[rgb(var(--color-text-tertiary))]">JPG, PNG, WebP. Max 5MB.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Name *</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" placeholder="e.g. Nasi Lemak Special" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))] resize-none" placeholder="Describe the dish..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Price (RM) *</label>
              <input type="number" required step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" placeholder="15.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]">
                {categories.map((c) => (<option key={c.id} value={c.id}>{c.emoji} {c.name}</option>))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Emoji (fallback if no photo)</label>
            <input type="text" value={image} onChange={(e) => setImage(e.target.value)} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" placeholder="🍛" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[rgb(var(--color-border-default))] px-4 py-2.5 text-sm font-medium text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-secondary))]">Cancel</button>
            <button type="submit" disabled={saving || !name || !price} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[rgb(var(--color-brand-500))] px-4 py-2.5 text-sm font-medium text-white hover:bg-[rgb(var(--color-brand-600))] disabled:opacity-50">
              <Check className="h-4 w-4" />
              {saving ? 'Saving...' : editingItem ? 'Update' : 'Add Item'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
