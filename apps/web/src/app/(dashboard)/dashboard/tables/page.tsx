'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, QrCode, X, Check, Users, Trash2, Download } from 'lucide-react';

interface Table {
  id: string; table_number: string; capacity: number; zone: string; status: string; qr_code_url: string | null; current_order_id: string | null;
}

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-700 border-green-200',
  occupied: 'bg-red-100 text-red-700 border-red-200',
  reserved: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  cleaning: 'bg-blue-100 text-blue-700 border-blue-200',
};

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showQR, setShowQR] = useState<Table | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);

  const fetchTables = async () => {
    const res = await fetch('/api/tables');
    setTables(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchTables(); }, []);

  const updateStatus = async (table: Table, status: string) => {
    const res = await fetch(`/api/tables/${table.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const updated = await res.json();
    setTables(tables.map((t) => (t.id === updated.id ? updated : t)));
  };

  const deleteTable = async (id: string) => {
    if (!confirm('Delete this table?')) return;
    await fetch(`/api/tables/${id}`, { method: 'DELETE' });
    setTables(tables.filter((t) => t.id !== id));
  };

  const viewQR = async (table: Table) => {
    setShowQR(table);
    const res = await fetch(`/api/tables/${table.id}/qr`);
    const data = await res.json();
    setQrData(data.qr_code_url);
  };

  const downloadQR = () => {
    if (!qrData || !showQR) return;
    const link = document.createElement('a');
    link.download = `QR-${showQR.table_number}.png`;
    link.href = qrData;
    link.click();
  };

  const zones = [...new Set(tables.map((t) => t.zone))];

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--color-text-primary))]">Table Management</h1>
          <p className="text-sm text-[rgb(var(--color-text-secondary))]">{tables.length} tables · {tables.filter((t) => t.status === 'available').length} available</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded-lg bg-[rgb(var(--color-brand-500))] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[rgb(var(--color-brand-600))]">
          <Plus className="h-4 w-4" /> Add Table
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {['available', 'occupied', 'reserved', 'cleaning'].map((s) => (
          <div key={s} className={`rounded-lg border p-3 text-center ${statusColors[s]}`}>
            <p className="text-2xl font-bold">{tables.filter((t) => t.status === s).length}</p>
            <p className="text-xs font-medium capitalize">{s}</p>
          </div>
        ))}
      </div>

      {/* Tables by Zone */}
      {zones.map((zone) => (
        <div key={zone}>
          <h3 className="text-sm font-semibold text-[rgb(var(--color-text-secondary))] mb-3">{zone} Area</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {tables.filter((t) => t.zone === zone).map((table) => (
              <motion.div
                key={table.id}
                whileHover={{ y: -2 }}
                className={`relative rounded-xl border-2 p-4 text-center transition-shadow hover:shadow-md ${statusColors[table.status]}`}
              >
                <button onClick={() => deleteTable(table.id)} className="absolute top-2 right-2 rounded p-0.5 opacity-0 hover:opacity-100 transition-opacity text-red-400 hover:text-red-600">
                  <Trash2 className="h-3 w-3" />
                </button>
                <p className="text-lg font-bold">{table.table_number}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Users className="h-3 w-3" />
                  <span className="text-xs">{table.capacity} pax</span>
                </div>
                <p className="mt-1 text-xs font-medium capitalize">{table.status}</p>

                {/* Actions */}
                <div className="mt-3 flex gap-1 justify-center">
                  <button onClick={() => viewQR(table)} className="rounded bg-white/80 p-1.5 text-xs hover:bg-white" title="View QR">
                    <QrCode className="h-3.5 w-3.5" />
                  </button>
                  {table.status === 'available' && (
                    <button onClick={() => updateStatus(table, 'occupied')} className="rounded bg-white/80 px-2 py-1 text-xs hover:bg-white">Seat</button>
                  )}
                  {table.status === 'occupied' && (
                    <button onClick={() => updateStatus(table, 'cleaning')} className="rounded bg-white/80 px-2 py-1 text-xs hover:bg-white">Clear</button>
                  )}
                  {table.status === 'cleaning' && (
                    <button onClick={() => updateStatus(table, 'available')} className="rounded bg-white/80 px-2 py-1 text-xs hover:bg-white">Ready</button>
                  )}
                  {table.status === 'reserved' && (
                    <button onClick={() => updateStatus(table, 'occupied')} className="rounded bg-white/80 px-2 py-1 text-xs hover:bg-white">Arrive</button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setShowQR(null); setQrData(null); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl bg-[rgb(var(--color-surface-primary))] p-6 shadow-xl text-center">
              <h2 className="text-lg font-semibold mb-1">QR Code - {showQR.table_number}</h2>
              <p className="text-xs text-[rgb(var(--color-text-tertiary))] mb-4">Customers scan to order from this table</p>
              {qrData ? (
                <img src={qrData} alt={`QR for ${showQR.table_number}`} className="mx-auto w-64 h-64 rounded-lg border" />
              ) : (
                <div className="mx-auto w-64 h-64 rounded-lg bg-[rgb(var(--color-surface-secondary))] animate-pulse" />
              )}
              <div className="mt-4 flex gap-3">
                <button onClick={() => { setShowQR(null); setQrData(null); }} className="flex-1 rounded-lg border border-[rgb(var(--color-border-default))] py-2 text-sm font-medium">Close</button>
                <button onClick={downloadQR} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[rgb(var(--color-brand-500))] py-2 text-sm font-medium text-white hover:bg-[rgb(var(--color-brand-600))]">
                  <Download className="h-4 w-4" /> Download
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Table Modal */}
      <AnimatePresence>
        {showAdd && <AddTableModal onClose={() => setShowAdd(false)} onAdded={(t) => { setTables([...tables, t]); setShowAdd(false); }} />}
      </AnimatePresence>
    </motion.div>
  );
}

function AddTableModal({ onClose, onAdded }: { onClose: () => void; onAdded: (t: Table) => void }) {
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [zone, setZone] = useState('Main');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/tables', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table_number: tableNumber, capacity: parseInt(capacity), zone }) });
    onAdded(await res.json());
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.form initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="w-full max-w-md rounded-xl bg-[rgb(var(--color-surface-primary))] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Add Table</h2><button type="button" onClick={onClose}><X className="h-5 w-5 text-[rgb(var(--color-text-tertiary))]" /></button></div>
        <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">Table Number *</label><input required value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="T-11" className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" /></div>
        <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">Capacity (pax)</label><input type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]" /></div>
        <div><label className="text-sm font-medium text-[rgb(var(--color-text-secondary))]">Zone</label>
          <select value={zone} onChange={(e) => setZone(e.target.value)} className="mt-1 w-full rounded-lg border border-[rgb(var(--color-border-default))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-brand-500))]">
            <option>Main</option><option>Window</option><option>Outdoor</option><option>Private</option><option>Bar</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[rgb(var(--color-border-default))] py-2.5 text-sm font-medium">Cancel</button>
          <button type="submit" disabled={saving || !tableNumber} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[rgb(var(--color-brand-500))] py-2.5 text-sm font-medium text-white disabled:opacity-50"><Check className="h-4 w-4" />{saving ? 'Saving...' : 'Add Table'}</button>
        </div>
      </motion.form>
    </motion.div>
  );
}
