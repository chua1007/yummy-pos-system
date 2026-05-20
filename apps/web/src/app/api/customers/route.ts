import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getTenantId } from '@/lib/tenant';
import { v4 as uuid } from 'uuid';

export async function GET() {
  const db = getDb();
  const tenantId = getTenantId();

  let customers;
  if (tenantId) {
    customers = db.prepare('SELECT * FROM customers WHERE tenant_id = ? OR tenant_id IS NULL ORDER BY created_at DESC').all(tenantId);
  } else {
    customers = db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all();
  }
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const tenantId = getTenantId();
  const body = await req.json();
  const id = uuid();

  db.prepare(
    'INSERT INTO customers (id, name, email, phone, notes, tenant_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, body.name, body.email || null, body.phone || null, body.notes || null, tenantId);

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  return NextResponse.json(customer, { status: 201 });
}
