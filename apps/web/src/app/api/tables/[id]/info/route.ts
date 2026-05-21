import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

// Public endpoint - returns table info + restaurant name/logo for QR ordering
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(params.id) as any;
  if (!table) return NextResponse.json({ error: 'Table not found' }, { status: 404 });

  let restaurant = { name: 'Restaurant', logo_url: null };
  if (table.tenant_id) {
    const tenant = db.prepare('SELECT name, logo_url FROM tenants WHERE id = ?').get(table.tenant_id) as any;
    if (tenant) restaurant = tenant;
  }

  return NextResponse.json({
    ...table,
    restaurant_name: restaurant.name,
    restaurant_logo: restaurant.logo_url,
  });
}
