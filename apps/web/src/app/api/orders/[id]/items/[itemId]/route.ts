import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const db = getDb();

  // Get the item to subtract from order total
  const item = db.prepare('SELECT * FROM order_items WHERE id = ? AND order_id = ?').get(params.itemId, params.id) as any;
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

  // Check order has more than 1 item
  const itemCount = (db.prepare('SELECT COUNT(*) as count FROM order_items WHERE order_id = ?').get(params.id) as any).count;
  if (itemCount <= 1) return NextResponse.json({ error: 'Cannot remove the last item. Cancel the order instead.' }, { status: 400 });

  // Remove item
  db.prepare('DELETE FROM order_items WHERE id = ?').run(params.itemId);

  // Recalculate order totals
  const remaining = db.prepare('SELECT COALESCE(SUM(subtotal), 0) as subtotal FROM order_items WHERE order_id = ?').get(params.id) as any;
  const newSubtotal = remaining.subtotal;
  const newTax = Math.round(newSubtotal * 0.06);
  const newTotal = newSubtotal + newTax;

  db.prepare('UPDATE orders SET subtotal = ?, tax_amount = ?, total = ? WHERE id = ?').run(newSubtotal, newTax, newTotal, params.id);

  // Return updated order
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(params.id) as Record<string, unknown>;
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(params.id);
  return NextResponse.json({ ...order, items });
}
