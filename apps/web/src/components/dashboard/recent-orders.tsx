'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Order {
  id: string; order_number: string; customer_name: string; total: number; status: string; created_at: string;
  items: { id: string; name: string; quantity: number }[];
}

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-indigo-100 text-indigo-700',
  ready: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
};

export function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((data) => { setOrders(data.slice(0, 5)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  return (
    <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))]">
      <div className="flex items-center justify-between border-b border-[rgb(var(--color-border-default))] px-6 py-4">
        <h2 className="text-lg font-semibold text-[rgb(var(--color-text-primary))]">Recent Orders</h2>
        <Link
          href="/dashboard/orders"
          className="text-sm font-medium text-[rgb(var(--color-brand-500))] hover:text-[rgb(var(--color-brand-600))] transition-colors"
        >
          View all →
        </Link>
      </div>
      <div className="divide-y divide-[rgb(var(--color-border-subtle))]">
        {loading ? (
          <div className="px-6 py-8 text-center text-sm text-[rgb(var(--color-text-tertiary))]">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-[rgb(var(--color-text-tertiary))]">No orders yet</p>
            <Link href="/dashboard/orders" className="mt-2 inline-block text-sm font-medium text-[rgb(var(--color-brand-500))]">Create your first order →</Link>
          </div>
        ) : (
          orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between px-6 py-4 hover:bg-[rgb(var(--color-surface-secondary))] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium text-[rgb(var(--color-text-primary))]">{order.order_number}</p>
                  <p className="text-xs text-[rgb(var(--color-text-tertiary))]">{order.customer_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-[rgb(var(--color-text-secondary))]">
                  {order.items.length} items
                </span>
                <span className="text-sm font-medium text-[rgb(var(--color-text-primary))]">
                  RM {(order.total / 100).toFixed(2)}
                </span>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[order.status] || statusStyles.pending}`}>
                  {order.status}
                </span>
                <span className="text-xs text-[rgb(var(--color-text-tertiary))]">{timeAgo(order.created_at)}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
