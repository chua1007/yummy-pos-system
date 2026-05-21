import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

// Public endpoint - returns table info + restaurant name/logo for QR ordering
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(params.id) as any;
  if (!table) return NextResponse.json({ error: 'Table not found' }, { status: 404 });

  // Try to get restaurant name and logo from settings first (user-configured)
  let restaurantName = 'Restaurant';
  let restaurantLogo = null;

  try { db.exec(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now')))`); } catch {}

  try {
    const nameSetting = db.prepare("SELECT value FROM settings WHERE key = 'restaurant_name'").get() as any;
    const logoSetting = db.prepare("SELECT value FROM settings WHERE key = 'logo_url'").get() as any;
    if (nameSetting && nameSetting.value) restaurantName = nameSetting.value;
    if (logoSetting && logoSetting.value) restaurantLogo = logoSetting.value;
  } catch {}

  // Fallback to tenant name if settings don't have it
  if (restaurantName === 'Restaurant' && table.tenant_id) {
    const tenant = db.prepare('SELECT name, logo_url FROM tenants WHERE id = ?').get(table.tenant_id) as any;
    if (tenant) {
      restaurantName = tenant.name;
      if (!restaurantLogo && tenant.logo_url) restaurantLogo = tenant.logo_url;
    }
  }

  return NextResponse.json({
    ...table,
    restaurant_name: restaurantName,
    restaurant_logo: restaurantLogo,
  });
}
