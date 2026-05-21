'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Banknote, Smartphone, Receipt, Trash2, Printer, Check, X } from 'lucide-react';

interface OrderItem { id: string; name: string; quantity: number; unit_price: number; subtotal: number; }
interface Order { id: string; order_number: string; type: string; status: string; table_number: string | null; customer_name: string; subtotal: number; tax_amount: number; total: number; items: OrderItem[]; created_at: string; }
interface Invoice { id: string; invoice_number: string; customer_name: string; table_number: string; subtotal: number; tax_amount: number; rounding: number; total: number; payment_method: string; cashier_name: string; items: { name: string; quantity: number; unit_price: number; subtotal: number }[]; created_at: string; }

const paymentMethods = [
  { id: 'cash', label: 'Cash', icon: Banknote, color: 'bg-green-100 text-green-700 border-green-300' },
  { id: 'card', label: 'Credit/Debit Card', icon: CreditCard, color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { id: 'touch_n_go', label: 'Touch n Go', icon: Smartphone, color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { id: 'grabpay', label: 'GrabPay', icon: Smartphone, color: 'bg-green-100 text-green-700 border-green-300' },
  { id: 'boost', label: 'Boost', icon: Smartphone, color: 'bg-red-100 text-red-700 border-red-300' },
  { id: 'duitnow', label: 'DuitNow QR', icon: Smartphone, color: 'bg-orange-100 text-orange-700 border-orange-300' },
];

export default function CashierPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [processing, setProcessing] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);

  const fetchOrders = async () => {
    const res = await fetch('/api/orders?status=all');
    const data = await res.json();
    // Show only unpaid orders (pending, confirmed, preparing, ready)
    setOrders(data.filter((o: Order) => !['completed', 'cancelled'].includes(o.status)));
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const removeItem = async (orderId: string, itemId: string) => {
    const res = await fetch(`/api/orders/${orderId}/items/${itemId}`, { method: 'DELETE' });
    if (res.ok) {
      const updated = await res.json();
      setOrders(orders.map((o) => o.id === updated.id ? updated : o));
      if (selectedOrder?.id === updated.id) setSelectedOrder(updated);
    } else {
      const err = await res.json();
      alert(err.error || 'Cannot remove item');
    }
  };

  const processPayment = async () => {
    if (!selectedOrder) return;
    setProcessing(true);

    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: selectedOrder.id, payment_method: selectedPayment }),
    });

    if (res.ok) {
      const invoice = await res.json();
      setCompletedInvoice(invoice);
      setOrders(orders.filter((o) => o.id !== selectedOrder.id));
      setSelectedOrder(null);
    }
    setProcessing(false);
  };

  const printReceipt = () => {
    if (!completedInvoice) return;
    const w = window.open('', '_blank', 'width=350,height=600');
    if (!w) return;
    w.document.write(generateReceiptHTML(completedInvoice));
    w.document.close();
    w.print();
  };

  if (loading) return <div className="p-6 text-[rgb(var(--color-text-tertiary))]">Loading...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--color-text-primary))]">Cashier</h1>
        <p className="text-sm text-[rgb(var(--color-text-secondary))]">Process payments and generate receipts</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Pending Orders */}
        <div>
          <h3 className="text-sm font-semibold text-[rgb(var(--color-text-secondary))] mb-3">Pending Orders ({orders.length})</h3>
          {orders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[rgb(var(--color-border-default))] p-8 text-center text-[rgb(var(--color-text-tertiary))]">No pending orders</div>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => { setSelectedOrder(order); setCompletedInvoice(null); }}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${selectedOrder?.id === order.id ? 'border-[rgb(var(--color-brand-500))] bg-[rgb(var(--color-brand-50))]' : 'border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] hover:border-[rgb(var(--color-border-strong))]'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[rgb(var(--color-text-primary))]">{order.order_number}</p>
                      <p className="text-xs text-[rgb(var(--color-text-tertiary))]">{order.customer_name} {order.table_number ? `· Table ${order.table_number}` : ''}</p>
                    </div>
                    <p className="text-sm font-bold text-[rgb(var(--color-brand-500))]">RM {(order.total / 100).toFixed(2)}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {order.items.map((item) => (
                      <span key={item.id} className="rounded bg-[rgb(var(--color-surface-secondary))] px-1.5 py-0.5 text-[10px] text-[rgb(var(--color-text-secondary))]">{item.quantity}× {item.name}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Payment Panel */}
        <div>
          {completedInvoice ? (
            /* Receipt View */
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
              <Check className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-green-800">Payment Complete!</h3>
              <p className="text-sm text-green-600 mt-1">{completedInvoice.invoice_number}</p>
              <p className="text-2xl font-bold text-green-800 mt-2">RM {(completedInvoice.total / 100).toFixed(2)}</p>
              <p className="text-xs text-green-600 mt-1 capitalize">Paid by {completedInvoice.payment_method.replace('_', ' ')}</p>
              <div className="mt-4 flex gap-3">
                <button onClick={printReceipt} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700">
                  <Printer className="h-4 w-4" /> Print Receipt
                </button>
                <button onClick={() => setCompletedInvoice(null)} className="flex-1 rounded-lg border border-green-300 py-2.5 text-sm font-medium text-green-700">Done</button>
              </div>
            </div>
          ) : selectedOrder ? (
            /* Payment Form */
            <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[rgb(var(--color-text-primary))]">{selectedOrder.order_number}</h3>
                <button onClick={() => setSelectedOrder(null)}><X className="h-5 w-5 text-[rgb(var(--color-text-tertiary))]" /></button>
              </div>

              <div className="text-xs text-[rgb(var(--color-text-secondary))]">
                {selectedOrder.customer_name} {selectedOrder.table_number ? `· Table ${selectedOrder.table_number}` : ''}
              </div>

              {/* Order Items (removable) */}
              <div className="border-t border-[rgb(var(--color-border-default))] pt-3 space-y-2">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-[rgb(var(--color-text-primary))]">{item.quantity}× {item.name}</p>
                      <p className="text-xs text-[rgb(var(--color-text-tertiary))]">RM {(item.unit_price / 100).toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[rgb(var(--color-text-primary))]">RM {(item.subtotal / 100).toFixed(2)}</span>
                      <button onClick={() => removeItem(selectedOrder.id, item.id)} className="rounded p-1 text-[rgb(var(--color-text-tertiary))] hover:text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-[rgb(var(--color-border-default))] pt-3 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-[rgb(var(--color-text-secondary))]">Subtotal</span><span>RM {(selectedOrder.subtotal / 100).toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[rgb(var(--color-text-secondary))]">SST (6%)</span><span>RM {(selectedOrder.tax_amount / 100).toFixed(2)}</span></div>
                <div className="flex justify-between text-base font-bold pt-1"><span>Total</span><span className="text-[rgb(var(--color-brand-500))]">RM {(selectedOrder.total / 100).toFixed(2)}</span></div>
              </div>

              {/* Payment Method */}
              <div className="border-t border-[rgb(var(--color-border-default))] pt-3">
                <p className="text-xs font-medium text-[rgb(var(--color-text-secondary))] mb-2">Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map((pm) => {
                    const Icon = pm.icon;
                    return (
                      <button
                        key={pm.id}
                        onClick={() => setSelectedPayment(pm.id)}
                        className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-xs font-medium transition-all ${selectedPayment === pm.id ? pm.color + ' border-current' : 'border-[rgb(var(--color-border-default))] text-[rgb(var(--color-text-secondary))]'}`}
                      >
                        <Icon className="h-4 w-4" />
                        {pm.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Process Button */}
              <button
                onClick={processPayment}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[rgb(var(--color-brand-500))] py-3.5 text-sm font-semibold text-white shadow-md hover:bg-[rgb(var(--color-brand-600))] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <Receipt className="h-5 w-5" />
                {processing ? 'Processing...' : `Pay RM ${(selectedOrder.total / 100).toFixed(2)}`}
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[rgb(var(--color-border-default))] p-12 text-center text-[rgb(var(--color-text-tertiary))]">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select an order to process payment</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function generateReceiptHTML(invoice: Invoice): string {
  const items = invoice.items.map((i) => `
    <tr><td style="text-align:left">${i.quantity}x ${i.name}</td><td style="text-align:right">RM ${(i.subtotal / 100).toFixed(2)}</td></tr>
  `).join('');

  return `<!DOCTYPE html><html><head><style>
    body { font-family: 'Courier New', monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .line { border-top: 1px dashed #000; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 2px 0; }
    .right { text-align: right; }
    .big { font-size: 16px; }
  </style></head><body>
    <div class="center bold big">YUMMY POS</div>
    <div class="center" style="font-size:10px">Restaurant Management System</div>
    <div class="center" style="font-size:10px;margin-top:4px">SST Reg No: W10-1234-56789012</div>
    <div class="line"></div>
    <div><strong>Invoice:</strong> ${invoice.invoice_number}</div>
    <div><strong>Date:</strong> ${new Date(invoice.created_at).toLocaleString('en-MY')}</div>
    <div><strong>Table:</strong> ${invoice.table_number || '-'}</div>
    <div><strong>Customer:</strong> ${invoice.customer_name || 'Walk-in'}</div>
    <div><strong>Cashier:</strong> ${invoice.cashier_name}</div>
    <div class="line"></div>
    <table>${items}</table>
    <div class="line"></div>
    <table>
      <tr><td>Subtotal</td><td class="right">RM ${(invoice.subtotal / 100).toFixed(2)}</td></tr>
      <tr><td>SST (6%)</td><td class="right">RM ${(invoice.tax_amount / 100).toFixed(2)}</td></tr>
      ${invoice.rounding !== 0 ? `<tr><td>Rounding</td><td class="right">RM ${(invoice.rounding / 100).toFixed(2)}</td></tr>` : ''}
      <tr class="bold"><td class="big">TOTAL</td><td class="right big">RM ${(invoice.total / 100).toFixed(2)}</td></tr>
    </table>
    <div class="line"></div>
    <div class="center bold">Payment: ${invoice.payment_method.replace('_', ' ').toUpperCase()}</div>
    <div class="line"></div>
    <div class="center" style="font-size:10px;margin-top:8px">Thank you for dining with us!</div>
    <div class="center" style="font-size:10px">Please come again 🍽️</div>
  </body></html>`;
}
