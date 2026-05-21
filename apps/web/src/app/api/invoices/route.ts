import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getTenantId, getCurrentUser } from '@/lib/tenant';
import { v4 as uuid } from 'uuid';

export async function GET(req: NextRequest) {
  const db = getDb();
  const tenantId = getTenantId();
  const search = req.nextUrl.searchParams.get('search');
  const dateFrom = req.nextUrl.searchParams.get('from');
  const dateTo = req.nextUrl.searchParams.get('to');
  const paymentMethod = req.nextUrl.searchParams.get('payment_method');

  // Ensure service_tax_amount column exists
  try { db.exec('ALTER TABLE invoices ADD COLUMN service_tax_amount INTEGER DEFAULT 0'); } catch {}
  try { db.exec('ALTER TABLE invoices ADD COLUMN sst_rate REAL DEFAULT 6'); } catch {}
  try { db.exec('ALTER TABLE invoices ADD COLUMN service_tax_rate REAL DEFAULT 0'); } catch {}

  let where = '1=1';
  const params: any[] = [];

  if (tenantId) { where += ' AND i.tenant_id = ?'; params.push(tenantId); }
  if (search) { where += ' AND (i.invoice_number LIKE ? OR i.customer_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (dateFrom) { where += ' AND date(i.created_at) >= date(?)'; params.push(dateFrom); }
  if (dateTo) { where += ' AND date(i.created_at) <= date(?)'; params.push(dateTo); }
  if (paymentMethod && paymentMethod !== 'all') { where += ' AND i.payment_method = ?'; params.push(paymentMethod); }

  const invoices = db.prepare(`SELECT i.* FROM invoices i WHERE ${where} ORDER BY i.created_at DESC LIMIT 100`).all(...params);

  const result = (invoices as any[]).map((inv: any) => {
    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(inv.id);
    return { ...inv, items };
  });

  const summary = db.prepare(`SELECT COUNT(*) as count, COALESCE(SUM(i.total), 0) as total_revenue FROM invoices i WHERE ${where}`).get(...params) as any;

  return NextResponse.json({ invoices: result, summary });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const tenantId = getTenantId();
  const user = getCurrentUser();
  const body = await req.json();

  // Ensure columns exist
  try { db.exec('ALTER TABLE invoices ADD COLUMN service_tax_amount INTEGER DEFAULT 0'); } catch {}
  try { db.exec('ALTER TABLE invoices ADD COLUMN sst_rate REAL DEFAULT 6'); } catch {}
  try { db.exec('ALTER TABLE invoices ADD COLUMN service_tax_rate REAL DEFAULT 0'); } catch {}

  const orderId = body.order_id;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId) as any[];

  // Get tax rates from settings
  try { db.exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now')))`); } catch {}
  let sstRate = 6;
  let serviceRate = 0;
  try {
    const sst = db.prepare("SELECT value FROM settings WHERE key = 'tax_rate'").get() as any;
    const service = db.prepare("SELECT value FROM settings WHERE key = 'service_tax'").get() as any;
    if (sst) sstRate = parseFloat(sst.value);
    if (service) serviceRate = parseFloat(service.value);
  } catch {}

  // Generate invoice number
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const invoiceCount = (db.prepare("SELECT COUNT(*) as count FROM invoices WHERE date(created_at) = date('now')").get() as any).count;
  const invoiceNumber = `INV-${today}-${String(invoiceCount + 1).padStart(4, '0')}`;

  // Calculate from order subtotal with CURRENT tax rates
  const subtotal = order.subtotal;
  const sstAmount = Math.round(subtotal * (sstRate / 100));
  const serviceTaxAmount = Math.round(subtotal * (serviceRate / 100));
  const totalTax = sstAmount + serviceTaxAmount;
  const discountAmount = body.discount_amount || 0;
  const beforeRounding = subtotal + totalTax - discountAmount;
  // Malaysian rounding to nearest 5 sen
  const rounding = Math.round(beforeRounding / 5) * 5 - beforeRounding;
  const total = beforeRounding + rounding;

  const invoiceId = uuid();
  const cashierName = body.cashier_name || user?.name || 'Cashier';

  const insertInvoice = db.prepare(`
    INSERT INTO invoices (id, tenant_id, order_id, invoice_number, customer_name, table_number, subtotal, tax_amount, service_tax_amount, sst_rate, service_tax_rate, discount_amount, rounding, total, payment_method, cashier_name, cashier_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertItem = db.prepare('INSERT INTO invoice_items (id, invoice_id, name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)');

  const createInvoice = db.transaction(() => {
    insertInvoice.run(invoiceId, tenantId, orderId, invoiceNumber, order.customer_name, order.table_number, subtotal, sstAmount, serviceTaxAmount, sstRate, serviceRate, discountAmount, rounding, total, body.payment_method || 'cash', cashierName, user?.id || null, body.notes || null);

    for (const item of orderItems) {
      insertItem.run(uuid(), invoiceId, item.name, item.quantity, item.unit_price, item.subtotal);
    }

    // Mark order as completed and paid
    db.prepare("UPDATE orders SET status = 'completed', payment_method = ?, payment_status = 'paid', completed_at = datetime('now') WHERE id = ?").run(body.payment_method || 'cash', orderId);
  });

  createInvoice();

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId) as any;
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(invoiceId);

  return NextResponse.json({ ...invoice, items }, { status: 201 });
}
