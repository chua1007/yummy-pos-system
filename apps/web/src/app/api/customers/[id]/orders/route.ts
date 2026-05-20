import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(params.id);
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  const orders = db.prepare(
    'SELECT * FROM orders WHERE customer_name = (SELECT name FROM customers WHERE id = ?) ORDER BY created_at DESC LIMIT 50'
  ).all(params.id) as any[];

  const ordersWithItems = orders.map((order: any) => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    return { ...order, items };
  });

  // Calculate stats
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_orders,
      COALESCE(SUM(total), 0) as total_spent,
      COALESCE(AVG(total), 0) as avg_order,
      MAX(created_at) as last_order_at
    FROM orders WHERE customer_name = (SELECT name FROM customers WHERE id = ?)
  `).get(params.id) as any;

  return NextResponse.json({ customer, orders: ordersWithItems, stats });
}
