'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/theme-provider';
import { useLanguage } from '@/components/language-provider';
import { Save, Store, Palette, Bell, Globe, Check, Upload, X } from 'lucide-react';

interface Settings {
  restaurant_name: string;
  restaurant_address: string;
  restaurant_phone: string;
  restaurant_email: string;
  opening_time: string;
  closing_time: string;
  currency: string;
  tax_rate: string;
  service_tax: string;
  timezone: string;
  language: string;
  logo_url: string;
  primary_color: string;
  notification_email: string;
  notification_push: string;
  notification_sms: string;
  notification_low_stock: string;
  notification_new_order: string;
}

type Tab = 'profile' | 'appearance' | 'notifications' | 'localization';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { locale, setLocale: setAppLocale } = useLanguage();

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((d) => {
      setSettings(d);
      setLoading(false);
      if (d.language && d.language !== locale) {
        setAppLocale(d.language);
      }
    });
  }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateField = (key: keyof Settings, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.url) updateField('logo_url', data.url);
  };

  if (loading || !settings) return <div className="p-6">Loading...</div>;

  const tabs = [
    { id: 'profile' as Tab, label: 'Restaurant Profile', icon: <Store className="h-4 w-4" /> },
    { id: 'appearance' as Tab, label: 'Appearance', icon: <Palette className="h-4 w-4" /> },
    { id: 'notifications' as Tab, label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
    { id: 'localization' as Tab, label: 'Localization', icon: <Globe className="h-4 w-4" /> },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text-primary))]">Settings</h1>
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">Manage your restaurant configuration</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[rgb(var(--color-brand-500))] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[rgb(var(--color-brand-600))] disabled:opacity-50 transition-colors"
        >
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-secondary))] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[rgb(var(--color-surface-primary))] text-[rgb(var(--color-text-primary))] shadow-sm'
                : 'text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-6">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-[rgb(var(--color-text-primary))] mb-4">Restaurant Information</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Restaurant Name</label>
                  <input value={settings.restaurant_name} onChange={(e) => updateField('restaurant_name', e.target.value)} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm text-[rgb(var(--color-input-text))] bg-[rgb(var(--color-input-bg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Email</label>
                  <input type="email" value={settings.restaurant_email} onChange={(e) => updateField('restaurant_email', e.target.value)} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm text-[rgb(var(--color-input-text))] bg-[rgb(var(--color-input-bg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Phone</label>
                  <input value={settings.restaurant_phone} onChange={(e) => updateField('restaurant_phone', e.target.value)} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm text-[rgb(var(--color-input-text))] bg-[rgb(var(--color-input-bg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Address</label>
                  <input value={settings.restaurant_address} onChange={(e) => updateField('restaurant_address', e.target.value)} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm text-[rgb(var(--color-input-text))] bg-[rgb(var(--color-input-bg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" />
                </div>
              </div>
            </div>

            <div className="border-t border-[rgb(var(--color-border-default))] pt-6">
              <h3 className="text-base font-semibold text-[rgb(var(--color-text-primary))] mb-4">Operating Hours</h3>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Opening Time</label>
                  <input type="time" value={settings.opening_time} onChange={(e) => updateField('opening_time', e.target.value)} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm text-[rgb(var(--color-input-text))] bg-[rgb(var(--color-input-bg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Closing Time</label>
                  <input type="time" value={settings.closing_time} onChange={(e) => updateField('closing_time', e.target.value)} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm text-[rgb(var(--color-input-text))] bg-[rgb(var(--color-input-bg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" />
                </div>
              </div>
            </div>

            <div className="border-t border-[rgb(var(--color-border-default))] pt-6">
              <h3 className="text-base font-semibold text-[rgb(var(--color-text-primary))] mb-4">Tax Configuration</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">SST Rate (%)</label>
                  <input type="number" min="0" max="100" step="0.5" value={settings.tax_rate} onChange={(e) => updateField('tax_rate', e.target.value)} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm text-[rgb(var(--color-input-text))] bg-[rgb(var(--color-input-bg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" />
                  <p className="mt-1 text-xs text-[rgb(var(--color-text-tertiary))]">Sales & Service Tax (SST)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Service Tax (%)</label>
                  <input type="number" min="0" max="100" step="0.5" value={settings.service_tax} onChange={(e) => updateField('service_tax', e.target.value)} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm text-[rgb(var(--color-input-text))] bg-[rgb(var(--color-input-bg))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" />
                  <p className="mt-1 text-xs text-[rgb(var(--color-text-tertiary))]">Service charge applied to all orders</p>
                </div>
              </div>
            </div>

            <div className="border-t border-[rgb(var(--color-border-default))] pt-6">
              <h3 className="text-base font-semibold text-[rgb(var(--color-text-primary))] mb-4">Logo</h3>
              <div className="flex items-center gap-4">
                {settings.logo_url ? (
                  <div className="relative">
                    <img src={settings.logo_url} alt="Logo" className="h-16 w-16 rounded-lg object-cover border" />
                    <button onClick={() => updateField('logo_url', '')} className="absolute -top-1 -right-1 rounded-full bg-red-500 p-0.5 text-white"><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-[rgb(var(--color-border-default))] text-2xl">🍽️</div>
                )}
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2 text-sm hover:bg-[rgb(var(--color-surface-secondary))] transition-colors">
                  <Upload className="h-4 w-4" /> Upload Logo
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-[rgb(var(--color-text-primary))] mb-4">Theme</h3>
              <div className="flex gap-3">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 w-32 transition-all ${
                      theme === t
                        ? 'border-[rgb(var(--color-brand-500))] bg-[rgb(var(--color-brand-50))]'
                        : 'border-[rgb(var(--color-border-default))] hover:border-[rgb(var(--color-border-strong))]'
                    }`}
                  >
                    <div className={`h-12 w-full rounded-lg ${t === 'light' ? 'bg-white border' : t === 'dark' ? 'bg-slate-900' : 'bg-gradient-to-r from-white to-slate-900'}`} />
                    <span className="text-sm font-medium capitalize">{t}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-[rgb(var(--color-text-tertiary))]">Currently: {resolvedTheme} mode</p>
            </div>

            <div className="border-t border-[rgb(var(--color-border-default))] pt-6">
              <h3 className="text-base font-semibold text-[rgb(var(--color-text-primary))] mb-4">Brand Color</h3>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => updateField('primary_color', e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded border-0"
                />
                <input
                  value={settings.primary_color}
                  onChange={(e) => updateField('primary_color', e.target.value)}
                  className="w-32 rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]"
                />
                <div className="flex gap-2">
                  {['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#ec4899'].map((c) => (
                    <button key={c} onClick={() => updateField('primary_color', c)} className="h-8 w-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-base font-semibold text-[rgb(var(--color-text-primary))]">Notification Channels</h3>
            <div className="space-y-4">
              {[
                { key: 'notification_email', label: 'Email Notifications', desc: 'Receive order updates and reports via email' },
                { key: 'notification_push', label: 'Push Notifications', desc: 'Browser push notifications for new orders' },
                { key: 'notification_sms', label: 'SMS Notifications', desc: 'SMS alerts for critical events' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-lg border border-[rgb(var(--color-border-default))] p-4">
                  <div>
                    <p className="text-sm font-medium text-[rgb(var(--color-text-primary))]">{item.label}</p>
                    <p className="text-xs text-[rgb(var(--color-text-tertiary))]">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => updateField(item.key as keyof Settings, settings[item.key as keyof Settings] === '1' ? '0' : '1')}
                    className={`relative h-6 w-11 rounded-full transition-colors ${settings[item.key as keyof Settings] === '1' ? 'bg-[rgb(var(--color-brand-500))]' : 'bg-[rgb(var(--color-surface-tertiary))]'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${settings[item.key as keyof Settings] === '1' ? 'translate-x-5.5 left-0.5' : 'left-0.5'}`} style={{ transform: settings[item.key as keyof Settings] === '1' ? 'translateX(22px)' : 'translateX(0)' }} />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-[rgb(var(--color-border-default))] pt-6">
              <h3 className="text-base font-semibold text-[rgb(var(--color-text-primary))] mb-4">Alert Types</h3>
              <div className="space-y-4">
                {[
                  { key: 'notification_new_order', label: 'New Order Alerts', desc: 'Get notified when a new order is placed' },
                  { key: 'notification_low_stock', label: 'Low Stock Alerts', desc: 'Alert when inventory falls below threshold' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-lg border border-[rgb(var(--color-border-default))] p-4">
                    <div>
                      <p className="text-sm font-medium text-[rgb(var(--color-text-primary))]">{item.label}</p>
                      <p className="text-xs text-[rgb(var(--color-text-tertiary))]">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => updateField(item.key as keyof Settings, settings[item.key as keyof Settings] === '1' ? '0' : '1')}
                      className={`relative h-6 w-11 rounded-full transition-colors ${settings[item.key as keyof Settings] === '1' ? 'bg-[rgb(var(--color-brand-500))]' : 'bg-[rgb(var(--color-surface-tertiary))]'}`}
                    >
                      <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform" style={{ transform: settings[item.key as keyof Settings] === '1' ? 'translateX(22px)' : 'translateX(0)', left: '2px' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'localization' && (
          <div className="space-y-6">
            <h3 className="text-base font-semibold text-[rgb(var(--color-text-primary))] mb-4">Regional Settings</h3>
            <p className="text-sm text-[rgb(var(--color-text-secondary))] -mt-2 mb-4">Changes are saved when you click &quot;Save Changes&quot;. Language change will apply after page reload.</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Language</label>
                <select value={settings.language} onChange={(e) => { updateField('language', e.target.value); setAppLocale(e.target.value); }} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]">
                  <option value="en">English</option>
                  <option value="ms">Bahasa Melayu</option>
                  <option value="zh-CN">简体中文</option>
                  <option value="zh-TW">繁體中文</option>
                  <option value="th">ภาษาไทย</option>
                  <option value="id">Bahasa Indonesia</option>
                </select>
                {settings.language !== 'en' && (
                  <p className="mt-1 text-xs text-[rgb(var(--color-brand-500))]">✓ Selected: {settings.language}. Click &quot;Save Changes&quot; then reload page.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Currency</label>
                <select value={settings.currency} onChange={(e) => updateField('currency', e.target.value)} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]">
                  <option value="MYR">MYR - Malaysian Ringgit</option>
                  <option value="SGD">SGD - Singapore Dollar</option>
                  <option value="THB">THB - Thai Baht</option>
                  <option value="IDR">IDR - Indonesian Rupiah</option>
                  <option value="PHP">PHP - Philippine Peso</option>
                  <option value="VND">VND - Vietnamese Dong</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--color-text-secondary))] mb-1">Timezone</label>
                <select value={settings.timezone} onChange={(e) => updateField('timezone', e.target.value)} className="w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]">
                  <option value="Asia/Kuala_Lumpur">Asia/Kuala Lumpur (GMT+8)</option>
                  <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                  <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                  <option value="Asia/Jakarta">Asia/Jakarta (GMT+7)</option>
                  <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                  <option value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh (GMT+7)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
