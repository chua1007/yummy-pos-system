'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { DashboardHeader } from '@/components/layout/dashboard-header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => {
        if (!r.ok) { router.push('/login'); return null; }
        return r.json();
      })
      .then((data) => {
        if (data?.user) {
          setAuthenticated(true);
        }
        setLoading(false);
      })
      .catch(() => { router.push('/login'); });
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[rgb(var(--color-surface-primary))]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[rgb(var(--color-brand-500))] border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-[rgb(var(--color-text-tertiary))]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
