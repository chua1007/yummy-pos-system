import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { v4 as uuid } from 'uuid';

export async function GET(req: NextRequest) {
  const db = getDb();
  const status = req.nextUrl.searchParams.get('status');

  let query = 'SELECT * FROM orders';
  const params: any[] = [];

  if (status && status !== 'all') {
    query += ' WHERE status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC';

  const orders = db.prepare(query).all(...params);

  // Get items for each order
  const ordersWithItems = orders.map((order: any) => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    return { ...order, items };
  });

  return NextResponse.json(ordersWithItems);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();

  const id = uuid();
  const orderCount = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as any).count;
  const orderNumber = `ORD-${String(orderCount + 1).padStart(4, '0')}`;

  // Calculate totals
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

  const taxAmount = Math.round(subtotal * 0.06); // 6% SST
  const total = subtotal + taxAmount;

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, order_number, type, status, table_number, customer_name, subtotal, tax_amount, total, notes)
    VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)
  `);

  const insertItem = db.prepare(`
    INSERT INTO order_items (id, order_id, menu_item_id, name, quantity, unit_price, subtotal, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const createOrder = db.transaction(() => {
    insertOrder.run(id, orderNumber, body.type || 'dine_in', body.table_number || null, body.customer_name || 'Walk-in', subtotal, taxAmount, total, body.notes || null);
    for (const item of orderItems) {
      insertItem.run(item.id, item.order_id, item.menu_item_id, item.name, item.quantity, item.unit_price, item.subtotal, item.notes);
    }
  });

  createOrder();

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);

  return NextResponse.json({ ...order, items }, { status: 201 });
}
