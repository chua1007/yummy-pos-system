'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  DollarSign,
  Users,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { RecentOrders } from '@/components/dashboard/recent-orders';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

interface Stats {
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
  revenueChange: number;
  orderChange: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/stats').then((r) => r.json()).then(setStats).catch(() => {});
  }, []);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl font-bold text-[rgb(var(--color-text-primary))]">Dashboard</h1>
        <p className="text-sm text-[rgb(var(--color-text-secondary))]">
          Welcome back. Here&apos;s what&apos;s happening today.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Revenue"
          value={stats ? `RM ${(stats.revenue / 100).toFixed(2)}` : 'RM 0.00'}
          change={stats ? `${stats.revenueChange >= 0 ? '+' : ''}${stats.revenueChange}%` : '0%'}
          changeType={stats && stats.revenueChange >= 0 ? 'positive' : 'negative'}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          title="Orders"
          value={stats ? String(stats.orders) : '0'}
          change={stats ? `${stats.orderChange >= 0 ? '+' : ''}${stats.orderChange}%` : '0%'}
          changeType={stats && stats.orderChange >= 0 ? 'positive' : 'negative'}
          icon={<ShoppingBag className="h-5 w-5" />}
        />
        <StatCard
          title="Customers"
          value={stats ? String(stats.customers) : '0'}
          change="total"
          changeType="positive"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Avg. Order Value"
          value={stats ? `RM ${(stats.avgOrderValue / 100).toFixed(2)}` : 'RM 0.00'}
          change="per order"
          changeType="positive"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </motion.div>

      {/* Recent Orders */}
      <motion.div variants={staggerItem}>
        <RecentOrders />
      </motion.div>
    </motion.div>
  );
}
