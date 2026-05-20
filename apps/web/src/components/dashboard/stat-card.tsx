'use client';

import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ReactNode;
}

export function StatCard({ title, value, change, changeType, icon }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">{title}</p>
        <div className="rounded-lg bg-[rgb(var(--color-surface-secondary))] p-2 text-[rgb(var(--color-text-secondary))]">
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-[rgb(var(--color-text-primary))]">{value}</p>
        <p
          className={`mt-1 text-xs font-medium ${
            changeType === 'positive' ? 'text-green-600' : 'text-red-500'
          }`}
        >
          {change} from yesterday
        </p>
      </div>
    </motion.div>
  );
}
