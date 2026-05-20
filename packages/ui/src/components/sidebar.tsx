'use client';

import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

interface SidebarProps {
  collapsed?: boolean;
  children: React.ReactNode;
  className?: string;
}

function Sidebar({ collapsed = false, children, className }: SidebarProps) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'flex h-screen flex-col border-r border-[rgb(var(--color-border-default))]',
        'bg-[rgb(var(--color-surface-primary))] overflow-hidden',
        className,
      )}
    >
      {children}
    </motion.aside>
  );
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon, label, active, collapsed, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
        'transition-colors duration-150',
        active
          ? 'bg-[rgb(var(--color-brand-50))] text-[rgb(var(--color-brand-600))]'
          : 'text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-secondary))] hover:text-[rgb(var(--color-text-primary))]',
        collapsed && 'justify-center px-2',
      )}
      title={collapsed ? label : undefined}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 0 }}
          className="truncate"
        >
          {label}
        </motion.span>
      )}
    </button>
  );
}

interface SidebarGroupProps {
  label?: string;
  collapsed?: boolean;
  children: React.ReactNode;
}

function SidebarGroup({ label, collapsed, children }: SidebarGroupProps) {
  return (
    <div className="px-3 py-2">
      {label && !collapsed && (
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-text-tertiary))]">
          {label}
        </p>
      )}
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

export { Sidebar, SidebarItem, SidebarGroup };
