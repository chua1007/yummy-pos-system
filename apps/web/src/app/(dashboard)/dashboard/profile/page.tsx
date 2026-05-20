'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Check, User, Building, Lock, Mail } from 'lucide-react';

interface ProfileData {
  user: { id: string; email: string; name: string; role: string; tenant_id: string | null; created_at: string; };
  tenant: { id: string; name: string; phone: string | null; address: string | null; plan: string; } | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantPhone, setRestaurantPhone] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetch('/api/auth/profile').then((r) => r.json()).then((data) => {
      setProfile(data);
      setName(data.user.name);
      setEmail(data.user.email);
      if (data.tenant) {
        setRestaurantName(data.tenant.name || '');
        setRestaurantPhone(data.tenant.phone || '');
        setRestaurantAddress(data.tenant.address || '');
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');

    const payload: any = { name, email };
    if (restaurantName) payload.restaurant_name = restaurantName;
    if (restaurantPhone) payload.restaurant_phone = restaurantPhone;
    if (restaurantAddress) payload.restaurant_address = restaurantAddress;
    if (newPassword) {
      payload.current_password = currentPassword;
      payload.new_password = newPassword;
    }

    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to update');
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    setCurrentPassword('');
    setNewPassword('');
    setTimeout(() => setSaved(false), 2000);

    // Reload page to reflect changes in header/sidebar
    window.location.reload();
  };

  if (loading || !profile) return <div className="p-6 text-[rgb(var(--color-text-tertiary))]">Loading...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text-primary))]">My Profile</h1>
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">Manage your account and restaurant details</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-[rgb(var(--color-brand-500))] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[rgb(var(--color-brand-600))] disabled:opacity-50">
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>}

      {/* Personal Info */}
      <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="h-5 w-5 text-[rgb(var(--color-brand-500))]" />
          <h2 className="text-base font-semibold text-[rgb(var(--color-text-primary))]">Personal Information</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Role</label>
            <input value={profile.user.role.replace('_', ' ')} disabled className="w-full rounded-lg border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-secondary))] px-3 py-2.5 text-sm capitalize opacity-60" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Member Since</label>
            <input value={new Date(profile.user.created_at).toLocaleDateString()} disabled className="w-full rounded-lg border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-secondary))] px-3 py-2.5 text-sm opacity-60" />
          </div>
        </div>
      </div>

      {/* Restaurant Info (only for restaurant owners) */}
      {profile.tenant && (
        <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-6">
          <div className="flex items-center gap-3 mb-4">
            <Building className="h-5 w-5 text-[rgb(var(--color-brand-500))]" />
            <h2 className="text-base font-semibold text-[rgb(var(--color-text-primary))]">Restaurant Details</h2>
            <span className="rounded-full bg-[rgb(var(--color-surface-secondary))] px-2 py-0.5 text-xs font-medium text-[rgb(var(--color-text-tertiary))] capitalize">{profile.tenant.plan} plan</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Restaurant Name</label>
              <input value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Phone</label>
              <input value={restaurantPhone} onChange={(e) => setRestaurantPhone(e.target.value)} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Address</label>
              <input value={restaurantAddress} onChange={(e) => setRestaurantAddress(e.target.value)} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" />
            </div>
          </div>
        </div>
      )}

      {/* Change Password */}
      <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-6">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="h-5 w-5 text-[rgb(var(--color-brand-500))]" />
          <h2 className="text-base font-semibold text-[rgb(var(--color-text-primary))]">Change Password</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" />
          </div>
        </div>
        <p className="mt-2 text-xs text-[rgb(var(--color-text-tertiary))]">Leave blank if you don&apos;t want to change your password.</p>
      </div>
    </motion.div>
  );
}
