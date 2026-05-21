'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, X, Check, Trash2, Edit2 } from 'lucide-react';

interface Cashier { id: string; name: string; position: string; is_active: number; created_at: string; }

export default function StaffPage() {
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Cashier | null>(null);

  useEffect(() => {
    fetch('/api/staff').then((r) => r.json()).then((d) => { setCashiers(d); setLoading(false); });
  }, []);

  const toggleActive = async (c: Cashier) => {
    const res = await fetch(`/api/staff/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !c.is_active }) });
    const updated = await res.json();
    setCashiers(cashiers.map((x) => x.id === updated.id ? updated : x));
  };

  const deleteCashier = async (id: string) => {
    if (!confirm('Remove this staff member?')) return;
    await fetch(`/api/staff/${id}`, { method: 'DELETE' });
    setCashiers(cashiers.filter((c) => c.id !== id));
  };

  if (loading) return <div className="p-6 text-[rgb(var(--color-text-tertiary))]">Loading...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text-primary))]">Staff & Cashiers</h1>
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">Manage cashiers with name and 4-digit passcode</p>
        </div>
        <button onClick={() => { setEditing(null); setShowAdd(true); }} className="flex items-center gap-2 rounded-lg bg-[rgb(var(--color-brand-500))] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[rgb(var(--color-brand-600))]">
          <UserPlus className="h-4 w-4" /> Add Cashier
        </button>
      </div>

      <div className="rounded-lg border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-secondary))] p-3">
        <p className="text-xs text-[rgb(var(--color-text-secondary))]">💡 Cashiers use a 4-digit passcode to switch shifts. Go to the <strong>Cashier</strong> page to switch the active cashier before processing payments.</p>
      </div>

      {cashiers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[rgb(var(--color-border-default))] p-12 text-center text-[rgb(var(--color-text-tertiary))]">
          <p>No cashiers added yet. Add your first cashier to start tracking who handles payments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {cashiers.map((c) => (
            <div key={c.id} className={`rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-4 ${!c.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[rgb(var(--color-brand-100))] flex items-center justify-center text-sm font-bold text-[rgb(var(--color-brand-700))]">{c.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">{c.name}</p>
                    <p className="text-xs text-[rgb(var(--color-text-tertiary))]">{c.position}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleActive(c)} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.is_active ? 'Active' : 'Inactive'}</button>
                  <button onClick={() => deleteCashier(c.id)} className="rounded p-1 text-[rgb(var(--color-text-tertiary))] hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAdd && <AddCashierModal onClose={() => setShowAdd(false)} onAdded={(c) => { setCashiers([...cashiers, c]); setShowAdd(false); }} />}
      </AnimatePresence>
    </motion.div>
  );
}

function AddCashierModal({ onClose, onAdded }: { onClose: () => void; onAdded: (c: Cashier) => void }) {
  const [name, setName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [position, setPosition] = useState('Cashier');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.length !== 4 || !/^\d{4}$/.test(passcode)) { setError('Passcode must be exactly 4 digits'); return; }
    setSaving(true); setError('');
    const res = await fetch('/api/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, passcode, position }) });
    if (!res.ok) { setError((await res.json()).error || 'Failed'); setSaving(false); return; }
    onAdded(await res.json()); setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.form initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl bg-[rgb(var(--color-surface-primary))] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-[rgb(var(--color-text-primary))]">Add Cashier</h2><button type="button" onClick={onClose}><X className="h-5 w-5 text-[rgb(var(--color-text-tertiary))]" /></button></div>
        <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">Name *</label><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ahmad" className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" /></div>
        <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">4-Digit Passcode *</label><input required maxLength={4} value={passcode} onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="e.g. 1234" className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm font-mono text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" /><p className="mt-1 text-xs text-[rgb(var(--color-text-tertiary))]">Used to switch cashier on the payment screen</p></div>
        <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">Position</label>
          <select value={position} onChange={(e) => setPosition(e.target.value)} className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]">
            <option>Cashier</option><option>Senior Cashier</option><option>Shift Lead</option><option>Manager</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[rgb(var(--color-border-default))] py-2.5 text-sm font-medium text-[rgb(var(--color-text-secondary))]">Cancel</button>
          <button type="submit" disabled={saving || !name || passcode.length !== 4} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[rgb(var(--color-brand-500))] py-2.5 text-sm font-medium text-white disabled:opacity-50"><Check className="h-4 w-4" />{saving ? 'Adding...' : 'Add'}</button>
        </div>
      </motion.form>
    </motion.div>
  );
}
