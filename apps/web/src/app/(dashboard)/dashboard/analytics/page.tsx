'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Clock } from 'lucide-react';

const stats = [
  { label: 'Total Revenue', value: 'RM 42,580', change: '+12.5%', up: true, icon: DollarSign },
  { label: 'Total Orders', value: '1,284', change: '+8.2%', up: true, icon: ShoppingBag },
  { label: 'New Customers', value: '89', change: '+15.3%', up: true, icon: Users },
  { label: 'Avg. Prep Time', value: '12 min', change: '-2.1%', up: true, icon: Clock },
];

const topItems = [
  { name: 'Nasi Lemak Special', orders: 142, revenue: 'RM 2,130' },
  { name: 'Mee Goreng Mamak', orders: 118, revenue: 'RM 1,416' },
  { name: 'Teh Tarik', orders: 203, revenue: 'RM 812' },
  { name: 'Roti Canai', orders: 189, revenue: 'RM 567' },
  { name: 'Satay (10pcs)', orders: 76, revenue: 'RM 1,368' },
];

const hourlyData = [
  { hour: '8AM', orders: 12 }, { hour: '9AM', orders: 28 }, { hour: '10AM', orders: 35 },
  { hour: '11AM', orders: 42 }, { hour: '12PM', orders: 68 }, { hour: '1PM', orders: 72 },
  { hour: '2PM', orders: 45 }, { hour: '3PM', orders: 22 }, { hour: '4PM', orders: 18 },
  { hour: '5PM', orders: 25 }, { hour: '6PM', orders: 55 }, { hour: '7PM', orders: 65 },
  { hour: '8PM', orders: 58 }, { hour: '9PM', orders: 38 }, { hour: '10PM', orders: 15 },
];

const maxOrders = Math.max(...hourlyData.map((d) => d.orders));

export default function AnalyticsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--color-text-primary))]">Analytics</h1>
        <p className="text-sm text-[rgb(var(--color-text-secondary))]">This month&apos;s performance overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-[rgb(var(--color-text-secondary))]">{stat.label}</p>
                <Icon className="h-4 w-4 text-[rgb(var(--color-text-tertiary))]" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[rgb(var(--color-text-primary))]">{stat.value}</p>
              <div className="mt-1 flex items-center gap-1">
                {stat.up ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                <span className={`text-xs font-medium ${stat.up ? 'text-green-600' : 'text-red-500'}`}>{stat.change}</span>
                <span className="text-xs text-[rgb(var(--color-text-tertiary))]">vs last month</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Hourly Chart */}
        <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-6">
          <h3 className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">Orders by Hour</h3>
          <p className="text-xs text-[rgb(var(--color-text-tertiary))]">Today&apos;s peak hours</p>
          <div className="mt-4 flex items-end gap-1.5 h-40">
            {hourlyData.map((d, i) => (
              <motion.div
                key={d.hour}
                initial={{ height: 0 }}
                animate={{ height: `${(d.orders / maxOrders) * 100}%` }}
                transition={{ delay: i * 0.03, type: 'spring', stiffness: 100 }}
                className="flex-1 rounded-t bg-[rgb(var(--color-brand-500))] opacity-80 hover:opacity-100 transition-opacity cursor-pointer relative group"
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
        </div>

        {/* Top Items */}
        <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-6">
          <h3 className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">Top Selling Items</h3>
          <p className="text-xs text-[rgb(var(--color-text-tertiary))]">This month</p>
          <div className="mt-4 space-y-3">
            {topItems.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgb(var(--color-surface-secondary))] text-xs font-bold text-[rgb(var(--color-text-secondary))]">
                    {i + 1}
                  </span>
                  <span className="text-sm text-[rgb(var(--color-text-primary))]">{item.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[rgb(var(--color-text-primary))]">{item.revenue}</p>
                  <p className="text-xs text-[rgb(var(--color-text-tertiary))]">{item.orders} orders</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
