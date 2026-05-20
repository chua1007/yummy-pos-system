import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { orderNumber: string } }) {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE order_number = ? OR id = ?').get(params.orderNumber, params.orderNumber) as any;

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  return NextResponse.json({ ...order, items });
}
