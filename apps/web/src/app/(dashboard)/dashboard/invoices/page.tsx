'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Calendar, Receipt, Printer } from 'lucide-react';

interface InvoiceItem { name: string; quantity: number; unit_price: number; subtotal: number; }
interface Invoice { id: string; invoice_number: string; order_id: string; customer_name: string; table_number: string | null; subtotal: number; tax_amount: number; rounding: number; total: number; payment_method: string; cashier_name: string; created_at: string; items: InvoiceItem[]; }

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<{ count: number; total_revenue: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    if (paymentFilter !== 'all') params.set('payment_method', paymentFilter);

    const res = await fetch(`/api/invoices?${params}`);
    const data = await res.json();
    setInvoices(data.invoices);
    setSummary(data.summary);
    setLoading(false);
  };

  useEffect(() => { fetchInvoices(); }, [dateFrom, dateTo, paymentFilter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchInvoices(); };

  const exportCSV = () => {
    const headers = 'Invoice #,Customer,Table,Subtotal,Tax,Total,Payment,Cashier,Date\n';
    const rows = invoices.map((i) => `${i.invoice_number},${i.customer_name},${i.table_number || '-'},${(i.subtotal/100).toFixed(2)},${(i.tax_amount/100).toFixed(2)},${(i.total/100).toFixed(2)},${i.payment_method},${i.cashier_name},${i.created_at}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `invoices-${dateFrom || 'all'}.csv`; a.click();
  };

  const printInvoice = (invoice: Invoice) => {
    const w = window.open('', '_blank', 'width=350,height=600');
    if (!w) return;
    const items = invoice.items.map((i) => `<tr><td>${i.quantity}x ${i.name}</td><td style="text-align:right">RM ${(i.subtotal/100).toFixed(2)}</td></tr>`).join('');
    w.document.write(`<!DOCTYPE html><html><head><style>body{font-family:'Courier New',monospace;font-size:12px;width:280px;margin:0 auto;padding:10px}.center{text-align:center}.bold{font-weight:bold}.line{border-top:1px dashed #000;margin:8px 0}table{width:100%;border-collapse:collapse}td{padding:2px 0}.right{text-align:right}.big{font-size:16px}</style></head><body><div class="center bold big">YUMMY POS</div><div class="center" style="font-size:10px">SST Reg No: W10-1234-56789012</div><div class="line"></div><div><strong>Invoice:</strong> ${invoice.invoice_number}</div><div><strong>Date:</strong> ${new Date(invoice.created_at).toLocaleString('en-MY')}</div><div><strong>Table:</strong> ${invoice.table_number||'-'}</div><div><strong>Customer:</strong> ${invoice.customer_name}</div><div><strong>Cashier:</strong> ${invoice.cashier_name}</div><div class="line"></div><table>${items}</table><div class="line"></div><table><tr><td>Subtotal</td><td class="right">RM ${(invoice.subtotal/100).toFixed(2)}</td></tr><tr><td>SST (6%)</td><td class="right">RM ${(invoice.tax_amount/100).toFixed(2)}</td></tr><tr class="bold"><td class="big">TOTAL</td><td class="right big">RM ${(invoice.total/100).toFixed(2)}</td></tr></table><div class="line"></div><div class="center bold">Payment: ${invoice.payment_method.replace('_',' ').toUpperCase()}</div><div class="line"></div><div class="center" style="font-size:10px">Thank you!</div></body></html>`);
    w.document.close(); w.print();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text-primary))]">Invoices & Receipts</h1>
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">All payment records</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 rounded-lg border border-[rgb(var(--color-border-default))] px-4 py-2.5 text-sm font-medium text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-surface-secondary))]">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-4">
            <p className="text-xs text-[rgb(var(--color-text-tertiary))]">Total Invoices</p>
            <p className="text-2xl font-bold text-[rgb(var(--color-text-primary))]">{summary.count}</p>
          </div>
          <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-4">
            <p className="text-xs text-[rgb(var(--color-text-tertiary))]">Total Revenue</p>
            <p className="text-2xl font-bold text-[rgb(var(--color-brand-500))]">RM {(summary.total_revenue / 100).toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] p-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[rgb(var(--color-text-tertiary))]" />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded border border-[rgb(var(--color-border-default))] px-2 py-1.5 text-sm" />
          <span className="text-xs text-[rgb(var(--color-text-tertiary))]">to</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded border border-[rgb(var(--color-border-default))] px-2 py-1.5 text-sm" />
        </div>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="rounded border border-[rgb(var(--color-border-default))] px-2 py-1.5 text-sm">
          <option value="all">All Methods</option>
          <option value="cash">Cash</option><option value="card">Card</option><option value="touch_n_go">Touch n Go</option><option value="grabpay">GrabPay</option><option value="boost">Boost</option><option value="duitnow">DuitNow</option>
        </select>
        <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2 min-w-[200px]">
          <div className="flex flex-1 items-center gap-2 rounded border border-[rgb(var(--color-border-default))] px-2 py-1.5">
            <Search className="h-4 w-4 text-[rgb(var(--color-text-tertiary))]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice # or customer..." className="flex-1 bg-transparent text-sm focus:outline-none" />
          </div>
          <button type="submit" className="rounded bg-[rgb(var(--color-brand-500))] px-3 py-1.5 text-sm text-white">Search</button>
        </form>
      </div>

      {/* Invoice Table */}
      <div className="rounded-xl border border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-primary))] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[rgb(var(--color-text-tertiary))]">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-[rgb(var(--color-text-tertiary))]">No invoices found. Process payments from the Cashier page.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgb(var(--color-border-default))] bg-[rgb(var(--color-surface-secondary))]">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Cashier</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-[rgb(var(--color-text-tertiary))]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--color-border-subtle))]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[rgb(var(--color-surface-secondary))] transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-[rgb(var(--color-brand-500))]">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-sm text-[rgb(var(--color-text-secondary))]">{inv.customer_name} {inv.table_number ? `(${inv.table_number})` : ''}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[rgb(var(--color-text-primary))]">RM {(inv.total / 100).toFixed(2)}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-[rgb(var(--color-surface-secondary))] px-2 py-0.5 text-xs font-medium capitalize text-[rgb(var(--color-text-secondary))]">{inv.payment_method.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3 text-sm text-[rgb(var(--color-text-secondary))]">{inv.cashier_name}</td>
                  <td className="px-4 py-3 text-xs text-[rgb(var(--color-text-tertiary))]">{new Date(inv.created_at).toLocaleString('en-MY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => printInvoice(inv)} className="rounded p-1.5 hover:bg-[rgb(var(--color-surface-tertiary))] text-[rgb(var(--color-text-tertiary))] hover:text-[rgb(var(--color-brand-500))]"><Printer className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
