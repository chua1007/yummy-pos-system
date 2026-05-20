import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import QRCode from 'qrcode';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const body = await req.json();
  const { id } = params;

  const fields: string[] = [];
  const values: any[] = [];

  if (body.table_number !== undefined) { fields.push('table_number = ?'); values.push(body.table_number); }
  if (body.capacity !== undefined) { fields.push('capacity = ?'); values.push(body.capacity); }
  if (body.zone !== undefined) { fields.push('zone = ?'); values.push(body.zone); }
  if (body.status !== undefined) { fields.push('status = ?'); values.push(body.status); }
  if (body.current_order_id !== undefined) { fields.push('current_order_id = ?'); values.push(body.current_order_id); }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE tables SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(id);
  return NextResponse.json(table);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  db.prepare('DELETE FROM tables WHERE id = ?').run(params.id);
  return NextResponse.json({ success: true });
}
