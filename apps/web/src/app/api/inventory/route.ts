import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { v4 as uuid } from 'uuid';

export async function GET() {
  const db = getDb();
  const items = db.prepare('SELECT * FROM inventory ORDER BY name').all();
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const id = uuid();

  db.prepare(
    'INSERT INTO inventory (id, name, unit, quantity, min_threshold, max_capacity, cost_per_unit, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, body.name, body.unit, body.quantity || 0, body.min_threshold || 0, body.max_capacity || 100, body.cost_per_unit || 0, body.category || null);

  const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
  return NextResponse.json(item, { status: 201 });
}
