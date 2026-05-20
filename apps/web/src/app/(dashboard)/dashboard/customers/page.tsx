'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Search, X, Check, Trash2 } from 'lucide-react';

interface Customer {
  id: string; name: string; email: string | null; phone: string | null; total_spent: number; visit_count: number; tier: string; created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/customers').then((r) => r.json()).then((d) => { setCustomers(d); setLoading(false); });
  }, []);

  const deleteCustomer = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    setCustomers(customers.filter((c) => c.id !== id));
  };

  const filtered = customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search));

  const tierColors: Record<string, string> = { Bronze: 'bg-orange-100 text-orange-700', Silver: 'bg-gray-100 text-gray-700', Gold: 'bg-yellow-100 text-yellow-700', Platinum: 'bg-purple-100 text-purple-700' };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text-primary))]">Customers</h1>
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">{customers.length} registered</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-lg bg-[rgb(var(--color-brand-500))] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[rgb(var(--color-brand-600))]">
          <UserPlus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] px-3 py-2">
        <Search className="h-4 w-4 text-[rgb(var(--color-text-tertiary))]" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, phone..." className="flex-1 bg-transparent text-sm focus:outline-none" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[rgb(var(--color-text-tertiary))]">No customers found. Add your first customer!</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((customer, i) => (
            <motion.div key={customer.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="relative rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-5 shadow-sm hover:shadow-md transition-shadow">
              <button onClick={() => deleteCustomer(customer.id)} className="absolute top-3 right-3 rounded p-1 text-[rgb(var(--color-text-tertiary))] hover:text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--color-brand-100))] text-sm font-semibold text-[rgb(var(--color-brand-700))]">{customer.name.charAt(0)}</div>
                <div>
                  <p className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">{customer.name}</p>
                  <p className="text-xs text-[rgb(var(--color-text-tertiary))]">{customer.email || customer.phone || 'No contact'}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[rgb(var(--color-border-subtle))] pt-3">
                <div><p className="text-sm font-bold">RM {(customer.total_spent / 100).toFixed(0)}</p><p className="text-xs text-[rgb(var(--color-text-tertiary))]">spent</p></div>
                <div><p className="text-sm font-bold">{customer.visit_count}</p><p className="text-xs text-[rgb(var(--color-text-tertiary))]">visits</p></div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tierColors[customer.tier] || tierColors.Bronze}`}>{customer.tier}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAdd && <AddCustomerModal onClose={() => setShowAdd(false)} onAdded={(c) => { setCustomers([c, ...customers]); setShowAdd(false); }} />}
      </AnimatePresence>
    </motion.div>
  );
}

function AddCustomerModal({ onClose, onAdded }: { onClose: () => void; onAdded: (c: Customer) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email: email || null, phone: phone || null }) });
    onAdded(await res.json());
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.form initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Add Customer</h2><button type="button" onClick={onClose}><X className="h-5 w-5 text-[rgb(var(--color-text-tertiary))]" /></button></div>
        <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">Name *</label><input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" /></div>
        <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" /></div>
        <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+60 12-345 6789" className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" /></div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[rgb(var(--color-border-default))] py-2.5 text-sm font-medium">Cancel</button>
          <button type="submit" disabled={saving || !name} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[rgb(var(--color-brand-500))] py-2.5 text-sm font-medium text-white disabled:opacity-50"><Check className="h-4 w-4" />{saving ? 'Saving...' : 'Add'}</button>
        </div>
      </motion.form>
    </motion.div>
  );
}
