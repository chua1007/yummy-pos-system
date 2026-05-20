import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser();
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const db = getDb();
  const body = await req.json();
  const { id } = params;

  const fields: string[] = [];
  const values: any[] = [];

  if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
  if (body.plan !== undefined) { fields.push('plan = ?'); values.push(body.plan); }
  if (body.status !== undefined) { fields.push('status = ?'); values.push(body.status); }
  if (body.address !== undefined) { fields.push('address = ?'); values.push(body.address); }
  if (body.phone !== undefined) { fields.push('phone = ?'); values.push(body.phone); }
  if (body.email !== undefined) { fields.push('email = ?'); values.push(body.email); }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE tenants SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(id);
  return NextResponse.json(tenant);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser();
  if (!user || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const db = getDb();
  db.prepare('DELETE FROM users WHERE tenant_id = ?').run(params.id);
  db.prepare('DELETE FROM tenants WHERE id = ?').run(params.id);
  return NextResponse.json({ success: true });
}
