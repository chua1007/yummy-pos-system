import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getAuthUser, hashPassword } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function GET() {
  const user = getAuthUser();
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const db = getDb();
  const tenants = db.prepare(`
    SELECT t.*, 
      (SELECT COUNT(*) FROM users WHERE tenant_id = t.id) as user_count,
      (SELECT COUNT(*) FROM orders WHERE 1=1) as order_count
    FROM tenants t ORDER BY t.created_at DESC
  `).all();

  return NextResponse.json(tenants);
}

export async function POST(req: NextRequest) {
  const user = getAuthUser();
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const db = getDb();
  const body = await req.json();

  const tenantId = uuid();
  const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Create tenant
  db.prepare(`
    INSERT INTO tenants (id, name, slug, plan, status, address, phone, email, currency, tax_rate)
    VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)
  `).run(tenantId, body.name, slug, body.plan || 'starter', body.address || null, body.phone || null, body.email || null, body.currency || 'MYR', body.tax_rate || 6.0);

  // Create owner account
  const ownerId = uuid();
  const passwordHash = hashPassword(body.owner_password || 'password123');
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, tenant_id)
    VALUES (?, ?, ?, ?, 'restaurant_owner', ?)
  `).run(ownerId, body.owner_email, passwordHash, body.owner_name || body.name, tenantId);

  // Update tenant with owner
  db.prepare('UPDATE tenants SET owner_id = ? WHERE id = ?').run(ownerId, tenantId);

  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId);
  return NextResponse.json(tenant, { status: 201 });
}
