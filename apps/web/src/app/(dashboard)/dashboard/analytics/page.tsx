'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Clock } from 'lucide-react';

interface AnalyticsData {
  stats: { totalRevenue: number; totalOrders: number; customerCount: number; avgOrderValue: number; revenueChange: number; orderChange: number; };
  hourlyData: { hour: string; orders: number }[];
  topItems: { name: string; orders: number; revenue: number }[];
  dailyOrders: { day: string; count: number; revenue: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics').then((r) => r.json()).then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading || !data) return <div className="p-6 text-[rgb(var(--color-text-tertiary))]">Loading analytics...</div>;

  const { stats, hourlyData, topItems } = data;
  const maxHourly = Math.max(...hourlyData.map((d) => d.orders), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--color-text-primary))]">Analytics</h1>
        <p className="text-sm text-[rgb(var(--color-text-secondary))]">This month&apos;s performance (live data)</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBox icon={<DollarSign className="h-4 w-4" />} label="Total Revenue" value={`RM ${(stats.totalRevenue / 100).toFixed(2)}`} change={`${stats.revenueChange >= 0 ? '+' : ''}${stats.revenueChange}%`} up={stats.revenueChange >= 0} />
        <StatBox icon={<ShoppingBag className="h-4 w-4" />} label="Total Orders" value={String(stats.totalOrders)} change={`${stats.orderChange >= 0 ? '+' : ''}${stats.orderChange}%`} up={stats.orderChange >= 0} />
        <StatBox icon={<Users className="h-4 w-4" />} label="Customers" value={String(stats.customerCount)} change="total registered" up={true} />
        <StatBox icon={<Clock className="h-4 w-4" />} label="Avg Order Value" value={`RM ${(stats.avgOrderValue / 100).toFixed(2)}`} change="per order" up={true} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Hourly Chart */}
        <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-6">
          <h3 className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">Orders by Hour</h3>
          <p className="text-xs text-[rgb(var(--color-text-tertiary))]">Today&apos;s activity</p>
          {hourlyData.every((d) => d.orders === 0) ? (
            <div className="mt-8 text-center text-sm text-[rgb(var(--color-text-tertiary))]">No orders today yet. Place some orders to see the chart.</div>
          ) : (
            <>
              <div className="mt-4 flex items-end gap-1.5 h-40">
                {hourlyData.map((d, i) => (
                  <motion.div
                    key={d.hour}
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.orders / maxHourly) * 100}%` }}
                    transition={{ delay: i * 0.03, type: 'spring', stiffness: 100 }}
                    className="flex-1 rounded-t bg-[rgb(var(--color-brand-500))] opacity-80 hover:opacity-100 transition-opacity cursor-pointer relative group min-h-[2px]"
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block rounded bg-[rgb(var(--color-text-primary))] px-1.5 py-0.5 text-[10px] text-[rgb(var(--color-text-inverse))] whitespace-nowrap">
                      {d.orders}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-[rgb(var(--color-text-tertiary))]">
                <span>8AM</span><span>12PM</span><span>4PM</span><span>8PM</span><span>10PM</span>
              </div>
            </>
          )}
        </div>

        {/* Top Items */}
        <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-6">
          <h3 className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">Top Selling Items</h3>
          <p className="text-xs text-[rgb(var(--color-text-tertiary))]">This month</p>
          {topItems.length === 0 ? (
            <div className="mt-8 text-center text-sm text-[rgb(var(--color-text-tertiary))]">No sales data yet. Complete some orders to see top items.</div>
          ) : (
            <div className="mt-4 space-y-3">
              {topItems.map((item, i) => (
                <motion.div key={item.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgb(var(--color-surface-secondary))] text-xs font-bold text-[rgb(var(--color-text-secondary))]">{i + 1}</span>
                    <span className="text-sm text-[rgb(var(--color-text-primary))]">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[rgb(var(--color-text-primary))]">RM {(item.revenue / 100).toFixed(2)}</p>
                    <p className="text-xs text-[rgb(var(--color-text-tertiary))]">{item.orders} orders</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatBox({ icon, label, value, change, up }: { icon: React.ReactNode; label: string; value: string; change: string; up: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[rgb(var(--color-text-secondary))]">{label}</p>
        <span className="text-[rgb(var(--color-text-tertiary))]">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-[rgb(var(--color-text-primary))]">{value}</p>
      <div className="mt-1 flex items-center gap-1">
        {up ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
        <span className={`text-xs font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>{change}</span>
        <span className="text-xs text-[rgb(var(--color-text-tertiary))]">vs last month</span>
      </div>
    </motion.div>
  );
}
