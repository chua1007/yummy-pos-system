import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

// Clear a table - completes pending orders, sets to cleaning
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(params.id) as any;
  if (!table) return NextResponse.json({ error: 'Table not found' }, { status: 404 });

  // Complete any pending orders for this table
  db.prepare(`
    UPDATE orders SET status = 'completed', completed_at = datetime('now') 
    WHERE table_number = ? AND status NOT IN ('completed', 'cancelled')
  `).run(table.table_number);

  // Set table to cleaning, clear QR
  db.prepare('UPDATE tables SET status = ?, current_order_id = NULL WHERE id = ?').run('cleaning', params.id);

  const updated = db.prepare('SELECT * FROM tables WHERE id = ?').get(params.id);
  return NextResponse.json(updated);
}
