'use client';

import { useEffect, useState } from 'react';
import { Menu, Moon, Sun, Bell, Search, X } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string; type: string; title: string; message: string; is_read: number; link: string | null; created_at: string;
}

interface DashboardHeaderProps {
  onMenuToggle: () => void;
}

export function DashboardHeader({ onMenuToggle }: DashboardHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_all_read' }),
    });
    setNotifications(notifications.map((n) => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
  };

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark_read', id }),
    });
    setNotifications(notifications.map((n) => n.id === id ? { ...n, is_read: 1 } : n));
    setUnreadCount(Math.max(0, unreadCount - 1));
  };

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] px-6">
      <div className="flex items-center gap-4">
        <button onClick={onMenuToggle} className="rounded-md p-2 text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-secondary))] lg:hidden" aria-label="Toggle menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-secondary))] px-3 py-2">
          <Search className="h-4 w-4 text-[rgb(var(--color-text-tertiary))]" />
          <input type="text" placeholder="Search... (⌘K)" className="w-64 bg-transparent text-sm text-[rgb(var(--color-text-primary))] placeholder:text-[rgb(var(--color-text-tertiary))] focus:outline-none" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={toggleTheme} className="relative rounded-md p-2 text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-secondary))] transition-colors" aria-label="Toggle theme">
          <motion.div initial={false} animate={{ rotate: resolvedTheme === 'dark' ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
            {resolvedTheme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </motion.div>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-md p-2 text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-secondary))] transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <motion.span
                key={unreadCount}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
              >
                {unreadCount}
              </motion.span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-[rgb(var(--color-border-default))] px-4 py-3">
                  <h3 className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-[rgb(var(--color-brand-500))] hover:underline">Mark all read</button>
                    )}
                    <button onClick={() => setShowNotifications(false)}><X className="h-4 w-4 text-[rgb(var(--color-text-tertiary))]" /></button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-sm text-[rgb(var(--color-text-tertiary))]">No notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`flex gap-3 px-4 py-3 border-b border-[rgb(var(--color-border-subtle))] cursor-pointer hover:bg-[rgb(var(--color-surface-secondary))] transition-colors ${!n.is_read ? 'bg-[rgb(var(--color-brand-50))]' : ''}`}
                      >
                        <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${!n.is_read ? 'bg-[rgb(var(--color-brand-500))]' : 'bg-transparent'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[rgb(var(--color-text-primary))]">{n.title}</p>
                          <p className="text-xs text-[rgb(var(--color-text-secondary))] truncate">{n.message}</p>
                          <p className="text-xs text-[rgb(var(--color-text-tertiary))] mt-0.5">{timeAgo(n.created_at)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button className="ml-2 h-8 w-8 rounded-full bg-[rgb(var(--color-brand-500))] flex items-center justify-center text-white text-sm font-medium">
          A
        </button>
      </div>
    </header>
  );
}
