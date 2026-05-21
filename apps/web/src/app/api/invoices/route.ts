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

  let where = '1=1';
  const params: any[] = [];

  if (tenantId) { where += ' AND i.tenant_id = ?'; params.push(tenantId); }
  if (search) { where += ' AND (i.invoice_number LIKE ? OR i.customer_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (dateFrom) { where += ' AND date(i.created_at) >= date(?)'; params.push(dateFrom); }
  if (dateTo) { where += ' AND date(i.created_at) <= date(?)'; params.push(dateTo); }
  if (paymentMethod && paymentMethod !== 'all') { where += ' AND i.payment_method = ?'; params.push(paymentMethod); }

  const invoices = db.prepare(`SELECT i.* FROM invoices i WHERE ${where} ORDER BY i.created_at DESC LIMIT 100`).all(...params);

  // Get items for each invoice
  const result = (invoices as any[]).map((inv: any) => {
    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(inv.id);
    return { ...inv, items };
  });

  // Summary
  const summary = db.prepare(`SELECT COUNT(*) as count, COALESCE(SUM(i.total), 0) as total_revenue FROM invoices i WHERE ${where}`).get(...params) as any;

  return NextResponse.json({ invoices: result, summary });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const tenantId = getTenantId();
  const user = getCurrentUser();
  const body = await req.json();

  const orderId = body.order_id;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId) as any[];

  // Generate invoice number: INV-YYYYMMDD-XXXX
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const invoiceCount = (db.prepare("SELECT COUNT(*) as count FROM invoices WHERE date(created_at) = date('now')").get() as any).count;
  const invoiceNumber = `INV-${today}-${String(invoiceCount + 1).padStart(4, '0')}`;

  // Calculate rounding (Malaysian rounding to nearest 5 sen)
  const subtotal = order.subtotal;
  const taxAmount = order.tax_amount;
  const discountAmount = body.discount_amount || 0;
  const beforeRounding = subtotal + taxAmount - discountAmount;
  const rounding = Math.round(beforeRounding / 5) * 5 - beforeRounding;
  const total = beforeRounding + rounding;

  const invoiceId = uuid();

  const insertInvoice = db.prepare(`
    INSERT INTO invoices (id, tenant_id, order_id, invoice_number, customer_name, table_number, subtotal, tax_amount, discount_amount, rounding, total, payment_method, cashier_name, cashier_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertItem = db.prepare('INSERT INTO invoice_items (id, invoice_id, name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)');

  const createInvoice = db.transaction(() => {
    insertInvoice.run(invoiceId, tenantId, orderId, invoiceNumber, order.customer_name, order.table_number, subtotal, taxAmount, discountAmount, rounding, total, body.payment_method || 'cash', user?.name || 'Cashier', user?.id || null, body.notes || null);

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
