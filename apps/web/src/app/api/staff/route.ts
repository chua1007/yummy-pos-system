import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getTenantId } from '@/lib/tenant';
import { hashPassword } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function GET() {
  const db = getDb();
  const tenantId = getTenantId();
  if (!tenantId) return NextResponse.json([]);

  const staff = db.prepare("SELECT id, email, name, role, is_active, created_at, last_login_at FROM users WHERE tenant_id = ? AND role != 'restaurant_owner' ORDER BY created_at DESC").all(tenantId);
  return NextResponse.json(staff);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const tenantId = getTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const body = await req.json();
  if (!body.name || !body.email || !body.password) {
    return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
  }

  // Check email not taken
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(body.email);
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });

  const id = uuid();
  const passwordHash = hashPassword(body.password);
  const role = body.role || 'staff'; // staff, cashier, manager

  db.prepare('INSERT INTO users (id, email, password_hash, name, role, tenant_id) VALUES (?, ?, ?, ?, ?, ?)').run(id, body.email, passwordHash, body.name, role, tenantId);

  const user = db.prepare('SELECT id, email, name, role, is_active, created_at FROM users WHERE id = ?').get(id);
  return NextResponse.json(user, { status: 201 });
}
