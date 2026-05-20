import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const body = await req.json();
  const { id } = params;

  if (body.status) {
    const completedAt = body.status === 'completed' ? new Date().toISOString() : null;
    db.prepare('UPDATE orders SET status = ?, completed_at = ? WHERE id = ?').run(body.status, completedAt, id);
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  return NextResponse.json({ ...order, items });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  db.prepare('DELETE FROM orders WHERE id = ?').run(params.id);
  return NextResponse.json({ success: true });
}
