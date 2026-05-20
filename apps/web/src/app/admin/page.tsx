'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Plus, Store, Users, LogOut, X, Check, Trash2, Edit2, Shield } from 'lucide-react';

interface Tenant {
  id: string; name: string; slug: string; plan: string; status: string; email: string | null; phone: string | null; address: string | null; user_count: number; created_at: string;
}

interface AuthUser {
  id: string; email: string; name: string; role: string;
}

export default function AdminPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check auth
    fetch('/api/auth/me').then((r) => {
      if (!r.ok) { router.push('/login'); return; }
      return r.json();
    }).then((data) => {
      if (!data?.user || data.user.role !== 'super_admin') { router.push('/login'); return; }
      setUser(data.user);
      fetchTenants();
    }).catch(() => router.push('/login'));
  }, [router]);

  const fetchTenants = async () => {
    const res = await fetch('/api/admin/tenants');
    if (res.ok) setTenants(await res.json());
    setLoading(false);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const deleteTenant = async (id: string) => {
    if (!confirm('Delete this restaurant and all its users? This cannot be undone.')) return;
    await fetch(`/api/admin/tenants/${id}`, { method: 'DELETE' });
    setTenants(tenants.filter((t) => t.id !== id));
  };

  const toggleStatus = async (tenant: Tenant) => {
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
    const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    const updated = await res.json();
    setTenants(tenants.map((t) => t.id === updated.id ? updated : t));
  };

  if (!user) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-orange-500" />
            <div>
              <h1 className="text-lg font-bold">Yummy Admin Panel</h1>
              <p className="text-xs text-slate-400">Manage restaurants & accounts</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{user.email}</span>
            <button onClick={logout} className="flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-700 transition-colors">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <Store className="h-6 w-6 text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{tenants.length}</p>
            <p className="text-sm text-slate-400">Restaurants</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <Users className="h-6 w-6 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{tenants.reduce((sum, t) => sum + (t.user_count || 0), 0)}</p>
            <p className="text-sm text-slate-400">Total Users</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
            <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center mb-2"><div className="h-2 w-2 rounded-full bg-green-500" /></div>
            <p className="text-2xl font-bold">{tenants.filter((t) => t.status === 'active').length}</p>
            <p className="text-sm text-slate-400">Active</p>
          </div>
        </div>

        {/* Restaurants */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Restaurants</h2>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium hover:bg-orange-600 transition-colors">
            <Plus className="h-4 w-4" /> Add Restaurant
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading...</div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl">
            <Store className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No restaurants yet</p>
            <p className="text-sm text-slate-500">Create your first restaurant to get started</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Restaurant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Users</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{tenant.name}</p>
                      <p className="text-xs text-slate-500">{tenant.email || tenant.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-medium capitalize">{tenant.plan}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleStatus(tenant)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tenant.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {tenant.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{tenant.user_count || 0}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(tenant.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => deleteTenant(tenant.id)} className="rounded p-1.5 hover:bg-red-900/30 text-slate-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add Restaurant Modal */}
      <AnimatePresence>
        {showAdd && <AddTenantModal onClose={() => setShowAdd(false)} onAdded={(t) => { setTenants([t, ...tenants]); setShowAdd(false); }} />}
      </AnimatePresence>
    </div>
  );
}

function AddTenantModal({ onClose, onAdded }: { onClose: () => void; onAdded: (t: Tenant) => void }) {
  const [name, setName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [plan, setPlan] = useState('starter');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const res = await fetch('/api/admin/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, owner_email: ownerEmail, owner_name: ownerName, owner_password: ownerPassword || 'password123', plan, phone, address, email: ownerEmail }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to create restaurant');
      setSaving(false);
      return;
    }

    onAdded(await res.json());
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.form initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Add Restaurant</h2>
          <button type="button" onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
        </div>

        <div className="border-b border-slate-700 pb-4">
          <p className="text-xs text-slate-400 mb-3">Restaurant Details</p>
          <div className="space-y-3">
            <div><label className="text-sm font-medium text-slate-300">Restaurant Name *</label><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Warung Makan Ali" className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-slate-300">Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>
              <div><label className="text-sm font-medium text-slate-300">Plan</label>
                <select value={plan} onChange={(e) => setPlan(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="starter">Starter</option><option value="growth">Growth</option><option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
            <div><label className="text-sm font-medium text-slate-300">Address</label><input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-3">Owner Account (login credentials)</p>
          <div className="space-y-3">
            <div><label className="text-sm font-medium text-slate-300">Owner Name *</label><input required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>
            <div><label className="text-sm font-medium text-slate-300">Owner Email * (used for login)</label><input required type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="owner@restaurant.com" className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>
            <div><label className="text-sm font-medium text-slate-300">Password *</label><input required value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} placeholder="Min 6 characters" className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>
          </div>
        </div>

        {error && <p className="text-sm text-red-400 bg-red-900/20 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-600 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-700">Cancel</button>
          <button type="submit" disabled={saving || !name || !ownerEmail} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-orange-500 py-2.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50">
            <Check className="h-4 w-4" />{saving ? 'Creating...' : 'Create Restaurant'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}
