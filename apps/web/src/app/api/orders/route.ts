import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getTenantId } from '@/lib/tenant';
import { v4 as uuid } from 'uuid';

export async function GET(req: NextRequest) {
  const db = getDb();
  const tenantId = getTenantId();
  const status = req.nextUrl.searchParams.get('status');
  const queryTenant = req.nextUrl.searchParams.get('tenant_id');
  const effectiveTenant = tenantId || queryTenant;

  let query = 'SELECT * FROM orders WHERE 1=1';
  const params: any[] = [];

  if (effectiveTenant) {
    query += ' AND (tenant_id = ? OR tenant_id IS NULL)';
    params.push(effectiveTenant);
  }

  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  const orders = db.prepare(query).all(...params);

  const ordersWithItems = orders.map((order: any) => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    return { ...order, items };
  });

  return NextResponse.json(ordersWithItems);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const tenantId = getTenantId();
  const body = await req.json();
  // Allow tenant_id from body (for QR orders)
  const effectiveTenant = tenantId || body.tenant_id || null;

  const id = uuid();
  const orderCount = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as any).count;
  const orderNumber = `ORD-${String(orderCount + 1).padStart(4, '0')}`;

  let subtotal = 0;
  const orderItems: any[] = [];

  for (const item of body.items) {
    const menuItem = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(item.menu_item_id) as any;
    if (!menuItem) continue;

    const itemSubtotal = menuItem.price * item.quantity;
    subtotal += itemSubtotal;

    orderItems.push({
      id: uuid(),
      order_id: id,
      menu_item_id: item.menu_item_id,
      name: menuItem.name,
      quantity: item.quantity,
      unit_price: menuItem.price,
      subtotal: itemSubtotal,
      notes: item.notes || null,
    });
  }

  const taxAmount = Math.round(subtotal * 0.06);
  const total = subtotal + taxAmount;

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, order_number, type, status, table_number, customer_name, subtotal, tax_amount, total, notes, tenant_id)
    VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertItem = db.prepare(`
    INSERT INTO order_items (id, order_id, menu_item_id, name, quantity, unit_price, subtotal, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const createOrder = db.transaction(() => {
    insertOrder.run(id, orderNumber, body.type || 'dine_in', body.table_number || null, body.customer_name || 'Walk-in', subtotal, taxAmount, total, body.notes || null, effectiveTenant);
    for (const item of orderItems) {
      insertItem.run(item.id, item.order_id, item.menu_item_id, item.name, item.quantity, item.unit_price, item.subtotal, item.notes);
    }
  });

  createOrder();

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);

  return NextResponse.json({ ...order, items }, { status: 201 });
}
