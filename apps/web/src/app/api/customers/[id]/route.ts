import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const body = await req.json();
  const { id } = params;

  const fields: string[] = [];
  const values: any[] = [];

  if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
  if (body.email !== undefined) { fields.push('email = ?'); values.push(body.email); }
  if (body.phone !== undefined) { fields.push('phone = ?'); values.push(body.phone); }
  if (body.tier !== undefined) { fields.push('tier = ?'); values.push(body.tier); }
  if (body.notes !== undefined) { fields.push('notes = ?'); values.push(body.notes); }

  values.push(id);
  db.prepare(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  return NextResponse.json(customer);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  db.prepare('DELETE FROM customers WHERE id = ?').run(params.id);
  return NextResponse.json({ success: true });
}
