'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Search, X, Check, Trash2, Eye, TrendingUp, DollarSign, Users, Star, Edit2 } from 'lucide-react';

interface Customer {
  id: string; name: string; email: string | null; phone: string | null; total_spent: number; visit_count: number; tier: string; notes: string | null; created_at: string; last_visit_at: string | null;
}

interface CustomerDetail {
  customer: Customer;
  orders: any[];
  stats: { total_orders: number; total_spent: number; avg_order: number; last_order_at: string | null };
}

const tierColors: Record<string, string> = { Bronze: 'bg-orange-100 text-orange-700 border-orange-200', Silver: 'bg-gray-100 text-gray-700 border-gray-200', Gold: 'bg-yellow-100 text-yellow-700 border-yellow-200', Platinum: 'bg-purple-100 text-purple-700 border-purple-200' };
const tierThresholds = { Bronze: 0, Silver: 5000, Gold: 15000, Platinum: 50000 }; // in cents

export default function CRMPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [tierFilter, setTierFilter] = useState('all');

  useEffect(() => {
    fetch('/api/customers').then((r) => r.json()).then((d) => { setCustomers(d); setLoading(false); });
  }, []);

  const viewCustomer = async (customer: Customer) => {
    setLoadingDetail(true);
    setSelectedCustomer({ customer, orders: [], stats: { total_orders: 0, total_spent: 0, avg_order: 0, last_order_at: null } });
    try {
      const res = await fetch(`/api/customers/${customer.id}/orders`);
      const data = await res.json();
      setSelectedCustomer(data);
    } catch {}
    setLoadingDetail(false);
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm('Delete this customer? This cannot be undone.')) return;
    await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    setCustomers(customers.filter((c) => c.id !== id));
    if (selectedCustomer?.customer.id === id) setSelectedCustomer(null);
  };

  const updateTier = async (customer: Customer, tier: string) => {
    await fetch(`/api/customers/${customer.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tier }) });
    setCustomers(customers.map((c) => c.id === customer.id ? { ...c, tier } : c));
    if (selectedCustomer?.customer.id === customer.id) {
      setSelectedCustomer({ ...selectedCustomer, customer: { ...selectedCustomer.customer, tier } });
    }
  };

  const filtered = customers.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search);
    const matchesTier = tierFilter === 'all' || c.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0);
  const avgSpend = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  if (loading) return <div className="p-6 text-[rgb(var(--color-text-tertiary))]">Loading...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text-primary))]">CRM & Loyalty</h1>
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">Customer relationship management & loyalty program</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-lg bg-[rgb(var(--color-brand-500))] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[rgb(var(--color-brand-600))]">
          <UserPlus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      {/* CRM Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-4">
          <div className="flex items-center gap-2 text-[rgb(var(--color-text-tertiary))]"><Users className="h-4 w-4" /><span className="text-xs">Total Customers</span></div>
          <p className="mt-1 text-2xl font-bold text-[rgb(var(--color-text-primary))]">{totalCustomers}</p>
        </div>
        <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-4">
          <div className="flex items-center gap-2 text-[rgb(var(--color-text-tertiary))]"><DollarSign className="h-4 w-4" /><span className="text-xs">Total Revenue</span></div>
          <p className="mt-1 text-2xl font-bold text-[rgb(var(--color-text-primary))]">RM {(totalRevenue / 100).toFixed(0)}</p>
        </div>
        <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-4">
          <div className="flex items-center gap-2 text-[rgb(var(--color-text-tertiary))]"><TrendingUp className="h-4 w-4" /><span className="text-xs">Avg Spend/Customer</span></div>
          <p className="mt-1 text-2xl font-bold text-[rgb(var(--color-text-primary))]">RM {(avgSpend / 100).toFixed(0)}</p>
        </div>
        <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-4">
          <div className="flex items-center gap-2 text-[rgb(var(--color-text-tertiary))]"><Star className="h-4 w-4" /><span className="text-xs">Loyalty Tiers</span></div>
          <div className="mt-1 flex gap-1">
            {['Platinum', 'Gold', 'Silver', 'Bronze'].map((t) => (
              <span key={t} className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${tierColors[t]}`}>{customers.filter((c) => c.tier === t).length}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] px-3 py-2">
          <Search className="h-4 w-4 text-[rgb(var(--color-text-tertiary))]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." className="flex-1 bg-transparent text-sm focus:outline-none" />
        </div>
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2 text-sm">
          <option value="all">All Tiers</option>
          <option value="Platinum">Platinum</option><option value="Gold">Gold</option><option value="Silver">Silver</option><option value="Bronze">Bronze</option>
        </select>
      </div>

      {/* Customer List */}
      <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-[rgb(var(--color-text-tertiary))]">No customers found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-secondary))]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Visits</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Total Spent</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Tier</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--color-border-subtle))]">
              {filtered.map((customer) => (
                <tr key={customer.id} className="hover:bg-[rgb(var(--color-surface-secondary))] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgb(var(--color-brand-100))] text-sm font-semibold text-[rgb(var(--color-brand-700))]">{customer.name.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-medium text-[rgb(var(--color-text-primary))]">{customer.name}</p>
                        <p className="text-xs text-[rgb(var(--color-text-tertiary))]">Since {new Date(customer.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[rgb(var(--color-text-secondary))]">{customer.email || '-'}</p>
                    <p className="text-xs text-[rgb(var(--color-text-tertiary))]">{customer.phone || '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-[rgb(var(--color-text-secondary))]">{customer.visit_count}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[rgb(var(--color-text-primary))]">RM {(customer.total_spent / 100).toFixed(0)}</td>
                  <td className="px-4 py-3">
                    <select value={customer.tier} onChange={(e) => updateTier(customer, e.target.value)} className={`rounded-full border px-2 py-0.5 text-xs font-medium ${tierColors[customer.tier]}`}>
                      <option value="Bronze">Bronze</option><option value="Silver">Silver</option><option value="Gold">Gold</option><option value="Platinum">Platinum</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => viewCustomer(customer)} className="rounded p-1.5 hover:bg-[rgb(var(--color-surface-tertiary))] text-[rgb(var(--color-text-tertiary))] hover:text-[rgb(var(--color-brand-500))]" title="View details"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => deleteCustomer(customer.id)} className="rounded p-1.5 hover:bg-red-50 text-[rgb(var(--color-text-tertiary))] hover:text-red-500" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Customer Detail Drawer */}
      <AnimatePresence>
        {selectedCustomer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)}>
            <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} onClick={(e) => e.stopPropagation()} className="ml-auto h-full w-full max-w-lg overflow-y-auto bg-[rgb(var(--color-surface-primary))] shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">Customer Profile</h2>
                <button onClick={() => setSelectedCustomer(null)}><X className="h-5 w-5 text-[rgb(var(--color-text-tertiary))]" /></button>
              </div>

              {/* Profile Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgb(var(--color-brand-100))] text-2xl font-bold text-[rgb(var(--color-brand-700))]">{selectedCustomer.customer.name.charAt(0)}</div>
                <div>
                  <h3 className="text-xl font-bold text-[rgb(var(--color-text-primary))]">{selectedCustomer.customer.name}</h3>
                  <p className="text-sm text-[rgb(var(--color-text-secondary))]">{selectedCustomer.customer.email || selectedCustomer.customer.phone || 'No contact info'}</p>
                  <span className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${tierColors[selectedCustomer.customer.tier]}`}>{selectedCustomer.customer.tier} Member</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="rounded-lg bg-[rgb(var(--color-surface-secondary))] p-3 text-center">
                  <p className="text-lg font-bold text-[rgb(var(--color-text-primary))]">{selectedCustomer.stats.total_orders}</p>
                  <p className="text-xs text-[rgb(var(--color-text-tertiary))]">Orders</p>
                </div>
                <div className="rounded-lg bg-[rgb(var(--color-surface-secondary))] p-3 text-center">
                  <p className="text-lg font-bold text-[rgb(var(--color-text-primary))]">RM {(selectedCustomer.stats.total_spent / 100).toFixed(0)}</p>
                  <p className="text-xs text-[rgb(var(--color-text-tertiary))]">Total Spent</p>
                </div>
                <div className="rounded-lg bg-[rgb(var(--color-surface-secondary))] p-3 text-center">
                  <p className="text-lg font-bold text-[rgb(var(--color-text-primary))]">RM {(selectedCustomer.stats.avg_order / 100).toFixed(0)}</p>
                  <p className="text-xs text-[rgb(var(--color-text-tertiary))]">Avg Order</p>
                </div>
              </div>

              {/* Order History */}
              <div>
                <h4 className="text-sm font-semibold text-[rgb(var(--color-text-primary))] mb-3">Order History</h4>
                {loadingDetail ? (
                  <p className="text-sm text-[rgb(var(--color-text-tertiary))]">Loading...</p>
                ) : selectedCustomer.orders.length === 0 ? (
                  <p className="text-sm text-[rgb(var(--color-text-tertiary))]">No orders yet</p>
                ) : (
                  <div className="space-y-2">
                    {selectedCustomer.orders.slice(0, 10).map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between rounded-lg border border-[rgb(var(--color-border-subtle))] p-3">
                        <div>
                          <p className="text-sm font-medium text-[rgb(var(--color-text-primary))]">{order.order_number}</p>
                          <p className="text-xs text-[rgb(var(--color-text-tertiary))]">{new Date(order.created_at).toLocaleDateString()} · {order.items?.length || 0} items</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[rgb(var(--color-text-primary))]">RM {(order.total / 100).toFixed(2)}</p>
                          <span className={`text-xs ${order.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>{order.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Customer Modal */}
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
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email: email || null, phone: phone || null, notes: notes || null }) });
    onAdded(await res.json());
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.form initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="w-full max-w-md rounded-xl bg-[rgb(var(--color-surface-primary))] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-[rgb(var(--color-text-primary))]">Add Customer</h2><button type="button" onClick={onClose}><X className="h-5 w-5 text-[rgb(var(--color-text-tertiary))]" /></button></div>
        <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">Name *</label><input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" /></div>
        <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" /></div>
        <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+60 12-345 6789" className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" /></div>
        <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="VIP, allergies, preferences..." className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))] resize-none" /></div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[rgb(var(--color-border-default))] py-2.5 text-sm font-medium text-[rgb(var(--color-text-secondary))]">Cancel</button>
          <button type="submit" disabled={saving || !name} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[rgb(var(--color-brand-500))] py-2.5 text-sm font-medium text-white disabled:opacity-50"><Check className="h-4 w-4" />{saving ? 'Saving...' : 'Add Customer'}</button>
        </div>
      </motion.form>
    </motion.div>
  );
}
