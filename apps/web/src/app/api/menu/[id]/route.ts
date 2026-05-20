import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const body = await req.json();
  const { id } = params;

  const fields: string[] = [];
  const values: any[] = [];

  if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
  if (body.price !== undefined) { fields.push('price = ?'); values.push(body.price); }
  if (body.description !== undefined) { fields.push('description = ?'); values.push(body.description); }
  if (body.image !== undefined) { fields.push('image = ?'); values.push(body.image); }
  if (body.image_url !== undefined) { fields.push('image_url = ?'); values.push(body.image_url); }
  if (body.category_id !== undefined) { fields.push('category_id = ?'); values.push(body.category_id); }
  if (body.is_available !== undefined) { fields.push('is_available = ?'); values.push(body.is_available ? 1 : 0); }

  if (fields.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  values.push(id);
  db.prepare(`UPDATE menu_items SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(params.id);
  return NextResponse.json({ success: true });
}
