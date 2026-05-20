import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getTenantId } from '@/lib/tenant';
import { v4 as uuid } from 'uuid';

export async function GET(req: NextRequest) {
  const db = getDb();
  const tenantId = getTenantId();
  // For QR ordering pages, tenant comes from query param
  const queryTenant = req.nextUrl.searchParams.get('tenant_id');
  const effectiveTenant = tenantId || queryTenant;

  let categories, items;
  if (effectiveTenant) {
    categories = db.prepare('SELECT * FROM menu_categories WHERE tenant_id = ? ORDER BY sort_order').all(effectiveTenant);
    items = db.prepare('SELECT * FROM menu_items WHERE tenant_id = ? ORDER BY created_at DESC').all(effectiveTenant);
  } else {
    categories = db.prepare('SELECT * FROM menu_categories ORDER BY sort_order').all();
    items = db.prepare('SELECT * FROM menu_items ORDER BY created_at DESC').all();
  }
  return NextResponse.json({ categories, items });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const tenantId = getTenantId();
  const body = await req.json();

  if (body.type === 'category') {
    const id = uuid();
    db.prepare('INSERT INTO menu_categories (id, name, emoji, sort_order, tenant_id) VALUES (?, ?, ?, ?, ?)').run(
      id, body.name, body.emoji || '🍽️', body.sort_order || 0, tenantId
    );
    return NextResponse.json({ id, ...body }, { status: 201 });
  }

  // Menu item
  const id = uuid();
  db.prepare(
    'INSERT INTO menu_items (id, category_id, name, description, price, image, image_url, tenant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, body.category_id, body.name, body.description || null, body.price, body.image || '🍽️', body.image_url || null, tenantId);

  const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  return NextResponse.json(item, { status: 201 });
}
