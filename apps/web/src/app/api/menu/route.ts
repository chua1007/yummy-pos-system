import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { v4 as uuid } from 'uuid';

export async function GET() {
  const db = getDb();
  const categories = db.prepare('SELECT * FROM menu_categories ORDER BY sort_order').all();
  const items = db.prepare('SELECT * FROM menu_items ORDER BY created_at DESC').all();
  return NextResponse.json({ categories, items });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();

  if (body.type === 'category') {
    const id = uuid();
    db.prepare('INSERT INTO menu_categories (id, name, emoji, sort_order) VALUES (?, ?, ?, ?)').run(
      id, body.name, body.emoji || '🍽️', body.sort_order || 0
    );
    return NextResponse.json({ id, ...body }, { status: 201 });
  }

  // Menu item
  const id = uuid();
  db.prepare(
    'INSERT INTO menu_items (id, category_id, name, description, price, image, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, body.category_id, body.name, body.description || null, body.price, body.image || '🍽️', body.image_url || null);

  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  return NextResponse.json(item, { status: 201 });
}
