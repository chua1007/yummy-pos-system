'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, AlertTriangle, Package, X, Check, Minus, Edit2, Settings } from 'lucide-react';

interface InventoryItem {
  id: string; name: string; unit: string; quantity: number; min_threshold: number; max_capacity: number; category: string | null; updated_at: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<InventoryItem | null>(null);

  const fetchInventory = async () => {
    const res = await fetch('/api/inventory');
    setItems(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchInventory(); }, []);

  const getStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) return 'out';
    if (item.quantity <= item.min_threshold * 0.5) return 'critical';
    if (item.quantity <= item.min_threshold) return 'low';
    return 'normal';
  };

  const adjustStock = async (item: InventoryItem, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    const res = await fetch(`/api/inventory/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQty }),
    });
    const updated = await res.json();
    setItems(items.map((i) => (i.id === updated.id ? updated : i)));
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this inventory item?')) return;
    await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
    setItems(items.filter((i) => i.id !== id));
  };

  const lowCount = items.filter((i) => getStatus(i) === 'low').length;
  const criticalCount = items.filter((i) => getStatus(i) === 'critical' || getStatus(i) === 'out').length;

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text-primary))]">Inventory</h1>
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">{items.length} items tracked</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-lg bg-[rgb(var(--color-brand-500))] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[rgb(var(--color-brand-600))]">
          <Plus className="h-4 w-4" /> Add Item
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-4">
          <Package className="h-8 w-8 text-green-500" />
          <div><p className="text-xl font-bold text-[rgb(var(--color-text-primary))]">{items.length}</p><p className="text-xs text-[rgb(var(--color-text-tertiary))]">Total Items</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
          <div><p className="text-xl font-bold text-yellow-700">{lowCount}</p><p className="text-xs text-yellow-600">Low Stock</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <div><p className="text-xl font-bold text-red-700">{criticalCount}</p><p className="text-xs text-red-600">Critical</p></div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-secondary))]">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Item</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Stock</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Threshold</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Level</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--color-border-subtle))]">
            {items.map((item) => {
              const status = getStatus(item);
              const pct = Math.min((item.quantity / item.max_capacity) * 100, 100);
              return (
                <tr key={item.id} className="hover:bg-[rgb(var(--color-surface-secondary))] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-[rgb(var(--color-text-primary))]">{item.name}</p>
                    <p className="text-xs text-[rgb(var(--color-text-tertiary))]">{item.category}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-[rgb(var(--color-text-secondary))]">{item.quantity} {item.unit}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[rgb(var(--color-text-secondary))]">Min: {item.min_threshold} / Max: {item.max_capacity}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-[rgb(var(--color-surface-tertiary))]">
                        <div className={`h-2 rounded-full ${status === 'normal' ? 'bg-green-500' : status === 'low' ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-[rgb(var(--color-text-tertiary))]">{Math.round(pct)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status === 'normal' ? 'bg-green-100 text-green-700' : status === 'low' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {status === 'normal' ? 'OK' : status === 'low' ? 'Low' : 'Critical'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => adjustStock(item, -1)} className="rounded p-1 hover:bg-red-50 text-[rgb(var(--color-text-tertiary))] hover:text-red-500" title="Remove 1"><Minus className="h-3.5 w-3.5" /></button>
                      <button onClick={() => adjustStock(item, 10)} className="rounded px-2 py-1 text-xs bg-[rgb(var(--color-surface-secondary))] hover:bg-[rgb(var(--color-surface-tertiary))] text-[rgb(var(--color-text-secondary))]" title="Add 10">+10</button>
                      <button onClick={() => setEditingThreshold(item)} className="rounded p-1 hover:bg-blue-50 text-[rgb(var(--color-text-tertiary))] hover:text-blue-500 ml-1" title="Set Threshold"><Settings className="h-3.5 w-3.5" /></button>
                      <button onClick={() => deleteItem(item.id)} className="rounded p-1 hover:bg-red-50 text-[rgb(var(--color-text-tertiary))] hover:text-red-500 ml-1" title="Delete"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && <AddInventoryModal onClose={() => setShowAdd(false)} onAdded={(item) => { setItems([...items, item]); setShowAdd(false); }} />}
      </AnimatePresence>

      {/* Threshold Modal */}
      <AnimatePresence>
        {editingThreshold && (
          <ThresholdModal
            item={editingThreshold}
            onClose={() => setEditingThreshold(null)}
            onSaved={(updated) => { setItems(items.map((i) => i.id === updated.id ? updated : i)); setEditingThreshold(null); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ThresholdModal({ item, onClose, onSaved }: { item: InventoryItem; onClose: () => void; onSaved: (item: InventoryItem) => void }) {
  const [minThreshold, setMinThreshold] = useState(String(item.min_threshold));
  const [maxCapacity, setMaxCapacity] = useState(String(item.max_capacity));
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/inventory/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        min_threshold: parseFloat(minThreshold),
        max_capacity: parseFloat(maxCapacity),
        quantity: parseFloat(quantity),
      }),
    });
    onSaved(await res.json());
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.form initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[rgb(var(--color-text-primary))]">Set Threshold</h2>
            <p className="text-sm text-[rgb(var(--color-text-tertiary))]">{item.name}</p>
          </div>
          <button type="button" onClick={onClose}><X className="h-5 w-5 text-[rgb(var(--color-text-tertiary))]" /></button>
        </div>

        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Current Stock ({item.unit})</label>
          <input type="number" step="0.1" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Min Threshold</label>
            <input type="number" step="0.1" min="0" value={minThreshold} onChange={(e) => setMinThreshold(e.target.value)} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" />
            <p className="mt-1 text-xs text-[rgb(var(--color-text-tertiary))]">Alert when stock falls below this</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Max Capacity</label>
            <input type="number" step="0.1" min="0" value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" />
            <p className="mt-1 text-xs text-[rgb(var(--color-text-tertiary))]">Maximum storage capacity</p>
          </div>
        </div>

        {/* Visual preview */}
        <div className="rounded-lg bg-[rgb(var(--color-surface-secondary))] p-3">
          <p className="text-xs font-medium text-[rgb(var(--color-text-secondary))] mb-2">Preview</p>
          <div className="relative h-4 rounded-full bg-[rgb(var(--color-surface-tertiary))]">
            <div className="absolute h-4 rounded-full bg-green-500" style={{ width: `${Math.min((parseFloat(quantity) / parseFloat(maxCapacity || '1')) * 100, 100)}%` }} />
            <div className="absolute top-0 h-4 w-0.5 bg-yellow-500" style={{ left: `${(parseFloat(minThreshold) / parseFloat(maxCapacity || '1')) * 100}%` }} title="Min threshold" />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-[rgb(var(--color-text-tertiary))]">
            <span>0</span>
            <span className="text-yellow-600">Min: {minThreshold}</span>
            <span>Max: {maxCapacity}</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[rgb(var(--color-border-default))] py-2.5 text-sm font-medium text-[rgb(var(--color-text-secondary))]">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[rgb(var(--color-brand-500))] py-2.5 text-sm font-medium text-white disabled:opacity-50"><Check className="h-4 w-4" />{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function AddInventoryModal({ onClose, onAdded }: { onClose: () => void; onAdded: (item: InventoryItem) => void }) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('kg');
  const [quantity, setQuantity] = useState('0');
  const [minThreshold, setMinThreshold] = useState('10');
  const [maxCapacity, setMaxCapacity] = useState('100');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, unit, quantity: parseFloat(quantity), min_threshold: parseFloat(minThreshold), max_capacity: parseFloat(maxCapacity), category: category || null }),
    });
    onAdded(await res.json());
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.form initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-[rgb(var(--color-text-primary))]">Add Inventory Item</h2><button type="button" onClick={onClose}><X className="h-5 w-5 text-[rgb(var(--color-text-tertiary))]" /></button></div>
        <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">Name *</label><input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">Quantity</label><input type="number" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" /></div>
          <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">Unit</label><input value={unit} onChange={(e) => setUnit(e.target.value)} className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">Min Threshold</label><input type="number" step="0.1" value={minThreshold} onChange={(e) => setMinThreshold(e.target.value)} className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" /><p className="mt-0.5 text-xs text-[rgb(var(--color-text-tertiary))]">Low stock alert level</p></div>
          <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">Max Capacity</label><input type="number" step="0.1" value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)} className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" /><p className="mt-0.5 text-xs text-[rgb(var(--color-text-tertiary))]">Max storage</p></div>
        </div>
        <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">Category</label><input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Staples, Protein" className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" /></div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[rgb(var(--color-border-default))] py-2.5 text-sm font-medium text-[rgb(var(--color-text-secondary))]">Cancel</button>
          <button type="submit" disabled={saving || !name} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[rgb(var(--color-brand-500))] py-2.5 text-sm font-medium text-white disabled:opacity-50"><Check className="h-4 w-4" />{saving ? 'Saving...' : 'Add'}</button>
        </div>
      </motion.form>
    </motion.div>
  );
}
