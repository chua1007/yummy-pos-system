import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const body = await req.json();
  const { id } = params;

  const fields: string[] = [];
  const values: any[] = [];

  if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
  if (body.quantity !== undefined) { fields.push('quantity = ?'); values.push(body.quantity); }
  if (body.min_threshold !== undefined) { fields.push('min_threshold = ?'); values.push(body.min_threshold); }
  if (body.max_capacity !== undefined) { fields.push('max_capacity = ?'); values.push(body.max_capacity); }
  if (body.unit !== undefined) { fields.push('unit = ?'); values.push(body.unit); }
  if (body.category !== undefined) { fields.push('category = ?'); values.push(body.category); }

  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE inventory SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  db.prepare('DELETE FROM inventory WHERE id = ?').run(params.id);
  return NextResponse.json({ success: true });
}
