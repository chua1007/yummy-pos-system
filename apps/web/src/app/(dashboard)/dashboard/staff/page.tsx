'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, X, Check, Trash2, Edit2 } from 'lucide-react';

interface Staff { id: string; email: string; name: string; role: string; is_active: number; created_at: string; }

const roleLabels: Record<string, string> = { cashier: 'Cashier', manager: 'Manager', staff: 'Staff' };
const roleColors: Record<string, string> = { cashier: 'bg-blue-100 text-blue-700', manager: 'bg-purple-100 text-purple-700', staff: 'bg-gray-100 text-gray-700' };

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetch('/api/staff').then((r) => r.json()).then((d) => { setStaff(d); setLoading(false); });
  }, []);

  const toggleActive = async (s: Staff) => {
    const res = await fetch(`/api/staff/${s.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !s.is_active }) });
    const updated = await res.json();
    setStaff(staff.map((x) => x.id === updated.id ? updated : x));
  };

  const deleteStaff = async (id: string) => {
    if (!confirm('Remove this staff member?')) return;
    await fetch(`/api/staff/${id}`, { method: 'DELETE' });
    setStaff(staff.filter((s) => s.id !== id));
  };

  if (loading) return <div className="p-6 text-[rgb(var(--color-text-tertiary))]">Loading...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text-primary))]">Staff & Cashiers</h1>
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">Manage your team members</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-lg bg-[rgb(var(--color-brand-500))] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[rgb(var(--color-brand-600))]">
          <UserPlus className="h-4 w-4" /> Add Staff
        </button>
      </div>

      {staff.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[rgb(var(--color-border-default))] p-12 text-center text-[rgb(var(--color-text-tertiary))]">
          <p>No staff members yet. Add cashiers and managers to your team.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-secondary))]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--color-border-subtle))]">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-[rgb(var(--color-surface-secondary))] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[rgb(var(--color-brand-100))] flex items-center justify-center text-sm font-semibold text-[rgb(var(--color-brand-700))]">{s.name.charAt(0)}</div>
                      <span className="text-sm font-medium text-[rgb(var(--color-text-primary))]">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[rgb(var(--color-text-secondary))]">{s.email}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[s.role] || roleColors.staff}`}>{roleLabels[s.role] || s.role}</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(s)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => deleteStaff(s.id)} className="rounded p-1.5 hover:bg-red-50 text-[rgb(var(--color-text-tertiary))] hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {showAdd && <AddStaffModal onClose={() => setShowAdd(false)} onAdded={(s) => { setStaff([s, ...staff]); setShowAdd(false); }} />}
      </AnimatePresence>
    </motion.div>
  );
}

function AddStaffModal({ onClose, onAdded }: { onClose: () => void; onAdded: (s: Staff) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('cashier');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    const res = await fetch('/api/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, role }) });
    if (!res.ok) { setError((await res.json()).error || 'Failed'); setSaving(false); return; }
    onAdded(await res.json()); setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.form initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="w-full max-w-md rounded-xl bg-[rgb(var(--color-surface-primary))] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-[rgb(var(--color-text-primary))]">Add Staff Member</h2><button type="button" onClick={onClose}><X className="h-5 w-5 text-[rgb(var(--color-text-tertiary))]" /></button></div>
        <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">Name *</label><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ahmad" className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" /></div>
        <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">Email * (used for login)</label><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cashier@restaurant.com" className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" /></div>
        <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">Password *</label><input required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 4 characters" className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" /></div>
        <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]">
            <option value="cashier">Cashier</option><option value="manager">Manager</option><option value="staff">Staff</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[rgb(var(--color-border-default))] py-2.5 text-sm font-medium text-[rgb(var(--color-text-secondary))]">Cancel</button>
          <button type="submit" disabled={saving || !name || !email || !password} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[rgb(var(--color-brand-500))] py-2.5 text-sm font-medium text-white disabled:opacity-50"><Check className="h-4 w-4" />{saving ? 'Adding...' : 'Add Staff'}</button>
        </div>
      </motion.form>
    </motion.div>
  );
}
