'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Calendar, Filter, Receipt, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react';

interface OrderItem { id: string; name: string; quantity: number; unit_price: number; subtotal: number; }
interface Order { id: string; order_number: string; type: string; status: string; table_number: string | null; customer_name: string; subtotal: number; tax_amount: number; total: number; payment_status: string; created_at: string; completed_at: string | null; items: OrderItem[]; }
interface Summary { total_orders: number; total_revenue: number; avg_order_value: number; completed_orders: number; cancelled_orders: number; }

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700', preparing: 'bg-indigo-100 text-indigo-700', ready: 'bg-green-100 text-green-700', completed: 'bg-gray-100 text-gray-600', cancelled: 'bg-red-100 text-red-700',
};

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('limit', '20');

    const res = await fetch(`/api/orders/history?${params}`);
    const data = await res.json();
    setOrders(data.orders);
    setSummary(data.summary);
    setTotalPages(data.pagination.totalPages);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [dateFrom, dateTo, statusFilter, page]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchOrders(); };

  const exportCSV = () => {
    const headers = 'Order #,Customer,Type,Table,Status,Subtotal,Tax,Total,Date\n';
    const rows = orders.map((o) => `${o.order_number},${o.customer_name},${o.type},${o.table_number || '-'},${o.status},${(o.subtotal/100).toFixed(2)},${(o.tax_amount/100).toFixed(2)},${(o.total/100).toFixed(2)},${o.created_at}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `orders-${dateFrom || 'all'}-${dateTo || 'all'}.csv`; a.click();
  };

  const formatDate = (d: string) => new Date(d).toLocaleString('en-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text-primary))]">Order History & Reports</h1>
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">View, filter, and export all orders</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 rounded-lg border border-[rgb(var(--color-border-default))] px-4 py-2.5 text-sm font-medium text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-secondary))]">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-4">
            <div className="flex items-center gap-2 text-[rgb(var(--color-text-tertiary))]"><Receipt className="h-4 w-4" /><span className="text-xs">Total Orders</span></div>
            <p className="mt-1 text-2xl font-bold text-[rgb(var(--color-text-primary))]">{summary.total_orders}</p>
          </div>
          <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-4">
            <div className="flex items-center gap-2 text-[rgb(var(--color-text-tertiary))]"><DollarSign className="h-4 w-4" /><span className="text-xs">Total Revenue</span></div>
            <p className="mt-1 text-2xl font-bold text-[rgb(var(--color-text-primary))]">RM {(summary.total_revenue / 100).toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-4">
            <div className="flex items-center gap-2 text-[rgb(var(--color-text-tertiary))]"><TrendingUp className="h-4 w-4" /><span className="text-xs">Avg Order Value</span></div>
            <p className="mt-1 text-2xl font-bold text-[rgb(var(--color-text-primary))]">RM {(summary.avg_order_value / 100).toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-4">
            <div className="flex items-center gap-2 text-[rgb(var(--color-text-tertiary))]"><ShoppingBag className="h-4 w-4" /><span className="text-xs">Completed</span></div>
            <p className="mt-1 text-2xl font-bold text-green-600">{summary.completed_orders} <span className="text-sm text-red-500">({summary.cancelled_orders} cancelled)</span></p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[rgb(var(--color-text-tertiary))]" />
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="rounded border border-[rgb(var(--color-border-default))] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-brand-500))]" />
          <span className="text-xs text-[rgb(var(--color-text-tertiary))]">to</span>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="rounded border border-[rgb(var(--color-border-default))] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-brand-500))]" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="rounded border border-[rgb(var(--color-border-default))] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-brand-500))]">
          <option value="all">All Status</option>
          <option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="preparing">Preparing</option><option value="ready">Ready</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
        </select>
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="flex flex-1 items-center gap-2 rounded border border-[rgb(var(--color-border-default))] px-2 py-1.5">
            <Search className="h-4 w-4 text-[rgb(var(--color-text-tertiary))]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order # or customer..." className="flex-1 bg-transparent text-sm focus:outline-none" />
          </div>
          <button type="submit" className="rounded bg-[rgb(var(--color-brand-500))] px-3 py-1.5 text-sm text-white">Search</button>
        </form>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[rgb(var(--color-text-tertiary))]">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-[rgb(var(--color-text-tertiary))]">No orders found for the selected filters.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-secondary))]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--color-border-subtle))]">
              {orders.map((order) => (
                <tr key={order.id} onClick={() => setSelectedOrder(order)} className="hover:bg-[rgb(var(--color-surface-secondary))] transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-sm font-medium text-[rgb(var(--color-brand-500))]">{order.order_number}</td>
                  <td className="px-4 py-3 text-sm text-[rgb(var(--color-text-secondary))]">{order.customer_name}</td>
                  <td className="px-4 py-3 text-sm text-[rgb(var(--color-text-secondary))] capitalize">{order.type.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-sm text-[rgb(var(--color-text-secondary))]">{order.items.length} items</td>
                  <td className="px-4 py-3 text-sm font-medium text-[rgb(var(--color-text-primary))]">RM {(order.total / 100).toFixed(2)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[order.status]}`}>{order.status}</span></td>
                  <td className="px-4 py-3 text-xs text-[rgb(var(--color-text-tertiary))]">{formatDate(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border px-3 py-1.5 text-sm disabled:opacity-50">Previous</button>
          <span className="text-sm text-[rgb(var(--color-text-secondary))]">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded border px-3 py-1.5 text-sm disabled:opacity-50">Next</button>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-xl bg-[rgb(var(--color-surface-primary))] p-6 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[rgb(var(--color-text-primary))]">{selectedOrder.order_number}</h2>
                <p className="text-xs text-[rgb(var(--color-text-tertiary))]">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[selectedOrder.status]}`}>{selectedOrder.status}</span>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm"><span className="text-[rgb(var(--color-text-secondary))]">Customer</span><span className="font-medium text-[rgb(var(--color-text-primary))]">{selectedOrder.customer_name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[rgb(var(--color-text-secondary))]">Type</span><span className="capitalize text-[rgb(var(--color-text-primary))]">{selectedOrder.type.replace('_', ' ')}</span></div>
              {selectedOrder.table_number && <div className="flex justify-between text-sm"><span className="text-[rgb(var(--color-text-secondary))]">Table</span><span className="text-[rgb(var(--color-text-primary))]">{selectedOrder.table_number}</span></div>}
            </div>
            <div className="border-t border-[rgb(var(--color-border-default))] pt-4">
              <p className="text-xs font-medium text-[rgb(var(--color-text-secondary))] mb-2">Items</p>
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="flex justify-between py-1.5 text-sm">
                  <span className="text-[rgb(var(--color-text-primary))]">{item.quantity}× {item.name}</span>
                  <span className="font-medium text-[rgb(var(--color-text-primary))]">RM {(item.subtotal / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[rgb(var(--color-border-default))] pt-3 mt-3 space-y-1">
              <div className="flex justify-between text-sm"><span className="text-[rgb(var(--color-text-secondary))]">Subtotal</span><span>RM {(selectedOrder.subtotal / 100).toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[rgb(var(--color-text-secondary))]">Tax (6%)</span><span>RM {(selectedOrder.tax_amount / 100).toFixed(2)}</span></div>
              <div className="flex justify-between text-base font-bold pt-1"><span>Total</span><span className="text-[rgb(var(--color-brand-500))]">RM {(selectedOrder.total / 100).toFixed(2)}</span></div>
            </div>
            <button onClick={() => setSelectedOrder(null)} className="mt-4 w-full rounded-lg border border-[rgb(var(--color-border-default))] py-2 text-sm font-medium text-[rgb(var(--color-text-secondary))]">Close</button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
