import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { v4 as uuid } from 'uuid';

export async function GET() {
  const db = getDb();
  const customers = db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all();
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const id = uuid();

  db.prepare(
    'INSERT INTO customers (id, name, email, phone, notes) VALUES (?, ?, ?, ?, ?)'
  ).run(id, body.name, body.email || null, body.phone || null, body.notes || null);

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  return NextResponse.json(customer, { status: 201 });
}
