'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Check, ShoppingBag } from 'lucide-react';

interface OrderItem { id: string; name: string; quantity: number; unit_price: number; subtotal: number; }
interface Order { id: string; order_number: string; type: string; status: string; table_number: string | null; customer_name: string; subtotal: number; tax_amount: number; total: number; created_at: string; items: OrderItem[]; }
interface MenuItem { id: string; name: string; price: number; image: string; category_id: string; }

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-indigo-100 text-indigo-700',
  ready: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
};

const statusFlow = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchOrders = async () => {
    const res = await fetch(`/api/orders${filterStatus !== 'all' ? `?status=${filterStatus}` : ''}`);
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [filterStatus]);

  const updateStatus = async (order: Order, newStatus: string) => {
    const res = await fetch(`/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    const updated = await res.json();
    setOrders(orders.map((o) => (o.id === updated.id ? updated : o)));
  };

  const getNextStatus = (current: string) => {
    const idx = statusFlow.indexOf(current);
    return idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null;
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text-primary))]">Orders</h1>
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">{orders.length} orders</p>
        </div>
        <button
          onClick={() => setShowNewOrder(true)}
          className="flex items-center gap-2 rounded-lg bg-[rgb(var(--color-brand-500))] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[rgb(var(--color-brand-600))] transition-colors"
        >
          <Plus className="h-4 w-4" /> New Order
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto">
        {['all', ...statusFlow, 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              filterStatus === s
                ? 'bg-[rgb(var(--color-brand-500))] text-white'
                : 'bg-[rgb(var(--color-surface-secondary))] text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-tertiary))]'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-[rgb(var(--color-text-tertiary))]">
          <ShoppingBag className="h-12 w-12 mb-3 opacity-30" />
          <p>No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {orders.map((order) => {
              const nextStatus = getNextStatus(order.status);
              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">{order.order_number}</p>
                        <p className="text-xs text-[rgb(var(--color-text-tertiary))]">{order.customer_name} · {order.type} {order.table_number ? `· Table ${order.table_number}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[order.status]}`}>
                        {order.status}
                      </span>
                      <span className="text-xs text-[rgb(var(--color-text-tertiary))]">{timeAgo(order.created_at)}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {order.items.map((item) => (
                      <span key={item.id} className="rounded bg-[rgb(var(--color-surface-secondary))] px-2 py-1 text-xs text-[rgb(var(--color-text-secondary))]">
                        {item.quantity}× {item.name}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="mt-3 flex items-center justify-between border-t border-[rgb(var(--color-border-subtle))] pt-3">
                    <p className="text-sm font-bold text-[rgb(var(--color-text-primary))]">RM {(order.total / 100).toFixed(2)}</p>
                    <div className="flex gap-2">
                      {order.status !== 'completed' && order.status !== 'cancelled' && (
                        <button
                          onClick={() => updateStatus(order, 'cancelled')}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      )}
                      {nextStatus && (
                        <button
                          onClick={() => updateStatus(order, nextStatus)}
                          className="rounded-lg bg-[rgb(var(--color-brand-500))] px-3 py-1.5 text-xs font-medium text-white hover:bg-[rgb(var(--color-brand-600))]"
                        >
                          Mark {nextStatus}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* New Order Modal */}
      <AnimatePresence>
        {showNewOrder && <NewOrderModal onClose={() => setShowNewOrder(false)} onCreated={(o) => { setOrders([o, ...orders]); setShowNewOrder(false); }} />}
      </AnimatePresence>
    </motion.div>
  );
}

function NewOrderModal({ onClose, onCreated }: { onClose: () => void; onCreated: (order: Order) => void }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState('dine_in');
  const [tableNumber, setTableNumber] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/menu').then((r) => r.json()).then((d) => setMenuItems(d.items));
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) return prev.map((c) => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.item.price * c.quantity, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setSaving(true);

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: orderType,
        table_number: tableNumber || null,
        customer_name: customerName || 'Walk-in',
        items: cart.map((c) => ({ menu_item_id: c.item.id, quantity: c.quantity })),
      }),
    });

    const order = await res.json();
    onCreated(order);
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} onClick={(e) => e.stopPropagation()} className="ml-auto flex h-full w-full max-w-2xl flex-col bg-[rgb(var(--color-surface-primary))] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgb(var(--color-border-default))] px-6 py-4">
          <h2 className="text-lg font-semibold text-[rgb(var(--color-text-primary))]">New Order</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-[rgb(var(--color-surface-secondary))]"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto border-r border-[rgb(var(--color-border-default))] p-4">
            <div className="grid grid-cols-2 gap-2">
              {menuItems.filter((i: any) => i.is_available).map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="flex items-center gap-2 rounded-lg border border-[rgb(var(--color-border-default))] p-3 text-left hover:bg-[rgb(var(--color-surface-secondary))] transition-colors"
                >
                  <span className="text-2xl">{item.image}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[rgb(var(--color-text-primary))] truncate">{item.name}</p>
                    <p className="text-xs text-[rgb(var(--color-brand-500))]">RM {(item.price / 100).toFixed(2)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div className="flex w-72 flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Customer</label>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in" className="mt-1 w-full rounded border border-[rgb(var(--color-border-default))] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-brand-500))]" />
              </div>
              <div className="flex gap-2">
                {['dine_in', 'takeaway', 'delivery'].map((t) => (
                  <button key={t} onClick={() => setOrderType(t)} className={`flex-1 rounded px-2 py-1.5 text-xs font-medium ${orderType === t ? 'bg-[rgb(var(--color-brand-500))] text-white' : 'bg-[rgb(var(--color-surface-secondary))] text-[rgb(var(--color-text-secondary))]'}`}>
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>
              {orderType === 'dine_in' && (
                <div>
                  <label className="text-xs font-medium text-[rgb(var(--color-text-secondary))]">Table</label>
                  <input value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="T-01" className="mt-1 w-full rounded border border-[rgb(var(--color-border-default))] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[rgb(var(--color-brand-500))]" />
                </div>
              )}

              <div className="border-t border-[rgb(var(--color-border-default))] pt-3">
                <p className="text-xs font-medium text-[rgb(var(--color-text-secondary))] mb-2">Items ({cart.length})</p>
                {cart.map((c) => (
                  <div key={c.item.id} className="flex items-center justify-between py-1.5">
                    <div>
                      <p className="text-xs text-[rgb(var(--color-text-primary))]">{c.quantity}× {c.item.name}</p>
                      <p className="text-xs text-[rgb(var(--color-text-tertiary))]">RM {((c.item.price * c.quantity) / 100).toFixed(2)}</p>
                    </div>
                    <button onClick={() => removeFromCart(c.item.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[rgb(var(--color-border-default))] p-4">
              <div className="flex justify-between mb-3">
                <span className="text-sm text-[rgb(var(--color-text-secondary))]">Total</span>
                <span className="text-lg font-bold text-[rgb(var(--color-text-primary))]">RM {(cartTotal / 100).toFixed(2)}</span>
              </div>
              <button
                onClick={placeOrder}
                disabled={cart.length === 0 || saving}
                className="w-full rounded-lg bg-[rgb(var(--color-brand-500))] py-2.5 text-sm font-medium text-white hover:bg-[rgb(var(--color-brand-600))] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4" />
                {saving ? 'Placing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
