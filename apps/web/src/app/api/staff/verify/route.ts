import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getTenantId } from '@/lib/tenant';

// Verify cashier passcode for switching
export async function POST(req: NextRequest) {
  const db = getDb();
  db.exec(`CREATE TABLE IF NOT EXISTS cashiers (id TEXT PRIMARY KEY, tenant_id TEXT, name TEXT NOT NULL, passcode TEXT NOT NULL, position TEXT DEFAULT 'Cashier', is_active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')))`);

  const tenantId = getTenantId();
  const body = await req.json();

  if (!body.cashier_id || !body.passcode) {
    return NextResponse.json({ error: 'Cashier ID and passcode required' }, { status: 400 });
  }

  const cashier = db.prepare('SELECT * FROM cashiers WHERE id = ? AND tenant_id = ? AND is_active = 1').get(body.cashier_id, tenantId) as any;
  if (!cashier) return NextResponse.json({ error: 'Cashier not found' }, { status: 404 });

  if (cashier.passcode !== body.passcode) {
    return NextResponse.json({ error: 'Incorrect passcode' }, { status: 401 });
  }

  return NextResponse.json({ success: true, cashier: { id: cashier.id, name: cashier.name, position: cashier.position } });
}
