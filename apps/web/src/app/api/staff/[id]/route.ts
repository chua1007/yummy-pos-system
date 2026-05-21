import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const body = await req.json();
  const { id } = params;

  const fields: string[] = [];
  const values: any[] = [];

  if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
  if (body.passcode !== undefined) { fields.push('passcode = ?'); values.push(body.passcode); }
  if (body.position !== undefined) { fields.push('position = ?'); values.push(body.position); }
  if (body.is_active !== undefined) { fields.push('is_active = ?'); values.push(body.is_active ? 1 : 0); }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE cashiers SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  const cashier = db.prepare('SELECT id, name, position, is_active, created_at FROM cashiers WHERE id = ?').get(id);
  return NextResponse.json(cashier);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  db.prepare('DELETE FROM cashiers WHERE id = ?').run(params.id);
  return NextResponse.json({ success: true });
}
