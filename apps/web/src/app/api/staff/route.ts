import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getTenantId } from '@/lib/tenant';
import { v4 as uuid } from 'uuid';

// Ensure cashiers table exists
function ensureCashierTable(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cashiers (
      id TEXT PRIMARY KEY,
      tenant_id TEXT,
      name TEXT NOT NULL,
      passcode TEXT NOT NULL,
      position TEXT DEFAULT 'Cashier',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
}

export async function GET() {
  const db = getDb();
  ensureCashierTable(db);
  const tenantId = getTenantId();
  if (!tenantId) return NextResponse.json([]);

  const cashiers = db.prepare('SELECT id, name, position, is_active, created_at FROM cashiers WHERE tenant_id = ? ORDER BY name').all(tenantId);
  return NextResponse.json(cashiers);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  ensureCashierTable(db);
  const tenantId = getTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const body = await req.json();
  if (!body.name || !body.passcode) {
    return NextResponse.json({ error: 'Name and 4-digit passcode are required' }, { status: 400 });
  }
  if (body.passcode.length !== 4 || !/^\d{4}$/.test(body.passcode)) {
    return NextResponse.json({ error: 'Passcode must be exactly 4 digits' }, { status: 400 });
  }

  const id = uuid();
  db.prepare('INSERT INTO cashiers (id, tenant_id, name, passcode, position) VALUES (?, ?, ?, ?, ?)').run(id, tenantId, body.name, body.passcode, body.position || 'Cashier');

  const cashier = db.prepare('SELECT id, name, position, is_active, created_at FROM cashiers WHERE id = ?').get(id);
  return NextResponse.json(cashier, { status: 201 });
}
