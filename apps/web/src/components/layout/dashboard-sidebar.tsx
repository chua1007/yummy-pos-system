'use client';

import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Package,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  History,
  Heart,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/components/language-provider';
import { useEffect, useState } from 'react';

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/dashboard/orders', labelKey: 'nav.orders', icon: ShoppingBag },
  { href: '/dashboard/order-history', labelKey: 'nav.order_history', icon: History },
  { href: '/dashboard/menu', labelKey: 'nav.menu', icon: UtensilsCrossed },
  { href: '/dashboard/tables', labelKey: 'nav.tables', icon: Grid3X3 },
  { href: '/dashboard/inventory', labelKey: 'nav.inventory', icon: Package },
  { href: '/dashboard/customers', labelKey: 'nav.customers', icon: Users },
  { href: '/dashboard/crm', labelKey: 'nav.crm', icon: Heart },
  { href: '/dashboard/analytics', labelKey: 'nav.analytics', icon: BarChart3 },
  { href: '/dashboard/settings', labelKey: 'nav.settings', icon: Settings },
];

export function DashboardSidebar({ collapsed, onToggle }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const { t } = useLanguage();
  const logoSrc = resolvedTheme === 'dark' ? '/yummy_dark_mode.png' : '/yummy_logo.png';
  const [userName, setUserName] = useState('');
  const [tenantName, setTenantName] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((data) => {
      if (data.user) {
        setUserName(data.user.name || '');
        setTenantName(data.user.tenant_name || 'Yummy');
      }
    }).catch(() => {});
  }, []);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex h-screen flex-col border-r border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] overflow-hidden"
    >
      {/* Logo */}
      <div className="flex h-20 items-center justify-between border-b border-[rgb(var(--color-border-default))] px-4">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center"
          >
            <img src={logoSrc} alt="Yummy" className="w-36 object-contain" />
          </motion.div>
        )}
        {collapsed && (
          <img src="/yummy_min.png" alt="Yummy" className="h-10 w-10 object-contain" />
        )}
        <button
          onClick={onToggle}
          className="rounded-md p-1.5 text-[rgb(var(--color-text-tertiary))] hover:bg-[rgb(var(--color-surface-secondary))] hover:text-[rgb(var(--color-text-primary))] transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-[rgb(var(--color-brand-50))] text-[rgb(var(--color-brand-600))]'
                  : 'text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-secondary))] hover:text-[rgb(var(--color-text-primary))]'
              } ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? t(item.labelKey) : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="truncate"
                >
                  {t(item.labelKey)}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[rgb(var(--color-border-default))] p-3">
        <Link href="/dashboard/profile" className={`flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-[rgb(var(--color-surface-secondary))] transition-colors ${collapsed ? 'justify-center' : ''}`}>
          <div className="h-8 w-8 rounded-full bg-[rgb(var(--color-brand-500))] flex items-center justify-center text-white text-sm font-medium shrink-0">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[rgb(var(--color-text-primary))]">
                {userName || 'User'}
              </p>
              <p className="truncate text-xs text-[rgb(var(--color-text-tertiary))]">
                {tenantName || 'Restaurant'}
              </p>
            </div>
          )}
        </Link>
      </div>
    </motion.aside>
  );
}
